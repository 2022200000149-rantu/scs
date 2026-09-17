const ADMIN_API_URL = 'https://script.google.com/macros/s/AKfycbzyuWCn81j-f9RL6t3erQMTOnQ3BJgtOnvFNl5bqBp4wumwVOJbrRBk2c3yrLIeJBCXUQ/exec';

function adminGet(params) {
  const query = new URLSearchParams(params).toString();
  return fetch(`${ADMIN_API_URL}?${query}`).then(res => res.json());
}

function adminPost(body) {
  return fetch(ADMIN_API_URL, {
    method: 'POST',
    body: JSON.stringify(body)
  }).then(res => res.json());
}

function getAdminToken() {
  return sessionStorage.getItem('scs_admin_token');
}

// PARTICLE ANIMATION
const canvas = document.getElementById("particle-bg");
const ctx = canvas.getContext("2d");
let particlesArray;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 5 + 2;
    this.speedY = Math.random() * 1 + 0.2;
    this.speedX = Math.random() * 0.5 - 0.25;
    this.opacity = Math.random() * 0.5 + 0.3;
    this.color = `rgba(255, ${Math.floor(Math.random()*200+100)}, ${Math.floor(Math.random()*100)}, ${this.opacity})`;
  }
  update() {
    this.y += this.speedY;
    this.x += this.speedX;
    if(this.y > canvas.height) this.y = -this.size;
    if(this.x > canvas.width) this.x = 0;
    if(this.x < 0) this.x = canvas.width;
  }
  draw(){
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initParticles(){
  particlesArray = [];
  const num = Math.floor(window.innerWidth / 8);
  for(let i = 0; i < num; i++) particlesArray.push(new Particle());
}
initParticles();

function animateParticles(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(let p of particlesArray){ p.update(); p.draw(); }
  requestAnimationFrame(animateParticles);
}
animateParticles();

// GALLERY (COMBINES LOCAL gallery.json + GOOGLE SHEET)
const galleryTop = document.getElementById('gallery-track-top');
const galleryBottom = document.getElementById('gallery-track-bottom');
const modalGalleryGrid = document.getElementById('modalGalleryGrid');
const modal = document.getElementById('galleryModal');
const openBtn = document.getElementById('openGallery');
const closeBtn = document.getElementById('closeGallery');
let allImages = [];

function loadGallery(){
  Promise.all([
    fetch('gallery.json').then(r => r.json()).catch(() => []),
    adminGet({ action: 'getGallery' }).then(res => res.success ? res.data.map(g => g.ImageURL) : []).catch(() => [])
  ]).then(([localImgs, remoteImgs]) => {
    allImages = [...new Set([...localImgs, ...remoteImgs])].filter(Boolean);
    galleryTop.innerHTML = '';
    galleryBottom.innerHTML = '';
    if(allImages.length === 0) return;

    const half = Math.ceil(allImages.length / 2);
    const topImages = allImages.slice(0, half);
    const bottomImages = allImages.slice(half);

    function populateRow(track, imgs){
      const imgWidth = 240;
      const needed = Math.ceil(window.innerWidth / imgWidth) + imgs.length;
      for(let i = 0; i < needed; i++){
        const img = document.createElement('img');
        img.src = imgs[i % imgs.length];
        track.appendChild(img);
      }
    }
    populateRow(galleryTop, topImages);
    populateRow(galleryBottom, bottomImages.length ? bottomImages : topImages);
  });
}
loadGallery();

openBtn.addEventListener('click', e => {
  e.preventDefault();
  modal.classList.add('active');
  modalGalleryGrid.innerHTML = '';
  allImages.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    modalGalleryGrid.appendChild(img);
  });
});

closeBtn.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', e => { if(e.target === modal) modal.classList.remove('active'); });

// NOTICES (DATABASE POWERED)
const newsWheelDiv = document.getElementById('news-wheel');
const noticeSection = document.getElementById('upcoming-events');

function loadNotices(){
  adminGet({ action: 'getNotices' }).then(res => {
    if(!res.success || !res.data.length){
      newsWheelDiv.textContent = 'No notices currently.';
      noticeSection.innerHTML = '<p>No upcoming events.</p>';
      return;
    }
    const headlines = res.data.map(n => n.Headline).join(' — ');
    newsWheelDiv.textContent = headlines;
    noticeSection.innerHTML = '';
    res.data.forEach(n => {
      const card = document.createElement('div');
      card.classList.add('notice-card');
      card.innerHTML = `
        <h3>${n.Headline || 'No title'}</h3>
        <p>${n.Details || ''}</p>
        ${n.RegistrationLink ? `<a href="${n.RegistrationLink}" target="_blank">Register</a>` : ''}
      `;
      noticeSection.appendChild(card);
    });
  }).catch(() => {
    newsWheelDiv.textContent = 'Failed to load notices.';
    noticeSection.innerHTML = '<p>Failed to load notices.</p>';
  });
}
loadNotices();

// RECRUITMENT UPDATE (APPROVED MEMBERSHIP LIST)
const listDiv = document.getElementById('recruitment-list');
const closeRecruitBtn = document.querySelector('.close-recruitment-btn');
const loadAllApprovedBtn = document.getElementById('loadAllApprovedBtn');
const recruitmentHeader = document.getElementById('recruitmentHeader');

loadAllApprovedBtn.addEventListener('click', () => loadApprovedMembers());

function loadApprovedMembers(){
  const oldRows = listDiv.querySelectorAll('.recruitment-item, .recruitment-list-msg');
  oldRows.forEach(r => r.remove());

  recruitmentHeader.innerHTML = `
    <div>Name</div>
    <div>Student ID</div>
    <div>Department</div>
  `;

  const loadingRow = document.createElement('p');
  loadingRow.style.textAlign = 'center';
  loadingRow.style.color = 'maroon';
  loadingRow.textContent = 'Loading approved members...';
  loadingRow.classList.add('recruitment-list-msg');
  listDiv.appendChild(loadingRow);

  adminGet({ action: 'getApprovedMembers' }).then(res => {
    loadingRow.remove();
    if(res.success && res.data.length){
      res.data.forEach(stu => {
        const div = document.createElement('div');
        div.className = 'recruitment-item';
        div.innerHTML = `<div>${stu.Name}</div><div>${stu.StudentID}</div><div>${stu.Department}</div>`;
        listDiv.appendChild(div);
      });
      closeRecruitBtn.style.display = 'inline-block';
    }else{
      const msg = document.createElement('p');
      msg.style.textAlign = 'center';
      msg.style.color = 'maroon';
      msg.classList.add('recruitment-list-msg');
      msg.textContent = 'No approved members found.';
      listDiv.appendChild(msg);
    }
  }).catch(() => {
    loadingRow.remove();
    const msg = document.createElement('p');
    msg.style.textAlign = 'center';
    msg.style.color = 'maroon';
    msg.classList.add('recruitment-list-msg');
    msg.textContent = 'Failed to load member records.';
    listDiv.appendChild(msg);
  });
}

closeRecruitBtn.addEventListener('click', () => {
  const studentRows = listDiv.querySelectorAll('.recruitment-item, .recruitment-list-msg');
  studentRows.forEach(r => r.remove());
  closeRecruitBtn.style.display = 'none';
});

// MEMBERSHIP
const membershipForm = document.getElementById('membershipForm');
const membershipFormMsg = document.getElementById('membershipFormMsg');

membershipForm.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(membershipForm);
  membershipFormMsg.textContent = 'Submitting...';
  membershipFormMsg.className = 'form-msg';
  adminPost({
    action: 'submitMembership',
    name: fd.get('name'),
    email: fd.get('email'),
    phone: fd.get('phone'),
    department: fd.get('department'),
    studentId: fd.get('studentId'),
    password: fd.get('password')
  }).then(res => {
    if(res.success){
      membershipFormMsg.textContent = 'Request submitted! You will be notified once reviewed.';
      membershipFormMsg.className = 'form-msg success';
      membershipForm.reset();
    }else{
      membershipFormMsg.textContent = res.error || 'Something went wrong.';
      membershipFormMsg.className = 'form-msg error';
    }
  }).catch(() => {
    membershipFormMsg.textContent = 'Failed to submit. Please try again.';
    membershipFormMsg.className = 'form-msg error';
  });
});

const membershipCheckForm = document.getElementById('membershipCheckForm');
const membershipCheckResult = document.getElementById('membershipCheckResult');

membershipCheckForm.addEventListener('submit', e => {
  e.preventDefault();
  const studentId = new FormData(membershipCheckForm).get('studentId').trim();
  if(!studentId){ membershipCheckResult.textContent = 'Enter your Student ID.'; return; }
  membershipCheckResult.textContent = 'Checking...';
  membershipCheckResult.className = 'form-msg';
  adminGet({ action: 'checkMembership', studentId }).then(res => {
    if(res.success && res.data){
      const rec = res.data;
      let msg = `Status: ${rec.Status}.`;
      if(rec.Status === 'Approved') msg += ` Your Digital ID: ${rec.DigitalID}`;
      membershipCheckResult.textContent = msg;
      membershipCheckResult.className = 'form-msg success';
    }else{
      membershipCheckResult.textContent = 'No membership request found for this Student ID.';
      membershipCheckResult.className = 'form-msg error';
    }
  }).catch(() => {
    membershipCheckResult.textContent = 'Failed to check status.';
    membershipCheckResult.className = 'form-msg error';
  });
});

// COMMITTEE DISPLAY
function loadPublicCommittee(){
  const grid = document.getElementById('committeeGrid');
  adminGet({ action: 'getCommittee' }).then(res => {
    grid.innerHTML = '';
    if(!res.success || !res.data.length){
      grid.innerHTML = '<p class="empty-msg">Committee list coming soon.</p>';
      return;
    }
    res.data.forEach(m => {
      const card = document.createElement('div');
      card.className = 'committee-card';
      card.innerHTML = `
        ${m.ImageURL ? `<img src="${m.ImageURL}" alt="${m.Name}">` : ''}
        <h4>${m.Name}</h4>
        <p>${m.Position}</p>
      `;
      grid.appendChild(card);
    });
  }).catch(() => grid.innerHTML = '<p class="empty-msg">Failed to load committee list.</p>');
}
loadPublicCommittee();

// ARTICLES
function loadPublicArticles(){
  const list = document.getElementById('articlesList');
  adminGet({ action: 'getArticles' }).then(res => {
    list.innerHTML = '';
    if(!res.success || !res.data.length){
      list.innerHTML = '<p class="empty-msg">No articles published yet.</p>';
      return;
    }
    res.data.forEach(a => {
      const item = document.createElement('div');
      item.className = 'article-item';
      const date = a.SubmissionDate ? new Date(a.SubmissionDate).toLocaleDateString() : '';
      item.innerHTML = `
        <h4>${a.Title}</h4>
        <div class="article-meta">By ${a.AuthorName} ${date ? '· ' + date : ''}</div>
        <p>${a.Content}</p>
      `;
      list.appendChild(item);
    });
  }).catch(() => list.innerHTML = '<p class="empty-msg">Failed to load articles.</p>');
}
loadPublicArticles();

// LOGIN & DASHBOARDS
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginMsg = document.getElementById('adminLoginMsg');
const adminLoginBox = document.getElementById('adminLoginBox');
const adminDashboard = document.getElementById('adminDashboard');
const adminNameLabel = document.getElementById('adminNameLabel');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');

const memberDashboard = document.getElementById('memberDashboard');
const memberWelcomeText = document.getElementById('memberWelcomeText');
const memberLogoutBtn = document.getElementById('memberLogoutBtn');
const wantToWriteCard = document.getElementById('wantToWriteCard');

function getAuthRole(){ return sessionStorage.getItem('scs_admin_role'); }

function showDashboard(name){
  adminLoginBox.style.display = 'none';
  memberDashboard.style.display = 'none';
  adminDashboard.style.display = 'block';
  if(wantToWriteCard) wantToWriteCard.style.display = 'block';
  adminNameLabel.textContent = name || 'Admin';
  refreshAdminNotices();
  refreshAdminMembership();
  refreshAdminApprovedMembers();
  refreshAdminCommittee();
  refreshAdminGallery();
  refreshAdminArticles();
}

function showMemberDashboard(name, digitalId){
  adminLoginBox.style.display = 'none';
  adminDashboard.style.display = 'none';
  memberDashboard.style.display = 'block';
  if(wantToWriteCard) wantToWriteCard.style.display = 'none';
  memberWelcomeText.innerHTML = `Logged in as <strong>${name || 'Member'}</strong>${digitalId ? ' · Digital ID: ' + digitalId : ''}`;
  loadMyArticles();
}

function logoutAll(){
  sessionStorage.removeItem('scs_admin_token');
  sessionStorage.removeItem('scs_admin_name');
  sessionStorage.removeItem('scs_admin_role');
  sessionStorage.removeItem('scs_admin_digitalid');
  adminDashboard.style.display = 'none';
  memberDashboard.style.display = 'none';
  adminLoginBox.style.display = 'block';
  if(wantToWriteCard) wantToWriteCard.style.display = 'block';
}

// Restore session on page load
if(getAdminToken()){
  const role = getAuthRole();
  const name = sessionStorage.getItem('scs_admin_name');
  if(role === 'member'){
    showMemberDashboard(name, sessionStorage.getItem('scs_admin_digitalid'));
  }else{
    showDashboard(name);
  }
}

adminLoginForm.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(adminLoginForm);
  adminLoginMsg.textContent = 'Logging in...';
  adminLoginMsg.className = 'form-msg';
  adminPost({ action: 'login', username: fd.get('username'), password: fd.get('password') })
    .then(res => {
      if(res.success){
        sessionStorage.setItem('scs_admin_token', res.data.token);
        sessionStorage.setItem('scs_admin_name', res.data.name);
        sessionStorage.setItem('scs_admin_role', res.data.role);
        sessionStorage.setItem('scs_admin_digitalid', res.data.digitalId || '');
        adminLoginForm.reset();
        adminLoginMsg.textContent = '';
        if(res.data.role === 'member'){
          showMemberDashboard(res.data.name, res.data.digitalId);
        }else{
          showDashboard(res.data.name);
        }
      }else{
        adminLoginMsg.textContent = res.error || 'Login failed.';
        adminLoginMsg.className = 'form-msg error';
      }
    }).catch(() => {
      adminLoginMsg.textContent = 'Login failed. Please try again.';
      adminLoginMsg.className = 'form-msg error';
    });
});

adminLogoutBtn.addEventListener('click', logoutAll);
memberLogoutBtn.addEventListener('click', logoutAll);

document.querySelectorAll('.admin-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// MEMBER: write & submit article, view, edit & delete own submissions
const memberArticleForm = document.getElementById('memberArticleForm');
const memberArticleFormMsg = document.getElementById('memberArticleFormMsg');

memberArticleForm.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(memberArticleForm);
  memberArticleFormMsg.textContent = 'Submitting...';
  memberArticleFormMsg.className = 'form-msg';
  adminPost({
    action: 'submitArticle',
    token: getAdminToken(),
    title: fd.get('title'),
    content: fd.get('content')
  }).then(res => {
    if(res.success){
      memberArticleFormMsg.textContent = 'Article submitted for review. Thank you!';
      memberArticleFormMsg.className = 'form-msg success';
      memberArticleForm.reset();
      loadMyArticles();
    }else{
      memberArticleFormMsg.textContent = res.error || 'Something went wrong.';
      memberArticleFormMsg.className = 'form-msg error';
    }
  }).catch(() => {
    memberArticleFormMsg.textContent = 'Failed to submit article.';
    memberArticleFormMsg.className = 'form-msg error';
  });
});

const editArticleModal = document.getElementById('editArticleModal');
const closeEditArticle = document.getElementById('closeEditArticle');
const editArticleForm = document.getElementById('editArticleForm');

closeEditArticle.addEventListener('click', () => editArticleModal.classList.remove('active'));

editArticleForm.addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('editArticleId').value;
  const title = document.getElementById('editArticleTitle').value;
  const content = document.getElementById('editArticleContent').value;

  adminPost({
    action: 'updateArticle',
    token: getAdminToken(),
    id: id,
    title: title,
    content: content
  }).then(res => {
    if(res.success){
      editArticleModal.classList.remove('active');
      loadMyArticles();
      loadPublicArticles();
    }else{
      alert(res.error || 'Failed to update article.');
    }
  }).catch(() => alert('Failed to update article.'));
});

function loadMyArticles(){
  const container = document.getElementById('myArticlesList');
  container.innerHTML = '<p class="empty-msg">Loading...</p>';
  adminGet({ action: 'getMyArticles', token: getAdminToken() }).then(res => {
    container.innerHTML = '';
    if(!res.success){ container.innerHTML = `<p class="empty-msg">${res.error}</p>`; return; }
    if(!res.data.length){ container.innerHTML = '<p class="empty-msg">You haven\'t submitted any articles yet.</p>'; return; }
    res.data.forEach(a => {
      const row = document.createElement('div');
      row.className = 'admin-list-item';
      row.innerHTML = `
        <div class="item-info">
          <strong>${a.Title}</strong>
          <span><span class="status-badge ${a.Status}">${a.Status}</span></span>
        </div>
        <div class="admin-list-actions">
          <button class="admin-btn assign edit-btn">Edit</button>
          <button class="admin-btn reject delete-btn">Delete</button>
        </div>
      `;

      row.querySelector('.edit-btn').addEventListener('click', () => {
        document.getElementById('editArticleId').value = a.ID;
        document.getElementById('editArticleTitle').value = a.Title;
        document.getElementById('editArticleContent').value = a.Content;
        editArticleModal.classList.add('active');
      });

      row.querySelector('.delete-btn').addEventListener('click', () => {
        if(confirm(`Are you sure you want to delete "${a.Title}"?`)){
          adminPost({ action: 'deleteArticle', token: getAdminToken(), id: a.ID }).then(res => {
            if(res.success){
              loadMyArticles();
              loadPublicArticles();
            }else{
              alert(res.error || 'Failed to delete article.');
            }
          });
        }
      });

      container.appendChild(row);
    });
  }).catch(() => container.innerHTML = '<p class="empty-msg">Failed to load your articles.</p>');
}

// ADMIN: NOTICES
const addNoticeForm = document.getElementById('addNoticeForm');
addNoticeForm.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(addNoticeForm);
  adminPost({
    action: 'addNotice',
    token: getAdminToken(),
    headline: fd.get('headline'),
    details: fd.get('details'),
    registrationLink: fd.get('registrationLink')
  }).then(res => {
    if(res.success){
      addNoticeForm.reset();
      refreshAdminNotices();
      loadNotices();
    }
  });
});

function refreshAdminNotices(){
  const container = document.getElementById('adminNoticesList');
  container.innerHTML = '<p class="empty-msg">Loading...</p>';
  adminGet({ action: 'getNotices' }).then(res => {
    container.innerHTML = '';
    if(!res.success || !res.data.length){ container.innerHTML = '<p class="empty-msg">No notices published.</p>'; return; }
    res.data.forEach(n => {
      const row = document.createElement('div');
      row.className = 'admin-list-item';
      row.innerHTML = `
        <div class="item-info">
          <strong>${n.Headline}</strong>
          <span>${n.Details || 'No details'}</span>
        </div>
        <div class="admin-list-actions">
          <button class="admin-btn remove">Remove</button>
        </div>
      `;
      row.querySelector('.remove').addEventListener('click', () => {
        adminPost({ action: 'removeNotice', token: getAdminToken(), id: n.ID }).then(() => {
          refreshAdminNotices();
          loadNotices();
        });
      });
      container.appendChild(row);
    });
  });
}

// ADMIN: MEMBERSHIP
function refreshAdminMembership(){
  const container = document.getElementById('adminMembershipList');
  container.innerHTML = '<p class="empty-msg">Loading...</p>';
  adminGet({ action: 'getPendingMembership', token: getAdminToken() }).then(res => {
    container.innerHTML = '';
    if(!res.success || !res.data.length){ container.innerHTML = '<p class="empty-msg">No pending requests.</p>'; return; }
    res.data.forEach(m => {
      const row = document.createElement('div');
      row.className = 'admin-list-item';
      row.innerHTML = `
        <div class="item-info">
          <strong>${m.Name}</strong>
          <span>${m.Department} · ID: ${m.StudentID}</span>
          <span>${m.Email} · ${m.Phone}</span>
        </div>
        <div class="admin-list-actions">
          <button class="admin-btn approve">Approve</button>
          <button class="admin-btn reject">Reject</button>
        </div>
      `;
      row.querySelector('.approve').addEventListener('click', () => {
        adminPost({ action: 'approveMembership', token: getAdminToken(), id: m.ID }).then(() => {
          refreshAdminMembership();
          refreshAdminApprovedMembers();
        });
      });
      row.querySelector('.reject').addEventListener('click', () => {
        adminPost({ action: 'rejectMembership', token: getAdminToken(), id: m.ID }).then(() => {
          refreshAdminMembership();
          refreshAdminApprovedMembers();
        });
      });
      container.appendChild(row);
    });
  });
}

// ADMIN: APPROVED MEMBERS
function refreshAdminApprovedMembers(){
  const container = document.getElementById('adminApprovedMembersList');
  container.innerHTML = '<p class="empty-msg">Loading...</p>';
  adminGet({ action: 'getApprovedMembers' }).then(res => {
    container.innerHTML = '';
    if(!res.success || !res.data.length){ container.innerHTML = '<p class="empty-msg">No approved members yet.</p>'; return; }
    res.data.forEach(stu => {
      const row = document.createElement('div');
      row.className = 'admin-list-item';
      row.innerHTML = `
        <div class="item-info">
          <strong>${stu.Name}</strong>
          <span>${stu.Department} · ID: ${stu.StudentID}</span>
        </div>
        <div class="admin-list-actions">
          <button class="admin-btn pending">Pending</button>
          <button class="admin-btn reject">Delete</button>
        </div>
      `;
      row.querySelector('.pending').addEventListener('click', () => {
        adminPost({ action: 'pendingMembership', token: getAdminToken(), id: stu.ID }).then(r => {
          if (r.success) {
            refreshAdminApprovedMembers();
            refreshAdminMembership();
          } else {
            alert(r.error || 'Failed to update status.');
          }
        });
      });
      row.querySelector('.reject').addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete member ${stu.Name}?`)) {
          adminPost({ action: 'deleteMembership', token: getAdminToken(), id: stu.ID }).then(r => {
            if (r.success) {
              refreshAdminApprovedMembers();
            } else {
              alert(r.error || 'Failed to delete member.');
            }
          });
        }
      });
      container.appendChild(row);
    });
  });
}

// ADMIN: COMMITTEE
const addCommitteeForm = document.getElementById('addCommitteeForm');
addCommitteeForm.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(addCommitteeForm);
  adminPost({
    action: 'addCommittee',
    token: getAdminToken(),
    name: fd.get('name'),
    position: fd.get('position'),
    email: fd.get('email'),
    imageUrl: fd.get('imageUrl')
  }).then(res => {
    if(res.success){
      addCommitteeForm.reset();
      refreshAdminCommittee();
      loadPublicCommittee();
    }
  });
});

function refreshAdminCommittee(){
  const container = document.getElementById('adminCommitteeList');
  container.innerHTML = '<p class="empty-msg">Loading...</p>';
  adminGet({ action: 'getCommittee' }).then(res => {
    container.innerHTML = '';
    if(!res.success || !res.data.length){ container.innerHTML = '<p class="empty-msg">No committee members yet.</p>'; return; }
    res.data.forEach(m => {
      const row = document.createElement('div');
      row.className = 'admin-list-item';
      row.innerHTML = `
        <div class="item-info">
          <strong>${m.Name}</strong>
          <span>${m.Position}${m.Task ? ' · Task: ' + m.Task : ''}</span>
        </div>
        <div class="admin-list-actions">
          <button class="admin-btn assign">Assign Task</button>
          <button class="admin-btn remove">Remove</button>
        </div>
      `;
      row.querySelector('.assign').addEventListener('click', () => {
        const task = prompt('Enter task for ' + m.Name + ':', m.Task || '');
        if(task !== null){
          adminPost({ action: 'assignTask', token: getAdminToken(), id: m.ID, task }).then(refreshAdminCommittee);
        }
      });
      row.querySelector('.remove').addEventListener('click', () => {
        if(confirm('Remove ' + m.Name + '?')){
          adminPost({ action: 'removeCommittee', token: getAdminToken(), id: m.ID }).then(() => {
            refreshAdminCommittee();
            loadPublicCommittee();
          });
        }
      });
      container.appendChild(row);
    });
  });
}

// ADMIN: GALLERY
const addGalleryForm = document.getElementById('addGalleryForm');
addGalleryForm.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(addGalleryForm);
  adminPost({
    action: 'addGalleryImage',
    token: getAdminToken(),
    eventTitle: fd.get('eventTitle'),
    imageUrl: fd.get('imageUrl')
  }).then(res => {
    if(res.success){
      addGalleryForm.reset();
      refreshAdminGallery();
      loadGallery();
    }
  });
});

function refreshAdminGallery(){
  const container = document.getElementById('adminGalleryList');
  container.innerHTML = '<p class="empty-msg">Loading...</p>';
  adminGet({ action: 'getGallery' }).then(res => {
    container.innerHTML = '';
    if(!res.success || !res.data.length){ container.innerHTML = '<p class="empty-msg">No photos yet.</p>'; return; }
    res.data.forEach(g => {
      const row = document.createElement('div');
      row.className = 'admin-list-item';
      row.innerHTML = `
        <div class="item-info">
          <strong>${g.EventTitle || 'Untitled'}</strong>
          <span>${g.ImageURL}</span>
        </div>
        <div class="admin-list-actions">
          <button class="admin-btn remove">Remove</button>
        </div>
      `;
      row.querySelector('.remove').addEventListener('click', () => {
        adminPost({ action: 'removeGalleryImage', token: getAdminToken(), id: g.ID }).then(() => {
          refreshAdminGallery();
          loadGallery();
        });
      });
      container.appendChild(row);
    });
  });
}

// ADMIN: ARTICLES (PENDING + ALL EXISTING)
function refreshAdminArticles(){
  const pendingContainer = document.getElementById('adminArticlesList');
  const allContainer = document.getElementById('adminAllArticlesList');

  pendingContainer.innerHTML = '<p class="empty-msg">Loading...</p>';
  allContainer.innerHTML = '<p class="empty-msg">Loading...</p>';

  // Load Pending
  adminGet({ action: 'getPendingArticles', token: getAdminToken() }).then(res => {
    pendingContainer.innerHTML = '';
    if(!res.success || !res.data.length){ pendingContainer.innerHTML = '<p class="empty-msg">No pending articles.</p>'; return; }
    res.data.forEach(a => {
      const row = document.createElement('div');
      row.className = 'admin-list-item';
      row.innerHTML = `
        <div class="item-info">
          <strong>${a.Title}</strong>
          <span>By ${a.AuthorName} (${a.AuthorEmail})</span>
        </div>
        <div class="admin-list-actions">
          <button class="admin-btn approve">Approve</button>
          <button class="admin-btn reject">Reject</button>
          <button class="admin-btn remove">Delete</button>
        </div>
      `;
      row.querySelector('.approve').addEventListener('click', () => {
        adminPost({ action: 'approveArticle', token: getAdminToken(), id: a.ID }).then(() => {
          refreshAdminArticles();
          loadPublicArticles();
        });
      });
      row.querySelector('.reject').addEventListener('click', () => {
        adminPost({ action: 'rejectArticle', token: getAdminToken(), id: a.ID }).then(refreshAdminArticles);
      });
      row.querySelector('.remove').addEventListener('click', () => {
        if(confirm(`Delete "${a.Title}"?`)){
          adminPost({ action: 'deleteArticle', token: getAdminToken(), id: a.ID }).then(() => {
            refreshAdminArticles();
            loadPublicArticles();
          });
        }
      });
      pendingContainer.appendChild(row);
    });
  });

  // Load All / Published
  adminGet({ action: 'getAllArticlesAdmin', token: getAdminToken() }).then(res => {
    allContainer.innerHTML = '';
    if(!res.success || !res.data.length){ allContainer.innerHTML = '<p class="empty-msg">No articles found.</p>'; return; }
    res.data.forEach(a => {
      const row = document.createElement('div');
      row.className = 'admin-list-item';
      row.innerHTML = `
        <div class="item-info">
          <strong>${a.Title}</strong>
          <span>By ${a.AuthorName} (${a.AuthorEmail}) · Status: <span class="status-badge ${a.Status}">${a.Status}</span></span>
        </div>
        <div class="admin-list-actions">
          <button class="admin-btn remove">Delete</button>
        </div>
      `;
      row.querySelector('.remove').addEventListener('click', () => {
        if(confirm(`Delete article "${a.Title}"?`)){
          adminPost({ action: 'deleteArticle', token: getAdminToken(), id: a.ID }).then(() => {
            refreshAdminArticles();
            loadPublicArticles();
          });
        }
      });
      allContainer.appendChild(row);
    });
  });
}
