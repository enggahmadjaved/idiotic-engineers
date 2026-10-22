const ADMIN_PIN = "alliswell";
const STORAGE_KEY = "idiotic_engineers_team_members_v1";

/*
  Load existing members from localStorage.
  If the old placeholder Alice Smith exists,
  remove only that placeholder.
*/
let members = loadMembers();
let isAdmin = false;

const $ = id => document.getElementById(id);


/* =========================
   LOAD MEMBERS
========================= */

function loadMembers(){

  try{

    const saved = localStorage.getItem(STORAGE_KEY);

    if(!saved){
      return defaultMembers;
    }

    let loaded = JSON.parse(saved);

    if(!Array.isArray(loaded)){
      return defaultMembers;
    }

    /*
      Remove the old default placeholder only.
      Other saved team members remain untouched.
    */
    loaded = loaded.filter(member => {
      return !(
        member.name === "Alice Smith" &&
        member.role === "Team Member" &&
        member.bio === "Team member. Add a short description of their work from the Admin panel."
      );
    });

    /*
      Give older members a display order if they
      were created before this feature existed.
    */
    loaded.forEach((member,index) => {

      if(
        member.displayOrder === undefined ||
        member.displayOrder === null ||
        Number.isNaN(Number(member.displayOrder))
      ){
        member.displayOrder = index + 1;
      }

    });

    return loaded;

  }catch(e){

    return defaultMembers;

  }

}


/* =========================
   SAVE MEMBERS
========================= */

function saveMembers(){

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(members)
  );

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value=""){

  return String(value).replace(/[&<>"']/g, c => ({

    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"

  }[c]));

}


/* =========================
   AVATAR
========================= */

function avatar(member){

  if(member.photo){
    return member.photo;
  }

  const initials =
    member.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0,2)
      .map(x => x[0])
      .join("")
      .toUpperCase() || "G";

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="600"
      height="600"
    >
      <rect
        width="100%"
        height="100%"
        fill="#12243a"
      />

      <text
        x="50%"
        y="53%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Arial"
        font-size="190"
        font-weight="700"
        fill="#8b7fff"
      >
        ${initials}
      </text>

    </svg>
  `;

  return "data:image/svg+xml;charset=UTF-8,"
    + encodeURIComponent(svg);

}


/* =========================
   RENDER TEAM
========================= */

function render(){

  /*
    Sort by Display Order.

    Example:
    displayOrder 1 = first
    displayOrder 2 = second
    displayOrder 3 = third
  */

  const filtered = [...members].sort((a,b) => {

    const orderA = Number(a.displayOrder) || 9999;
    const orderB = Number(b.displayOrder) || 9999;

    return orderA - orderB;

  });


  if(!filtered.length){

    $("membersGrid").innerHTML = `
      <div class="empty">

        <i
          class="fa-regular fa-face-frown"
          style="font-size:2rem"
        ></i>

        <p style="margin-top:10px">
          No members found.
        </p>

      </div>
    `;

    return;
  }


  $("membersGrid").innerHTML = filtered.map(member => `

    <article class="card">

      <div class="profile-role">
        ${escapeHTML(member.role || "Team Member")}
      </div>

      <div class="photo-wrap">

        <img
          class="photo"
          src="${avatar(member)}"
          alt="${escapeHTML(member.name)}"
        >

        ${
          member.isAdmin
            ? `
              <span class="role admin-role">
                <i class="fa-solid fa-crown"></i>
                ADMIN
              </span>
            `
            : ""
        }

      </div>

      <h3>
        ${escapeHTML(member.name)}
      </h3>

      ${
        member.bio
          ? `
            <p class="bio">
              ${escapeHTML(member.bio)}
            </p>
          `
          : ""
      }

      <div class="admin-actions">

        <button
          class="small-btn"
          onclick="editMember(${member.id})"
        >
          <i class="fa-solid fa-pen"></i>
          Edit
        </button>

        <button
          class="small-btn delete"
          onclick="deleteMember(${member.id})"
        >
          <i class="fa-solid fa-trash"></i>
          Delete
        </button>

      </div>

    </article>

  `).join("");

}


/* =========================
   MODALS
========================= */

function openModal(id){

  $(id).classList.add("show");

}


function closeModal(id){

  $(id).classList.remove("show");

}


/* =========================
   ADMIN BUTTON
========================= */

$("adminBtn").addEventListener("click", ()=>{

  if(isAdmin){

    isAdmin = false;

    document.body.classList.remove("admin-mode");

    $("adminBtn").innerHTML =
      '<i class="fa-solid fa-lock"></i> Admin';

    render();

    return;
  }


  $("adminPin").value = "";

  $("loginError").style.display = "none";

  openModal("loginModal");

  setTimeout(
    () => $("adminPin").focus(),
    50
  );

});


/* =========================
   LOGIN
========================= */

$("loginSubmit").addEventListener(
  "click",
  login
);


$("adminPin").addEventListener(
  "keydown",
  e => {

    if(e.key === "Enter"){
      login();
    }

  }
);


function login(){

  if($("adminPin").value === ADMIN_PIN){

    isAdmin = true;

    document.body.classList.add("admin-mode");

    $("adminBtn").innerHTML =
      '<i class="fa-solid fa-user-shield"></i> Add Member';

    closeModal("loginModal");

    openAddMember();

    render();

  }else{

    $("loginError").style.display = "block";

  }

}


/* =========================
   ADD MEMBER
========================= */

function openAddMember(){

  $("modalTitle").textContent =
    "Add New Member";

  $("memberForm").reset();

  $("editId").value = "";

  $("displayOrder").value = getNextOrder();

  $("makeAdmin").checked = false;

  $("preview").style.display = "none";

  openModal("memberModal");

}


/*
  Automatically suggest the next available
  display order.
*/
function getNextOrder(){

  if(!members.length){
    return 1;
  }

  const orders = members.map(member => {

    const order = Number(member.displayOrder);

    return Number.isFinite(order)
      ? order
      : 0;

  });

  return Math.max(...orders) + 1;

}


/* =========================
   EDIT MEMBER
========================= */

function editMember(id){

  if(!isAdmin){
    return;
  }

  const m = members.find(
    x => x.id === id
  );

  if(!m){
    return;
  }


  $("modalTitle").textContent =
    "Edit Member";

  $("editId").value = m.id;

  $("name").value = m.name;

  $("displayOrder").value =
    m.displayOrder || 1;

  $("role").value =
    m.role || "Team Member";

  $("bio").value =
    m.bio || "";

  $("makeAdmin").checked =
    !!m.isAdmin;

  $("photo").value = "";


  if(m.photo){

    $("preview").src = m.photo;

    $("preview").style.display =
      "block";

  }else{

    $("preview").style.display =
      "none";

  }


  openModal("memberModal");

}


/* =========================
   DELETE MEMBER
========================= */

function deleteMember(id){

  if(!isAdmin){
    return;
  }

  const m = members.find(
    x => x.id === id
  );

  if(!m){
    return;
  }


  if(
    m.isAdmin &&
    members.filter(x => x.isAdmin).length === 1
  ){

    alert(
      "You must keep one admin member."
    );

    return;
  }


  if(confirm(`Delete ${m.name}?`)){

    members = members.filter(
      x => x.id !== id
    );

    saveMembers();

    render();

  }

}


/* =========================
   PHOTO PREVIEW
========================= */

$("photo").addEventListener(
  "change",
  ()=>{

    const file =
      $("photo").files[0];

    if(!file){
      return;
    }


    if(file.size > 3 * 1024 * 1024){

      alert(
        "Please choose an image smaller than 3 MB."
      );

      $("photo").value = "";

      return;
    }


    const reader =
      new FileReader();


    reader.onload = e => {

      $("preview").src =
        e.target.result;

      $("preview").style.display =
        "block";

    };


    reader.readAsDataURL(file);

  }
);


/* =========================
   SAVE MEMBER FORM
========================= */

$("memberForm").addEventListener(
  "submit",
  e => {

    e.preventDefault();

    if(!isAdmin){
      return;
    }


    const editId =
      Number($("editId").value);

    const file =
      $("photo").files[0];


    const finish = photoData => {

      const displayOrder =
        Number($("displayOrder").value);


      const data = {

        name:
          $("name").value.trim(),

        role:
          $("role").value.trim()
          || "Team Member",

        displayOrder:
          Number.isFinite(displayOrder)
            && displayOrder >= 1
            ? displayOrder
            : 9999,

        bio:
          $("bio").value.trim(),

        photo:
          photoData || "",

        isAdmin:
          $("makeAdmin").checked

      };


      if(!data.name){
        return;
      }


      /* EDIT EXISTING MEMBER */

      if(editId){

        const index =
          members.findIndex(
            m => m.id === editId
          );


        if(index >= 0){

          /*
            Only one person can be Admin.
          */
          if(data.isAdmin){

            members.forEach(m => {

              if(m.id !== editId){
                m.isAdmin = false;
              }

            });

          }


          /*
            Keep the old photo if a new
            photo wasn't selected.
          */
          if(!data.photo){

            data.photo =
              members[index].photo;

          }


          members[index] = {
            ...members[index],
            ...data
          };

        }

      }

      /* ADD NEW MEMBER */

      else{

        if(data.isAdmin){

          members.forEach(m => {
            m.isAdmin = false;
          });

        }


        members.push({

          id: Date.now(),

          ...data

        });

      }


      saveMembers();

      closeModal("memberModal");

      render();

      e.target.reset();

      $("preview").style.display =
        "none";

    };


    /* PROCESS PHOTO */

    if(file){

      const reader =
        new FileReader();


      reader.onload = ev =>
        finish(ev.target.result);


      reader.readAsDataURL(file);

    }else{

      finish("");

    }

  }
);


/* =========================
   CLOSE BUTTONS
========================= */

document
  .querySelectorAll("[data-close]")
  .forEach(btn => {

    btn.addEventListener(
      "click",
      () => closeModal(
        btn.dataset.close
      )
    );

  });


/* =========================
   CLOSE MODAL ON BACKDROP
========================= */

document
  .querySelectorAll(".modal")
  .forEach(modal => {

    modal.addEventListener(
      "click",
      e => {

        if(e.target === modal){

          closeModal(
            modal.id
          );

        }

      }
    );

  });


/* =========================
   INITIAL RENDER
========================= */

render();
