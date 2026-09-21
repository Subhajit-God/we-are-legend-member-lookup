/* ================================================================
   WE ARE LEGEND — WALL OF FAME (public)

   BEFORE: fetched the whole Awards, Achievements AND Members sheets
   and joined them in the browser — exposing every private member
   field to do it.
   NOW: one server-side call returns awards/achievements already
   joined to member names, limited to directory-listed members.
   ================================================================ */

initThemeToggle();

const statusLine = document.getElementById("statusLine");
const listEl = document.getElementById("fameList");
let awards = [], achievements = [];
let activeTab = "awards";

function setStatus(msg, kind){
  statusLine.textContent = msg || "";
  statusLine.className = "status-line" + (kind ? " " + kind : "");
}

async function load(){
  setStatus("Loading…");
  listEl.innerHTML = skeletonCards(5, "skel-row");
  try{
    const data = await PublicAPI.wallOfFame();
    awards = data.awards || [];
    achievements = data.achievements || [];
    setStatus("");
    draw();
  }catch(err){
    setStatus(err.message, "error");
    listEl.innerHTML = "";
  }
}

function draw(){
  const rows = activeTab === "awards" ? awards : achievements;
  if (!rows.length){
    listEl.innerHTML = `<div class="empty-hint">Nothing on record yet.</div>`;
    return;
  }
  listEl.innerHTML = rows.map(r => `
    <div class="fame-row">
      <div class="fame-icon">${activeTab === "awards" ? "🏆" : "🏅"}</div>
      <div>
        <div class="fame-title">${esc(r.Title)}</div>
        <div class="fame-sub">${esc(r.MemberName)} · ${fmtDate(r.Date)}</div>
      </div>
    </div>`).join("");
}

// Event delegation — one listener instead of one per tab.
document.querySelector(".fame-tabs").addEventListener("click", (e)=>{
  const btn = e.target.closest(".fame-tab");
  if (!btn) return;
  document.querySelectorAll(".fame-tab").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  activeTab = btn.dataset.tab;
  draw();
});

load();
