/* ================================================================
   WE ARE LEGEND — MEMBER LOOKUP (public, read-only)

   PRIVACY: this page renders ONLY what the server's publicMember
   projection returns — name, role, status, photo, joining year, and
   published awards/achievements.

   It no longer receives (and therefore cannot display) date of
   birth, parents' names, phone, email, address, emergency contacts,
   application numbers, notes, diary entries, documents, forms,
   attendance or meetings. Those fields are withheld server-side,
   not merely hidden here.
   ================================================================ */

const form = document.getElementById("lookupForm");
const input = document.getElementById("memberIdInput");
const btn = document.getElementById("lookupBtn");
const statusLine = document.getElementById("statusLine");
const resultArea = document.getElementById("resultArea");

initThemeToggle();

function setStatus(msg, kind){
  statusLine.textContent = msg || "";
  statusLine.className = "status-line" + (kind ? " " + kind : "");
}

function recRow(title, sub){
  return `<div class="rec-row">
    <div class="rec-title">${esc(title)}</div>
    ${sub ? `<div class="rec-sub">${esc(sub)}</div>` : ""}
  </div>`;
}
function sectionCard(icon, title, rows, emptyLabel){
  return `
    <div class="section-card">
      <div class="section-title"><span class="ic">${icon}</span>${esc(title)}<span class="section-count">${rows.length}</span></div>
      ${rows.length ? rows.join("") : `<div class="section-empty">${esc(emptyLabel)}</div>`}
    </div>`;
}

function renderProfile(member, awards, achievements){
  const detail = (label, value) => `
    <div class="detail-row">
      <div class="detail-label">${esc(label)}</div>
      <div class="detail-value">${esc(value || "—")}</div>
    </div>`;

  const sections = [
    sectionCard("🏆", "Awards",
      awards.map(a=>recRow(a.Title, fmtDate(a.DateAwarded))),
      "No awards on record."),
    sectionCard("🏅", "Achievements",
      achievements.map(a=>recRow(a.Title, fmtDate(a.Date))),
      "No achievements on record.")
  ];

  resultArea.innerHTML = `
    <div class="profile">
      <div class="profile-head">
        <div class="profile-photo">${member.PhotoURL
          ? `<img src="${esc(driveThumb(member.PhotoURL, 200))}" alt="" loading="lazy" decoding="async">`
          : esc(initials(member.FullName))}</div>
        <div>
          <div class="profile-name">${esc(member.FullName || "—")}</div>
          <div class="profile-role">${esc(member.Role || "Member")}</div>
          <div class="profile-badges">
            <span class="stamp">⚜ ${esc(member.MemberID)}</span>
            ${member.Status ? `<span class="badge ${esc(member.Status)}">${esc(member.Status)}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="profile-actions">
        <a class="share-btn" href="${waShareUrl('View my WE ARE LEGEND membership record: ' + location.href)}" target="_blank" rel="noopener">📱 Share via WhatsApp</a>
      </div>
      <div class="detail-grid">
        ${detail("Role", member.Role)}
        ${detail("Status", member.Status)}
        ${detail("Member Since", member.JoiningYear)}
      </div>
      <div class="sections">${sections.join("")}</div>
      <div class="privacy-note">Only information the registry publishes is shown here. Personal contact details are never public.</div>
    </div>`;
}

let looking = false;

async function doLookup(idValue){
  if (looking) return;                       // ignore double-submits
  const q = (idValue || "").trim();
  if (!q){ setStatus("Enter a Member ID to look up.", "error"); return; }

  looking = true;
  btn.disabled = true;
  const originalLabel = btn.textContent;
  btn.innerHTML = `<span class="spinner"></span>Searching…`;
  setStatus("Searching the registry…");
  resultArea.innerHTML = `<div class="profile">${skeletonCards(1,"skel-profile")}${skeletonCards(2,"skel-section")}</div>`;

  try{
    const data = await PublicAPI.member(q);
    const match = data.member;
    if (!match){
      setStatus(`No public record found for "${q}".`, "error");
      resultArea.innerHTML = `<div class="empty-hint">Member IDs look like <span style="font-family:var(--font-mono)">WAL-SD-S-A-1203-001</span>.<br><br>Only members listed in the public directory can be looked up here.</div>`;
      return;
    }

    setStatus(`Record found for ${match.FullName || match.MemberID}.`, "ok");
    const url = new URL(location.href);
    url.searchParams.set("id", match.MemberID);
    history.replaceState(null, "", url);
    renderProfile(match, data.awards || [], data.achievements || []);
  }catch(err){
    setStatus(err.message, "error");
    resultArea.innerHTML = "";
  }finally{
    looking = false;
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

form.addEventListener("submit", (e)=>{
  e.preventDefault();
  doLookup(input.value);
});

// Support shareable links like index.html?id=WAL-SD-S-A-1203-001
(function initFromQuery(){
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (id){
    input.value = id;
    doLookup(id);
  } else {
    setStatus("Enter a Member ID above and select Look Up.");
  }
})();
