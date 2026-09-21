/* ================================================================
   WE ARE LEGEND — MEMBER DIRECTORY (public)

   BEFORE: downloaded the entire Members sheet (every private field
   plus PINHash) and filtered ListedInDirectory in the browser.
   NOW: the server filters and projects, returning only opted-in
   members with five public fields each.
   ================================================================ */

initThemeToggle();

const statusLine = document.getElementById("statusLine");
const grid = document.getElementById("dirGrid");
const searchInput = document.getElementById("dirSearch");
let allMembers = [];

function setStatus(msg, kind){
  statusLine.textContent = msg || "";
  statusLine.className = "status-line" + (kind ? " " + kind : "");
}

async function loadDirectory(){
  setStatus("Loading directory…");
  grid.innerHTML = skeletonCards(6, "skel-card");
  try{
    const data = await PublicAPI.directory();
    allMembers = data.members || [];
    setStatus(allMembers.length ? "" : "No members have opted into the public directory yet.");
    draw();
  }catch(err){
    setStatus(err.message, "error");
    grid.innerHTML = "";
  }
}

function draw(){
  const q = searchInput.value.trim().toLowerCase();
  const filtered = q
    ? allMembers.filter(m => (m.FullName||"").toLowerCase().includes(q) || (m.Role||"").toLowerCase().includes(q))
    : allMembers;

  if (!filtered.length){
    grid.innerHTML = `<div class="empty-hint">No members match that search.</div>`;
    return;
  }

  // Build the whole grid once, then assign — not innerHTML += in a loop.
  grid.innerHTML = filtered.map(m => `
    <a class="dir-card" href="index.html?id=${encodeURIComponent(m.MemberID)}">
      <div class="dir-photo">${m.PhotoURL
        ? `<img src="${esc(driveThumb(m.PhotoURL,150))}" alt="" loading="lazy" decoding="async">`
        : esc(initials(m.FullName))}</div>
      <div class="dir-name">${esc(m.FullName)}</div>
      <div class="dir-role">${esc(m.Role || "Member")}</div>
    </a>`).join("");
}

// Debounced so typing doesn't re-render on every keystroke.
let searchTimer;
searchInput.addEventListener("input", ()=>{
  clearTimeout(searchTimer);
  searchTimer = setTimeout(draw, 250);
});

loadDirectory();
