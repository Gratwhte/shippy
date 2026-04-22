import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, MAX_MESSAGES } from "./supabase-config.js";

console.log('🔵 chat.js loaded');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== ELEMENTS =====
const nameScreen = document.getElementById('nameScreen');
const roomScreen = document.getElementById('roomScreen');
const chatScreen = document.getElementById('chatScreen');

const nameInput = document.getElementById('nameInput');
const nameNextBtn = document.getElementById('nameNextBtn');

const roomGreetName = document.getElementById('roomGreetName');
const backToNameBtn = document.getElementById('backToNameBtn');
const roomList = document.getElementById('roomList');
const roomInput = document.getElementById('roomInput');
const joinRoomBtn = document.getElementById('joinRoomBtn');

const passwordOverlay = document.getElementById('passwordOverlay');
const pwRoomName = document.getElementById('pwRoomName');
const pwInput = document.getElementById('pwInput');
const pwError = document.getElementById('pwError');
const pwSubmitBtn = document.getElementById('pwSubmitBtn');
const pwCancelBtn = document.getElementById('pwCancelBtn');

const displayName = document.getElementById('displayName');
const currentRoomEl = document.getElementById('currentRoom');
const leaveBtn = document.getElementById('leaveBtn');
const messagesEl = document.getElementById('messages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emojiPicker');
const emojiTabs = document.getElementById('emojiTabs');
const emojiGrid = document.getElementById('emojiGrid');
const usersList = document.getElementById('usersList');
const onlineCount = document.getElementById('onlineCount');
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const faviconEl = document.getElementById('favicon');

let currentUser = null;
let currentUserId = null;
let currentRoom = null;
let pendingRoomJoin = null;
let unreadCount = 0;
let windowFocused = true;

let messagePollTimer = null;
let roomListPollTimer = null;
let lastSeenMessageId = 0;
let renderedMessageIds = new Set();

// ===== EMOJIS =====
const EMOJI_CATEGORIES = {
  '😀': { name: 'Smileys', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😋','😛','😜','🤪','😝','🤗','🤭','🤫','🤔','😐','😑','😶','😏','😒','🙄','😬','😌','😔','😪','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🥳','😎','🤓','🧐','😕','😟','🙁','😮','😯','😲','😳','🥺','😨','😰','😢','😭','😱','😖','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','💩','🤡','👻','👽','👾','🤖'] },
  '👍': { name: 'Gestures', emojis: ['👋','🤚','✋','🖖','👌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤝','🙏','💪','👀','👂','👃','👄','💋'] },
  '❤️': { name: 'Hearts', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💌','💋','💍','💎','🌹','🌷','💐','🌸','🌺'] },
  '🎉': { name: 'Celebration', emojis: ['🎉','🎊','🎈','🎁','🎂','🍰','🧁','🍾','🥂','🍻','🥳','🎆','🎇','✨','🎀','🏆','🥇','🥈','🥉','🏅','🔥','💥','⭐','🌟','💫','⚡'] },
  '🐶': { name: 'Animals', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🐺','🐗','🐴','🦄','🐝','🦋','🐌','🐢','🐍','🐙','🦐','🦀','🐠','🐬','🐳','🐋','🦈'] },
  '🍔': { name: 'Food', emojis: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥒','🌶️','🌽','🥕','🥔','🍞','🥐','🧀','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🌮','🌯','🍜','🍝','🍣','🍤','🍦','🍩','🍪','🎂','🍫','🍬','🍭','☕','🍵','🥤','🍺','🍻','🥂','🍷','🍸','🍹'] },
  '⚽': { name: 'Activity', emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🏒','🏑','🥍','🏏','🎣','🥊','🥋','🎽','🛹','⛸️','🎿','🏂','🏋️','🤸','⛹️','🤺','🏇','🧘','🏄','🏊','🚣','🧗','🚵','🚴','🎮','🎲','🧩','🎯','🎳'] },
  '🚗': { name: 'Travel', emojis: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚚','🚛','🚜','🏍️','🚲','🛴','🚊','🚄','🚅','🚂','✈️','🚀','🚁','⛵','🚤','🚢','⚓','🗺️','🗽','🏰','🎡','🎢','🎠','🏖️','🏝️','⛰️','🏔️','🌋','⛺'] },
  '💡': { name: 'Objects', emojis: ['⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','💾','💿','📷','📹','🎥','📞','📺','📻','⏰','⏳','🔋','💡','🔦','🧯','💸','💵','💰','💳','💎','🔧','🔨','⚙️','🔫','💣','🔪','🛡️','🔮','🧪','🌡️','🧹','🧻','🧼','🚽','🛁'] },
  '🌈': { name: 'Symbols', emojis: ['✅','❌','⭕','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🔺','🔻','🔶','🔷','💯','🔝','🆒','🆕','🆙','🆓','🆗','🆘','❗','❓','❕','❔','‼️','⁉️','💤','💢','💬','💭','♨️','🌈','☀️','⛅','🌧️','⛈️','❄️','☃️','⛄','💨','💧','💦','☔','🌊'] }
};

// ===== FAVICON / UNREAD =====
window.addEventListener('focus', () => {
  windowFocused = true;
  clearUnread();
});
window.addEventListener('blur', () => {
  windowFocused = false;
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    windowFocused = true;
    clearUnread();
  } else {
    windowFocused = false;
  }
});

function setFavicon(unread) {
  if (!faviconEl) return;
  faviconEl.href = unread ? 'imgs/cheddar-unread.png' : 'imgs/cheddar.png';
}

function incrementUnread() {
  unreadCount++;
  setFavicon(true);
  updateTitle();
}

function clearUnread() {
  if (unreadCount === 0) return;
  unreadCount = 0;
  setFavicon(false);
  updateTitle();
}

function updateTitle() {
  const base = currentRoom ? `#${currentRoom} · Cheddar` : 'Cheddar';
  document.title = unreadCount > 0 ? `(${unreadCount}) ${base}` : base;
}

// ===== SCREEN NAVIGATION =====
function showScreen(screen) {
  [nameScreen, roomScreen, chatScreen].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// ===== NAME SCREEN =====
const savedName = localStorage.getItem('chatter_name');
if (savedName) nameInput.value = savedName;

function updateNameNextBtn() {
  nameNextBtn.disabled = nameInput.value.trim().length === 0;
}
nameInput.addEventListener('input', updateNameNextBtn);
updateNameNextBtn();

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !nameNextBtn.disabled) nameNextBtn.click();
});

nameNextBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) return;
  currentUser = name;
  currentUserId = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  localStorage.setItem('chatter_name', name);
  goToRoomSelect();
});

// ===== ROOM SELECTOR =====
function goToRoomSelect() {
  roomGreetName.textContent = currentUser;
  roomInput.value = '';
  updateJoinRoomBtn();
  showScreen(roomScreen);
  loadRoomList();
  startRoomListPolling();
  roomInput.focus();
}

backToNameBtn.addEventListener('click', () => {
  stopRoomListPolling();
  showScreen(nameScreen);
  nameInput.focus();
});

function sanitizeRoomName(raw) {
  return raw.toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
}

function updateJoinRoomBtn() {
  joinRoomBtn.disabled = sanitizeRoomName(roomInput.value).length === 0;
}
roomInput.addEventListener('input', updateJoinRoomBtn);
roomInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !joinRoomBtn.disabled) joinRoomBtn.click();
});

joinRoomBtn.addEventListener('click', () => {
  const clean = sanitizeRoomName(roomInput.value);
  if (!clean) return;
  attemptJoinRoom(clean);
});

async function loadRoomList() {
  roomList.innerHTML = '<div class="empty-rooms">Loading rooms...</div>';

  const [roomsRes, messagesRes] = await Promise.all([
    supabase.from('rooms').select('name, password').order('created_at', { ascending: true }),
    supabase.from('messages').select('room').order('created_at', { ascending: false }).limit(200)
  ]);

  if (roomsRes.error) console.error('Admin rooms error:', roomsRes.error);
  if (messagesRes.error) console.error('Message rooms error:', messagesRes.error);

  const adminRooms = roomsRes.data || [];
  const adminRoomNames = new Set(adminRooms.map(r => r.name));

  const organicRooms = [];
  const seen = new Set();
  for (const row of messagesRes.data || []) {
    if (row.room && !seen.has(row.room) && !adminRoomNames.has(row.room)) {
      seen.add(row.room);
      organicRooms.push(row.room);
    }
  }

  const combined = [];
  for (const r of adminRooms) combined.push({ name: r.name, password: r.password, isAdmin: true });
  for (const r of organicRooms) combined.push({ name: r, password: null, isAdmin: false });

  if (!combined.find(r => r.name === 'general')) {
    combined.push({ name: 'general', password: null, isAdmin: false });
  }

  renderRoomList(combined);
}

function renderRoomList(rooms) {
  if (rooms.length === 0) {
    roomList.innerHTML = '<div class="empty-rooms">No rooms yet. Create one below!</div>';
    return;
  }

  roomList.innerHTML = rooms.map(room => {
    const hasPw = room.password && room.password.length > 0;
    return `
      <div class="room-item" data-room="${escapeHtml(room.name)}">
        <span class="room-item-hash">#</span>
        <span class="room-item-name">${escapeHtml(room.name)}</span>
        ${room.isAdmin ? '<span class="room-item-admin-badge">OFFICIAL</span>' : ''}
        ${hasPw ? '<span class="room-item-lock">🔒</span>' : ''}
      </div>
    `;
  }).join('');

  roomList.querySelectorAll('.room-item').forEach(item => {
    item.addEventListener('click', () => attemptJoinRoom(item.dataset.room));
  });
}

function startRoomListPolling() {
  stopRoomListPolling();
  roomListPollTimer = setInterval(() => {
    if (roomScreen.classList.contains('active')) loadRoomList();
  }, 3000);
}

function stopRoomListPolling() {
  if (roomListPollTimer) {
    clearInterval(roomListPollTimer);
    roomListPollTimer = null;
  }
}

// ===== PASSWORD ROOMS =====
async function attemptJoinRoom(roomName) {
  const { data, error } = await supabase
    .from('rooms')
    .select('password')
    .eq('name', roomName)
    .maybeSingle();

  if (error) console.error('Room lookup error:', error);

  const password = data?.password;
  if (password && password.length > 0) {
    showPasswordPrompt(roomName, password);
  } else {
    enterRoom(roomName);
  }
}

function showPasswordPrompt(roomName, expectedPassword) {
  pendingRoomJoin = { name: roomName, password: expectedPassword };
  pwRoomName.textContent = '#' + roomName;
  pwInput.value = '';
  pwError.textContent = '';
  passwordOverlay.classList.add('open');
  setTimeout(() => pwInput.focus(), 50);
}

function hidePasswordPrompt() {
  passwordOverlay.classList.remove('open');
  pendingRoomJoin = null;
}

pwCancelBtn.addEventListener('click', hidePasswordPrompt);

pwSubmitBtn.addEventListener('click', () => {
  if (!pendingRoomJoin) return;
  if (pwInput.value === pendingRoomJoin.password) {
    const roomName = pendingRoomJoin.name;
    hidePasswordPrompt();
    enterRoom(roomName);
  } else {
    pwError.textContent = 'Incorrect password';
    pwInput.value = '';
    pwInput.focus();
  }
});

pwInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') pwSubmitBtn.click();
  if (e.key === 'Escape') hidePasswordPrompt();
});

// ===== ROOM ENTRY / EXIT =====
function stopMessagePolling() {
  if (messagePollTimer) {
    clearInterval(messagePollTimer);
    messagePollTimer = null;
  }
}

async function enterRoom(room) {
  currentRoom = room;
  stopRoomListPolling();

  currentRoomEl.textContent = room;
  displayName.textContent = currentUser;
  messagesEl.innerHTML = '';
  renderedMessageIds.clear();
  lastSeenMessageId = 0;
  clearUnread();
  updateTitle();

  showScreen(chatScreen);
  msgInput.focus();

  await loadRecentMessages();
  renderFakePresence();
  startMessagePolling();
}

leaveBtn.addEventListener('click', async () => {
  await leaveRoom();
  goToRoomSelect();
});

async function leaveRoom() {
  stopMessagePolling();
  usersList.innerHTML = '';
  onlineCount.textContent = '0';
  currentRoom = null;
  clearUnread();
}

window.addEventListener('beforeunload', () => {
  stopMessagePolling();
  stopRoomListPolling();
});

// ===== MESSAGES =====
async function loadRecentMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('room', currentRoom)
    .order('created_at', { ascending: false })
    .limit(MAX_MESSAGES);

  if (error) {
    console.error('Load messages error:', error);
    showSystemMessage('⚠️ ' + error.message);
    return;
  }

  const ordered = (data || []).reverse();
  for (const m of ordered) {
    if (!renderedMessageIds.has(m.id)) {
      addMessage(m, true);
      renderedMessageIds.add(m.id);
    }
    if (m.id > lastSeenMessageId) lastSeenMessageId = m.id;
  }
  scrollToBottom();
}

function startMessagePolling() {
  stopMessagePolling();
  console.log('🟢 Starting message polling for room:', currentRoom);

  messagePollTimer = setInterval(async () => {
    if (!currentRoom || !chatScreen.classList.contains('active')) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room', currentRoom)
      .gt('id', lastSeenMessageId)
      .order('id', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Polling error:', error);
      return;
    }

    for (const msg of data || []) {
      if (renderedMessageIds.has(msg.id)) continue;
      addMessage(msg, false);
      renderedMessageIds.add(msg.id);
      if (msg.id > lastSeenMessageId) lastSeenMessageId = msg.id;
    }

    if ((data || []).length > 0) {
      scrollToBottom();
    }
  }, 1500);
}

// ===== SIMPLE ONLINE PLACEHOLDER =====
function renderFakePresence() {
  onlineCount.textContent = '1';
  usersList.innerHTML = `
    <div class="user-item is-self">
      <div class="user-avatar" style="background: ${colorFromName(currentUser || '?')}">
        ${escapeHtml((currentUser || '?')[0])}
      </div>
      <div class="user-name">${escapeHtml(currentUser || 'You')}</div>
      <div class="user-dot"></div>
    </div>
    <div class="empty-users" style="padding-top:16px;">
      Live online list temporarily disabled while realtime is being fixed
    </div>
  `;
}

function colorFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 55%, 55%)`;
}

// ===== SEND =====
function updateSendButton() {
  sendBtn.disabled = msgInput.value.trim().length === 0;
}
msgInput.addEventListener('input', updateSendButton);
updateSendButton();

msgInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
sendBtn.addEventListener('click', sendMessage);

async function sendMessage() {
  const text = msgInput.value.trim();
  if (!text || !currentUser || !currentRoom) return;

  msgInput.value = '';
  updateSendButton();
  msgInput.focus();
  closeEmojiPicker();

  const { data, error } = await supabase
    .from('messages')
    .insert({
      name: currentUser,
      text,
      room: currentRoom
    })
    .select()
    .single();

  if (error) {
    console.error('Send failed:', error);
    showSystemMessage('⚠️ ' + error.message);
    msgInput.value = text;
    updateSendButton();
    return;
  }

  if (data && !renderedMessageIds.has(data.id)) {
    addMessage(data, false);
    renderedMessageIds.add(data.id);
    if (data.id > lastSeenMessageId) lastSeenMessageId = data.id;
    scrollToBottom();
  }
}

function addMessage(msg, isHistorical) {
  const isSelf = msg.name === currentUser;
  const wrapper = document.createElement('div');
  wrapper.className = `message ${isSelf ? 'self' : 'other'}`;
  const timeStr = msg.created_at ? formatTime(msg.created_at) : '';

  wrapper.innerHTML = `${!isSelf ? `<div class="msg-name">${escapeHtml(msg.name)}</div>` : ''}<div class="msg-bubble">${escapeHtml(msg.text)}</div><div class="msg-time">${timeStr}</div>`;
  messagesEl.appendChild(wrapper);

  if (!isHistorical && !isSelf && !windowFocused) {
    incrementUnread();
  }
}

function showSystemMessage(text) {
  const el = document.createElement('div');
  el.className = 'system-msg';
  el.textContent = text;
  messagesEl.appendChild(el);
  scrollToBottom();
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function formatTime(ts) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ===== EMOJI PICKER =====
let activeCategory = Object.keys(EMOJI_CATEGORIES)[0];

function buildEmojiPicker() {
  emojiTabs.innerHTML = Object.keys(EMOJI_CATEGORIES).map(key => `<button class="emoji-tab ${key === activeCategory ? 'active' : ''}" data-category="${key}" title="${EMOJI_CATEGORIES[key].name}">${key}</button>`).join('');
  emojiTabs.querySelectorAll('.emoji-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeCategory = tab.dataset.category;
      emojiTabs.querySelectorAll('.emoji-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderEmojiGrid();
    });
  });
  renderEmojiGrid();
}

function renderEmojiGrid() {
  const emojis = EMOJI_CATEGORIES[activeCategory].emojis;
  emojiGrid.innerHTML = emojis.map(e => `<button class="emoji-btn" data-emoji="${e}">${e}</button>`).join('');
  emojiGrid.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => insertEmoji(btn.dataset.emoji));
  });
}

function insertEmoji(emoji) {
  const start = msgInput.selectionStart;
  const end = msgInput.selectionEnd;
  const value = msgInput.value;
  msgInput.value = value.substring(0, start) + emoji + value.substring(end);
  const newPos = start + emoji.length;
  msgInput.setSelectionRange(newPos, newPos);
  msgInput.focus();
  updateSendButton();
}

function toggleEmojiPicker() {
  const isOpen = emojiPicker.classList.toggle('open');
  emojiBtn.classList.toggle('active', isOpen);
}

function closeEmojiPicker() {
  emojiPicker.classList.remove('open');
  emojiBtn.classList.remove('active');
}

emojiBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleEmojiPicker();
});

document.addEventListener('click', (e) => {
  if (!emojiPicker.contains(e.target) && e.target !== emojiBtn && !emojiBtn.contains(e.target)) {
    closeEmojiPicker();
  }
});

buildEmojiPicker();

// ===== SIDEBAR =====
toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
});

if (window.innerWidth <= 700) {
  sidebar.classList.add('hidden');
}

// ===== SESSION RESTORE =====
const savedSession = sessionStorage.getItem('chatter_session');
if (savedSession) {
  try {
    const s = JSON.parse(savedSession);
    sessionStorage.removeItem('chatter_session');
    if (s.name && s.userId) {
      currentUser = s.name;
      currentUserId = s.userId;
      nameInput.value = s.name;
      if (s.room) {
        enterRoom(s.room);
      } else {
        goToRoomSelect();
      }
    }
  } catch (e) {
    console.warn('Failed to restore session:', e);
  }
}

document.querySelectorAll('a.admin-link, a#backToChatLink').forEach(link => {
  link.addEventListener('click', () => {
    if (currentUser) {
      sessionStorage.setItem('chatter_session', JSON.stringify({
        name: currentUser,
        userId: currentUserId,
        room: currentRoom
      }));
    }
  });
});

console.log('✅ chat.js ready');
