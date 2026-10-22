const STORAGE_KEY = "idiotic_engineers_team_members_v1";

// Keep false to hide the Admin link from the public page.
// Change to true only when you intentionally want the link visible.
const SHOW_ADMIN_LINK = false;
const $ = id => document.getElementById(id);
function loadMembers(){
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultMembers;
    let loaded = JSON.parse(saved);
    if (!Array.isArray(loaded)) return defaultMembers;
    loaded = loaded.filter(member => !(member.name === "Alice Smith" && member.role === "Team Member" && member.bio === "Team member. Add a short description of their work from the Admin panel."));
    loaded.forEach((member,index) => { if (member.displayOrder === undefined || member.displayOrder === null || Number.isNaN(Number(member.displayOrder))) member.displayOrder = index + 1; });
    return loaded;
  } catch { return defaultMembers; }
}
function escapeHTML(value="") { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
function avatar(member){
  if (member.photo) return member.photo;
  const initials = member.name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase() || "G";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%" height="100%" fill="#12243a"/><text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="190" font-weight="700" fill="#8b7fff">${initials}</text></svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}
function render(){
  const members = loadMembers().sort((a,b)=>(Number(a.displayOrder)||9999)-(Number(b.displayOrder)||9999));
  if (!members.length) { $("membersGrid").innerHTML = '<div class="empty"><i class="fa-regular fa-face-frown" style="font-size:2rem"></i><p style="margin-top:10px">No members found.</p></div>'; return; }
  $("membersGrid").innerHTML = members.map(member => `<article class="card"><div class="profile-role">${escapeHTML(member.role || "Team Member")}</div><div class="photo-wrap"><img class="photo" src="${avatar(member)}" alt="${escapeHTML(member.name)}">${member.isAdmin ? '<span class="role admin-role"><i class="fa-solid fa-crown"></i> ADMIN</span>' : ''}</div><h3>${escapeHTML(member.name)}</h3>${member.bio ? `<p class="bio">${escapeHTML(member.bio)}</p>` : ''}</article>`).join("");
}
const adminLink = $("adminLink");
if (adminLink) adminLink.hidden = true

window.addEventListener("storage", e => { if (e.key === STORAGE_KEY) render(); });
render();
