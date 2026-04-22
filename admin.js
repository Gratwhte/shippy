import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_PASSWORD } from "./supabase-config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const adminLoginScreen = document.getElementById('adminLoginScreen');
const adminDashboard = document.getElementById('adminDashboard');
const adminPwInput = document.getElementById('adminPwInput');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginError = document.getElementById('adminLoginError');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');

const newRoomName = document.getElementById('newRoomName');
const newRoomPassword = document.getElementById('newRoomPassword');
const createRoomBtn = document.getElementById('createRoomBtn');
const createRoomMsg = document.getElementById('createRoomMsg');

const adminRoomList = document.getElementById('adminRoomList');
const backToChatLink = document.getElementById('backToChatLink');

let isLoggedIn = false;
let roomsSubscription = null;

// ===== SHOW SCREEN =====
function show(screen) {
  [adminLoginScreen, adminDashboard].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// ===== LOGIN =====
// Use sessionStorage so admin login persists across page nav but not browser close
if (sessionStorage.getItem('chatter_admin') === 'true') {
  doLogin();
}

adminPwInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') adminLoginBtn.click();
});

adminLoginBtn.addEventListener('click', () => {
  if (adminPwInput.value === ADMIN_PASSWORD) {
    sessionStorage.setItem('chatter_admin', 'true');
    doLogin();
  } else {
    adminLoginError.textContent = 'Incorrect password';
    adminPwInput.value = '';
    adminPwInput.focus();
  }
});

function doLogin() {
  isLoggedIn = true;
  show(adminDashboard);
  loadAdminRooms();
  subscribeToRoomChanges();
  newRoomName.focus();
}

adminLogoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem('chatter_admin');
  cleanupSubscription();
  isLoggedIn = false;
  show(adminLoginScreen);
  adminPwInput.value = '';
  adminPwInput.focus();
});

// ===== CREATE ROOM =====
function sanitizeRoomName(raw) {
  return raw.toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
}

newRoomName.addEventListener('input', () => {
  createRoomMsg.textContent = '';
});

newRoomName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    newRoomPassword.focus();
  }
});

newRoomPassword.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    createRoomBtn.click();
  }
});

createRoomBtn.addEventListener('click', async () => {
  const name = sanitizeRoomName(newRoomName.value);
  const password = newRoomPassword.value.trim();

  if (!name) {
    setMsg(createRoomMsg, 'error', 'Invalid room name');
    return;
  }

  createRoomBtn.disabled = true;
  createRoomBtn.textContent = 'Creating...';

  const { error } = await supabase.from('rooms').insert({
    name: name,
    password: password || null,
    created_by: 'admin'
  });

  createRoomBtn.disabled = false;
  createRoomBtn.textContent = 'Create Room';

  if (error) {
    if (error.code === '23505') {
      setMsg(createRoomMsg, 'error', `Room "${name}" already exists`);
    } else {
      setMsg(createRoomMsg, 'error', 'Error: ' + error.message);
    }
    return;
  }

  setMsg(createRoomMsg, 'success', `✅ Created #${name}${password ? ' with password' : ''}`);
  newRoomName.value = '';
  newRoomPassword.value = '';
  newRoomName.focus();
});

function setMsg(el, type, text) {
  el.className = 'form-msg ' + type;
  el.textContent = text;
  setTimeout(() => {
    if (el.textContent === text) {
      el.textContent = '';
      el.className = 'form-msg';
    }
  }, 4000);
}

// ===== LOAD ROOMS =====
async function loadAdminRooms() {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Load rooms error:', error);
    adminRoomList.innerHTML = '<div class="empty-rooms">Error loading rooms</div>';
    return;
  }

  if (!data || data.length === 0) {
    adminRoomList.innerHTML = '<div class="empty-rooms">No rooms created yet. Create one above!</div>';
    return;
  }

  adminRoomList.innerHTML = data.map(room => {
    const hasPw = room.password && room.password.length > 0;
    const date = room.created_at ? new Date(room.created_at).toLocaleDateString() : '';
    return `
      <div class="admin-room-item">
        <div class="admin-room-info">
          <div class="admin-room-name">
            <span style="color: var(--accent);">#</span>${escapeHtml(room.name)}
            ${hasPw ? '<span style="color: var(--text-dim); font-size: 14px;">🔒</span>' : ''}
          </div>
          <div class="admin-room-meta">
            ${hasPw ? `Password: <code>${escapeHtml(room.password)}</code> · ` : 'Public · '}
            Created ${date}
          </div>
        </div>
        <button class="delete-btn" data-room="${escapeHtml(room.name)}">Delete</button>
      </div>
    `;
  }).join('');

  adminRoomList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const room = btn.dataset.room;
      if (!confirm(`Delete room "#${room}"?\n\nMessages in the room will stay (but users can no longer see it in the list).`)) {
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Deleting...';
      const { error } = await supabase.from('rooms').delete().eq('name', room);
      if (error) {
        alert('Delete failed: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'Delete';
      }
      // list will auto-refresh via subscription
    });
  });
}

function subscribeToRoomChanges() {
  cleanupSubscription();
  roomsSubscription = supabase
    .channel('admin-rooms')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'rooms' },
      () => loadAdminRooms()
    )
    .subscribe();
}

function cleanupSubscription() {
  if (roomsSubscription) {
    supabase.removeChannel(roomsSubscription);
    roomsSubscription = null;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ===== SESSION PRESERVATION =====
// If we came from chat, the chat's session is saved in sessionStorage
// When clicking "Back to chat", we just go to index.html and chat.js restores it
