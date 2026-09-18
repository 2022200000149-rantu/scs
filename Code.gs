/**
 * ============================================================
 *  Southeast Cultural Society — Unified Backend
 * ============================================================
 */

const SHEET_NAMES = {
  ADMIN: 'Admin',
  MEMBERSHIP: 'Membership',
  COMMITTEE: 'Committee',
  GALLERY: 'Gallery',
  ARTICLES: 'Articles',
  NOTICES: 'Notices'
};

const TOKEN_TTL_SECONDS = 6 * 60 * 60; // 6 hours

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const schemas = {
    Admin: ['Username', 'Password', 'Name'],
    Membership: ['Membership_ID', 'Name', 'Email', 'Phone', 'Department', 'StudentID', 'ApplicationDate', 'Status', 'DigitalID', 'Password', 'Admin_username'],
    Committee: ['Committee_ID', 'Name', 'Position', 'Email', 'ImageURL', 'Task', 'Admin_username'],
    Gallery: ['Gallery_ID', 'EventTitle', 'ImageURL', 'UploadDate', 'Admin_username'],
    Articles: ['Article_ID', 'Title', 'Content', 'AuthorName', 'AuthorEmail', 'SubmissionDate', 'Status', 'Membership_ID', 'Admin_username'],
    Notices: ['Notice_ID', 'Headline', 'Details', 'RegistrationLink', 'Date', 'Admin_username']
  };

  Object.keys(schemas).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(schemas[name]);
      sheet.setFrozenRows(1);
    } else {
      const existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
      const normalizedExisting = existingHeaders.map(h => String(h).trim().toLowerCase());
      
      schemas[name].forEach(h => {
        if (!normalizedExisting.includes(h.toLowerCase())) {
          sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
        }
      });
    }
  });

  const adminSheet = ss.getSheetByName('Admin');
  if (adminSheet.getLastRow() < 2) {
    adminSheet.appendRow(['admin', 'admin123', 'Executive Committee']);
  }

  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && sheet1.getLastRow() === 0) ss.deleteSheet(sheet1);

  try {
    SpreadsheetApp.getUi().alert('Setup complete! Default login: admin / admin123');
  } catch (e) {
    Logger.log('Setup complete! Default login: admin / admin123');
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;
    switch (action) {
      case 'getCommittee':
        result = getCommittee();
        break;
      case 'getGallery':
        result = getGallery();
        break;
      case 'getArticles':
        result = getArticles(true);
        break;
      case 'getNotices':
        result = getNotices();
        break;
      case 'getApprovedMembers':
        result = getApprovedMembers(e.parameter.department);
        break;
      case 'checkMembership':
        result = checkMembership(e.parameter.studentId, e.parameter.email);
        break;
      case 'getPendingMembership':
        requireAuth(e.parameter.token, 'admin');
        result = getMembership('Pending');
        break;
      case 'getAllMembership':
        requireAuth(e.parameter.token, 'admin');
        result = getMembership(null);
        break;
      case 'getPendingArticles':
        requireAuth(e.parameter.token, 'admin');
        result = getArticles(false, 'Pending');
        break;
      case 'getAllArticlesAdmin':
        requireAuth(e.parameter.token, 'admin');
        result = getArticles(false, null);
        break;
      case 'getMyArticles':
        result = getMyArticles(e.parameter.token);
        break;
      default:
        return jsonResponse({ success: false, error: 'Unknown or missing action' });
    }
    return jsonResponse({ success: true, data: result });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    let result;

    switch (action) {
      case 'login':
        result = login(body.username, body.password);
        break;

      case 'submitMembership':
        result = submitMembership(body);
        break;
      case 'approveMembership':
        const appAdmin = requireAuth(body.token, 'admin');
        result = setMembershipStatus(body.id, 'Approved', appAdmin.username);
        break;
      case 'pendingMembership':
        const pendAdmin = requireAuth(body.token, 'admin');
        result = setMembershipStatus(body.id, 'Pending', pendAdmin.username);
        break;
      case 'rejectMembership':
        const rejAdmin = requireAuth(body.token, 'admin');
        result = setMembershipStatus(body.id, 'Rejected', rejAdmin.username);
        break;
      case 'deleteMembership':
        requireAuth(body.token, 'admin');
        result = removeRowById(SHEET_NAMES.MEMBERSHIP, body.id);
        break;

      case 'addCommittee':
        const commAdmin = requireAuth(body.token, 'admin');
        result = addCommittee(body, commAdmin.username);
        break;
      case 'removeCommittee':
        requireAuth(body.token, 'admin');
        result = removeRowById(SHEET_NAMES.COMMITTEE, body.id);
        break;
      case 'assignTask':
        requireAuth(body.token, 'admin');
        result = assignTask(body.id, body.task);
        break;

      case 'addGalleryImage':
        const galAdmin = requireAuth(body.token, 'admin');
        result = addGalleryImage(body, galAdmin.username);
        break;
      case 'removeGalleryImage':
        requireAuth(body.token, 'admin');
        result = removeRowById(SHEET_NAMES.GALLERY, body.id);
        break;

      case 'addNotice':
        const noticeAdmin = requireAuth(body.token, 'admin');
        result = addNotice(body, noticeAdmin.username);
        break;
      case 'removeNotice':
        requireAuth(body.token, 'admin');
        result = removeRowById(SHEET_NAMES.NOTICES, body.id);
        break;

      case 'submitArticle':
        result = submitArticle(body);
        break;
      case 'approveArticle':
        const approveAdmin = requireAuth(body.token, 'admin');
        result = setArticleStatus(body.id, 'Approved', approveAdmin.username);
        break;
      case 'rejectArticle':
        const rejectAdmin = requireAuth(body.token, 'admin');
        result = setArticleStatus(body.id, 'Rejected', rejectAdmin.username);
        break;
      case 'deleteArticle':
        result = deleteArticle(body.token, body.id);
        break;
      case 'updateArticle':
        result = updateArticle(body.token, body.id, body.title, body.content);
        break;

      default:
        return jsonResponse({ success: false, error: 'Unknown or missing action' });
    }
    return jsonResponse({ success: true, data: result });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// AUTH
function login(username, password) {
  const adminSheet = sheetByName(SHEET_NAMES.ADMIN);
  const adminRows = adminSheet.getDataRange().getValues();
  for (let i = 1; i < adminRows.length; i++) {
    if (adminRows[i][0] === username && String(adminRows[i][1]) === String(password)) {
      return issueToken({ role: 'admin', username: username, name: adminRows[i][2] || username });
    }
  }

  const memSheet = sheetByName(SHEET_NAMES.MEMBERSHIP);
  const memRows = memSheet.getDataRange().getValues();
  const memHeaders = memRows[0];
  const norm = v => String(v == null ? '' : v).trim();

  for (let i = 1; i < memRows.length; i++) {
    const rec = rowToObject(memHeaders, memRows[i]);
    if (norm(rec.StudentID) === norm(username) && norm(rec.Password) === norm(password) && rec.Password !== '') {
      if (rec.Status !== 'Approved') {
        throw new Error('Your membership request is ' + String(rec.Status).toLowerCase() + '. Only approved members can log in.');
      }
      return issueToken({
        role: 'member',
        username: rec.StudentID,
        name: rec.Name,
        email: rec.Email,
        studentId: rec.StudentID,
        digitalId: rec.DigitalID,
        membershipId: rec.Membership_ID
      });
    }
  }

  throw new Error('Invalid username or password');
}

function issueToken(identity) {
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('token_' + token, JSON.stringify(identity), TOKEN_TTL_SECONDS);
  return { 
    token: token, 
    role: identity.role, 
    name: identity.name, 
    digitalId: identity.digitalId || null, 
    membershipId: identity.membershipId || null 
  };
}

function requireAuth(token, requiredRole) {
  if (!token) throw new Error('Not authenticated');
  const raw = CacheService.getScriptCache().get('token_' + token);
  if (!raw) throw new Error('Session expired, please log in again');
  const identity = JSON.parse(raw);
  if (requiredRole && identity.role !== requiredRole) throw new Error('Not authorized');
  return identity;
}

// NOTICES
function getNotices() {
  const sheet = sheetByName(SHEET_NAMES.NOTICES);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const out = [];
  for (let i = 1; i < rows.length; i++) out.push(rowToObject(headers, rows[i]));
  return out;
}

function addNotice(body, adminUsername) {
  const sheet = sheetByName(SHEET_NAMES.NOTICES);
  const id = 'N' + new Date().getTime();
  
  const record = {
    'Notice_ID': id,
    'Headline': body.headline || '',
    'Details': body.details || '',
    'RegistrationLink': body.registrationLink || '',
    'Date': new Date().toISOString(),
    'Admin_username': adminUsername || ''
  };

  appendRowByHeader(sheet, record);
  return { id: id };
}

// MEMBERSHIP & RECRUITMENT
function submitMembership(body) {
  const sheet = sheetByName(SHEET_NAMES.MEMBERSHIP);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  
  const norm = v => String(v == null ? '' : v).trim().toLowerCase();
  const targetStudentId = norm(body.studentId);

  if (!targetStudentId) {
    throw new Error('Student ID is required.');
  }

  for (let i = 1; i < rows.length; i++) {
    const rec = rowToObject(headers, rows[i]);
    if (norm(rec.StudentID) === targetStudentId) {
      if (rec.Status === 'Pending') {
        throw new Error('A membership request for this Student ID is already pending approval.');
      }
      if (rec.Status === 'Approved') {
        throw new Error('This Student ID belongs to an already approved member.');
      }
    }
  }

  const id = 'M' + new Date().getTime();
  const record = {
    'Membership_ID': id,
    'Name': body.name || '',
    'Email': body.email || '',
    'Phone': body.phone || '',
    'Department': body.department || '',
    'StudentID': body.studentId || '',
    'ApplicationDate': new Date().toISOString(),
    'Status': 'Pending',
    'DigitalID': '',
    'Password': body.password || '',
    'Admin_username': ''
  };

  appendRowByHeader(sheet, record);
  return { id: id };
}

function getMembership(statusFilter) {
  const sheet = sheetByName(SHEET_NAMES.MEMBERSHIP);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const rec = rowToObject(headers, rows[i]);
    if (!statusFilter || rec.Status === statusFilter) out.push(rec);
  }
  return out;
}

function getApprovedMembers(deptFilter) {
  const sheet = sheetByName(SHEET_NAMES.MEMBERSHIP);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const rec = rowToObject(headers, rows[i]);
    if (rec.Status === 'Approved') {
      if (!deptFilter || rec.Department.toLowerCase() === deptFilter.toLowerCase()) {
        out.push({
          Membership_ID: rec.Membership_ID,
          Name: rec.Name,
          StudentID: rec.StudentID,
          Department: rec.Department,
          DigitalID: rec.DigitalID
        });
      }
    }
  }
  return out;
}

function setMembershipStatus(id, status, adminUsername) {
  const sheet = sheetByName(SHEET_NAMES.MEMBERSHIP);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      const rowIndex = i + 1;
      updateCellByHeader(sheet, rowIndex, 'Status', status);
      
      if (adminUsername) {
        updateCellByHeader(sheet, rowIndex, 'Admin_username', adminUsername);
      }
      
      if (status === 'Approved') {
        const digitalId = generateDigitalId(rowIndex);
        updateCellByHeader(sheet, rowIndex, 'DigitalID', digitalId);
        return { status: status, digitalId: digitalId };
      }
      return { status: status };
    }
  }
  throw new Error('Membership record not found');
}

function generateDigitalId(rowNumber) {
  return 'SCS-' + new Date().getFullYear() + '-' + String(rowNumber).padStart(4, '0');
}

function checkMembership(studentId, email) {
  const sheet = sheetByName(SHEET_NAMES.MEMBERSHIP);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const normalize = v => String(v == null ? '' : v).trim().toLowerCase();
  const wantedId = studentId ? normalize(studentId) : null;
  const wantedEmail = email ? normalize(email) : null;

  for (let i = 1; i < rows.length; i++) {
    const rec = rowToObject(headers, rows[i]);
    if ((wantedId && normalize(rec.StudentID) === wantedId) || (wantedEmail && normalize(rec.Email) === wantedEmail)) {
      return rec;
    }
  }
  return null;
}

// COMMITTEE
function getCommittee() {
  const sheet = sheetByName(SHEET_NAMES.COMMITTEE);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const out = [];
  for (let i = 1; i < rows.length; i++) out.push(rowToObject(headers, rows[i]));
  return out;
}

function addCommittee(body, adminUsername) {
  const sheet = sheetByName(SHEET_NAMES.COMMITTEE);
  const id = 'C' + new Date().getTime();
  
  const record = {
    'Committee_ID': id,
    'Name': body.name || '',
    'Position': body.position || '',
    'Email': body.email || '',
    'ImageURL': body.imageUrl || '',
    'Task': body.task || '',
    'Admin_username': adminUsername || ''
  };

  appendRowByHeader(sheet, record);
  return { id: id };
}

function assignTask(id, task) {
  const sheet = sheetByName(SHEET_NAMES.COMMITTEE);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      updateCellByHeader(sheet, i + 1, 'Task', task);
      return { updated: true };
    }
  }
  throw new Error('Committee member not found');
}

// GALLERY
function getGallery() {
  const sheet = sheetByName(SHEET_NAMES.GALLERY);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const out = [];
  for (let i = 1; i < rows.length; i++) out.push(rowToObject(headers, rows[i]));
  return out;
}

function addGalleryImage(body, adminUsername) {
  const sheet = sheetByName(SHEET_NAMES.GALLERY);
  const id = 'G' + new Date().getTime();
  
  const record = {
    'Gallery_ID': id,
    'EventTitle': body.eventTitle || '',
    'ImageURL': body.imageUrl || '',
    'UploadDate': new Date().toISOString(),
    'Admin_username': adminUsername || ''
  };

  appendRowByHeader(sheet, record);
  return { id: id };
}

// ARTICLES
function submitArticle(body) {
  const identity = requireAuth(body.token);
  const sheet = sheetByName(SHEET_NAMES.ARTICLES);
  const id = 'A' + new Date().getTime();
  
  const record = {
    'Article_ID': id,
    'Title': body.title || '',
    'Content': body.content || '',
    'AuthorName': identity.name || '',
    'AuthorEmail': identity.email || '',
    'SubmissionDate': new Date().toISOString(),
    'Status': 'Pending',
    'Membership_ID': identity.membershipId || '',
    'Admin_username': ''
  };

  appendRowByHeader(sheet, record);
  return { id: id };
}

function getMyArticles(token) {
  const identity = requireAuth(token);
  const sheet = sheetByName(SHEET_NAMES.ARTICLES);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const rec = rowToObject(headers, rows[i]);
    if ((identity.membershipId && rec.Membership_ID === identity.membershipId) || (identity.email && rec.AuthorEmail === identity.email)) {
      out.push(rec);
    }
  }
  return out;
}

function getArticles(approvedOnly, statusFilter) {
  const sheet = sheetByName(SHEET_NAMES.ARTICLES);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const rec = rowToObject(headers, rows[i]);
    if (approvedOnly && rec.Status !== 'Approved') continue;
    if (statusFilter && rec.Status !== statusFilter) continue;
    out.push(rec);
  }
  return out;
}

function setArticleStatus(id, status, adminUsername) {
  const sheet = sheetByName(SHEET_NAMES.ARTICLES);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      const rowIndex = i + 1;
      updateCellByHeader(sheet, rowIndex, 'Status', status);
      if (adminUsername) {
        updateCellByHeader(sheet, rowIndex, 'Admin_username', adminUsername);
      }
      return { status: status, approvedBy: adminUsername || '' };
    }
  }
  throw new Error('Article not found');
}

function deleteArticle(token, id) {
  const identity = requireAuth(token);
  const sheet = sheetByName(SHEET_NAMES.ARTICLES);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      const rec = rowToObject(headers, rows[i]);
      const isOwner = (identity.membershipId && rec.Membership_ID === identity.membershipId) || (identity.email && rec.AuthorEmail === identity.email);
      if (identity.role === 'admin' || (identity.role === 'member' && isOwner)) {
        sheet.deleteRow(i + 1);
        return { deleted: true };
      } else {
        throw new Error('Not authorized to delete this article');
      }
    }
  }
  throw new Error('Article not found');
}

function updateArticle(token, id, title, content) {
  const identity = requireAuth(token);
  const sheet = sheetByName(SHEET_NAMES.ARTICLES);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      const rec = rowToObject(headers, rows[i]);
      const isOwner = (identity.membershipId && rec.Membership_ID === identity.membershipId) || (identity.email && rec.AuthorEmail === identity.email);
      if (identity.role === 'admin' || (identity.role === 'member' && isOwner)) {
        const rowIndex = i + 1;
        updateCellByHeader(sheet, rowIndex, 'Title', title);
        updateCellByHeader(sheet, rowIndex, 'Content', content);
        if (identity.role === 'member') {
          updateCellByHeader(sheet, rowIndex, 'Status', 'Pending');
          updateCellByHeader(sheet, rowIndex, 'Admin_username', '');
        }
        return { updated: true };
      } else {
        throw new Error('Not authorized to update this article');
      }
    }
  }
  throw new Error('Article not found');
}

// HELPERS
function getHeaderIndexMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const map = {};
  headers.forEach((h, i) => {
    if (h) {
      map[String(h).trim().toLowerCase()] = i + 1;
    }
  });
  return map;
}

function appendRowByHeader(sheet, record) {
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const normalizedRecord = {};
  Object.keys(record).forEach(k => {
    normalizedRecord[k.trim().toLowerCase()] = record[k];
  });
  const rowData = headers.map(h => {
    const key = String(h).trim().toLowerCase();
    return normalizedRecord[key] !== undefined ? normalizedRecord[key] : '';
  });
  sheet.appendRow(rowData);
}

function updateCellByHeader(sheet, rowIndex, headerName, value) {
  const headerMap = getHeaderIndexMap(sheet);
  const colIndex = headerMap[headerName.trim().toLowerCase()];
  if (colIndex) {
    sheet.getRange(rowIndex, colIndex).setValue(value);
  } else {
    throw new Error('Header "' + headerName + '" not found in sheet ' + sheet.getName());
  }
}

function sheetByName(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" not found. Run setup() first.');
  return sheet;
}

function removeRowById(sheetName, id) {
  const sheet = sheetByName(sheetName);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
    }
  }
  throw new Error('Record not found');
}

function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((h, idx) => obj[h] = row[idx]);
  return obj;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
