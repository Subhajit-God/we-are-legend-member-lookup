/* ================================================================
   WE ARE LEGEND — PUBLIC API CLIENT (member-lookup)

   This site is PUBLIC and unauthenticated. It can therefore only
   reach the four public actions below, each of which returns a
   sanitized projection built server-side. There is deliberately no
   way to call `list`, `memberFull`, `search` or any admin action
   from here — those actions now require a session token the public
   site never has.
   ================================================================ */

const PublicAPI = (function(){

  const cache = new Map();          // action+args -> resolved payload
  const inFlight = new Map();       // dedupes identical concurrent requests
  const CACHE_MS = 120000;          // 2 minutes, mirrors server-side TTL

  function configured(){
    return CONFIG.API_URL && !CONFIG.API_URL.includes("YOUR_GOOGLE_APPS_SCRIPT");
  }

  async function call(action, payload, opts){
    opts = opts || {};
    if (!configured()){
      throw new Error("This page isn't connected to the registry yet. Please contact an administrator.");
    }

    const key = action + ":" + JSON.stringify(payload || {});

    if (opts.cache !== false){
      const hit = cache.get(key);
      if (hit && (Date.now() - hit.at) < CACHE_MS) return hit.value;
      if (inFlight.has(key)) return inFlight.get(key);   // dedupe double-clicks
    }

    const promise = (async ()=>{
      let res;
      try{
        res = await fetch(CONFIG.API_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(Object.assign({ action }, payload || {}))
        });
      }catch(e){
        throw new Error("Couldn't reach the registry. Check your connection and try again.");
      }
      if (!res.ok) throw new Error("Couldn't reach the registry. Please try again.");

      let data;
      try{ data = await res.json(); }
      catch(e){ throw new Error("The registry returned an unexpected response. Please try again."); }

      if (data && data.error) throw new Error(data.error);
      if (opts.cache !== false) cache.set(key, { value: data, at: Date.now() });
      return data;
    })().finally(()=> inFlight.delete(key));

    if (opts.cache !== false) inFlight.set(key, promise);
    return promise;
  }

  return {
    directory(){ return call("publicDirectory", {}); },
    member(memberId){ return call("publicMember", { memberId }); },
    search(query){ return call("publicSearch", { query }); },
    wallOfFame(){ return call("publicWallOfFame", {}); }
  };
})();

/* ---------------- shared helpers ---------------- */

function esc(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function fmtDate(d){
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString(undefined, { year:"numeric", month:"long", day:"numeric" });
}
function initials(name){
  if (!name) return "?";
  return name.trim().split(/\s+/).map(p=>p[0]).join("").toUpperCase().slice(0,2);
}
/* Requests a small, fast-loading resized version of a Drive-hosted
   photo instead of the (potentially multi-MB) original. */
function driveThumb(url, size){
  if (!url) return url;
  if (url.indexOf("lh3.googleusercontent.com") === -1) return url;
  return url.replace(/=s\d+.*$/, "").replace(/=w\d+.*$/, "") + "=s" + size;
}
function waShareUrl(text){
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/* ---------------- theme toggle (shared by all three pages) ---------------- */
function initThemeToggle(){
  const THEME_KEY = "WAL_LOOKUP_THEME";
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;
  function apply(theme){
    document.documentElement.setAttribute("data-theme", theme);
    toggle.textContent = theme === "light" ? "☀️" : "🌙";
  }
  apply(localStorage.getItem(THEME_KEY) || "dark");
  toggle.addEventListener("click", ()=>{
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, next);
    apply(next);
  });
}

/* ---------------- skeleton placeholders ---------------- */
function skeletonCards(n, cls){
  let out = "";
  for (let i=0;i<n;i++) out += `<div class="skeleton ${cls||""}"></div>`;
  return out;
}
