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
let messagesChannel = null;
let presenceChannel = null;
let roomListChannel = null;
let knownRooms = []; // [{name, password}]
let pendingRoomJoin = null;
let unreadCount = 0;
let windowFocused = true;

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
  faviconEl.href = unread ? 'favicon-unread.png' : 'favicon.png';
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
  const base = currentRoom ? `#${currentRoom} · Chatter` : 'Chatter';
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
  subscribeToRoomList();
  roomInput.focus();
}

backToNameBtn.addEventListener('click', () => {
  cleanupRoomListChannel();
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

// Load admin-created rooms AND rooms from recent message activity
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

  // Find organic rooms (from messages) not already admin-defined
  const organicRooms = [];
  const seen = new Set();
  for (const row of messagesRes.data || []) {
    if (row.room && !seen.has(row.room) && !adminRoomNames.has(row.room)) {
      seen.add(row.room);
      organicRooms.push(row.room);
    }
  }

  // Build combined list: admin rooms first, then organic, then general fallback
  const combined = [];
  for (const r of adminRooms) combined.push({ name: r.name, password: r.password, isAdmin: true });
  for (const r of organicRooms) combined.push({ name: r, password: null, isAdmin: false });

  if (!combined.find(r => r.name === 'general')) {
    combined.push({ name: 'general', password: null, isAdmin: false });
  }

  knownRooms = combined;
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

function subscribeToRoomList() {
  cleanupRoomListChannel();
  roomListChannel = supabase
    .channel('room-list-channel')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      () => loadRoomList()
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'rooms' },
      () => loadRoomList()
    )
    .subscribe();
}

function cleanupRoomListChannel() {
  if (roomListChannel) {
    supabase.removeChannel(roomListChannel);
    roomListChannel = null;
  }
}

// ===== PASSWORD-PROTECTED ROOM HANDLING =====
async function attemptJoinRoom(roomName) {
  // Check if this room has a password in the rooms table
  const { data, error } = await supabase
    .from('rooms')
    .select('password')
    .eq('name', roomName)
    .maybeSingle();

  if (error) {
    console.error('Room lookup error:', error);
  }

  const password = data?.password;
  if (password && password.length > 0) {
    // Room is protected — show password prompt
    showPasswordPrompt(roomName, password);
  } else {
    // Public room — join directly
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

// ===== ENTER CHAT ROOM =====
async function enterRoom(room) {
  currentRoom = room;
  cleanupRoomListChannel();

  currentRoomEl.textContent = room;
  displayName.textContent = currentUser;
  messagesEl.innerHTML = '';
  clearUnread();
  updateTitle();

  showScreen(chatScreen);
  msgInput.focus();

  await loadRecentMessages();
  subscribeToNewMessages();
  joinPresence();
}

leaveBtn.addEventListener('click', async () => {
  await leaveRoom();
  goToRoomSelect();
});

async function leaveRoom() {
  if (messagesChannel) {
    await supabase.removeChannel(messagesChannel);
    messagesChannel = null;
  }
  if (presenceChannel) {
    try { await presenceChannel.untrack(); } catch(e) {}
    await supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  }
  usersList.innerHTML = '';
  onlineCount.textContent = '0';
  currentRoom = null;
  clearUnread();
}

window.addEventListener('beforeunload', () => {
  if (presenceChannel) {
    try { presenceChannel.untrack(); } catch(e) {}
  }
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
  if (data) data.reverse().forEach(m => addMessage(m, true));
  scrollToBottom();
}

function subscribeToNewMessages() {
  const roomForChannel = currentRoom;
  console.log('🔵 Subscribing to messages for room:', roomForChannel);
  
  if (messagesChannel) {
    supabase.removeChannel(messagesChannel);
    messagesChannel = null;
  }
  
  const channelName = `messages-${Date.now()}`;
  
  messagesChannel = supabase
    .channel(channelName)
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
        // Filter removed — we'll filter client-side
      },
      (payload) => {
        console.log('📨 Got message:', payload.new);
        if (payload.new.room === currentRoom) {
          addMessage(payload.new, false);
          scrollToBottom();
        }
      }
    )
    .subscribe((status, err) => {
      console.log('🔵 Messages channel status:', status);
      if (err) console.error('❌ Error details:', JSON.stringify(err, null, 2));
      if (status === 'SUBSCRIBED') {
        console.log('✅ Real-time messages ACTIVE');
      }
    });
}

// Use unique channel name with timestamp so we never collide
  const channelName = `messages-${roomForChannel}-${Date.now()}`;
  
  messagesChannel = supabase
    .channel(channelName)
    .on('postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room=eq.${roomForChannel}`
      },
      (payload) => {
        console.log('📨 Real-time message received:', payload.new);
        addMessage(payload.new, false);
        scrollToBottom();
      }
    )
    .subscribe((status, err) => {
      console.log('🔵 Messages channel status:', status);
      if (err) console.error('❌ Subscription error details:', err);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Real-time messages ACTIVE for #' + roomForChannel);
      }
    });
}


// ===== PRESENCE =====
function joinPresence() {
  // Clean up any existing presence channel first
  if (presenceChannel) {
    console.log('🧹 Removing existing presence channel');
    try { presenceChannel.untrack(); } catch(e) {}
    supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  }
  
  // Unique channel name
  const channelName = `online-${currentRoom}-${Date.now()}`;
  
  presenceChannel = supabase.channel(channelName, {
    config: { presence: { key: currentUserId } }
  });
  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      renderOnlineUsers(presenceChannel.presenceState());
    })
    .subscribe(async (status) => {
      console.log('🔵 Presence channel status:', status);
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({
          name: currentUser,
          user_id: currentUserId,
          room: currentRoom,
          joined_at: new Date().toISOString()
        });
      }
    });
}

function renderOnlineUsers(state) {
  const users = [];
  for (const key in state) {
    const entries = state[key];
    if (entries && entries.length > 0) users.push(entries[0]);
  }
  users.sort((a, b) => {
    if (a.user_id === currentUserId) return -1;
    if (b.user_id === currentUserId) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });
  onlineCount.textContent = users.length;
  if (users.length === 0) {
    usersList.innerHTML = '<div class="empty-users">No one else here yet</div>';
    return;
  }
  usersList.innerHTML = users.map(u => {
    const isSelf = u.user_id === currentUserId;
    return `<div class="user-item ${isSelf ? 'is-self' : ''}"><div class="user-avatar" style="background: ${colorFromName(u.name || '?')}">${escapeHtml((u.name || '?')[0])}</div><div class="user-name">${escapeHtml(u.name || 'Anonymous')}</div><div class="user-dot"></div></div>`;
  }).join('');
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
  const { error } = await supabase.from('messages').insert({
    name: currentUser,
    text: text,
    room: currentRoom
  });
  if (error) {
    console.error('Send failed:', error);
    showSystemMessage('⚠️ ' + error.message);
    msgInput.value = text;
    updateSendButton();
  }
}

function addMessage(msg, isHistorical) {
  const isSelf = msg.name === currentUser;
  const wrapper = document.createElement('div');
  wrapper.className = `message ${isSelf ? 'self' : 'other'}`;
  const timeStr = msg.created_at ? formatTime(msg.created_at) : '';
  wrapper.innerHTML = `${!isSelf ? `<div class="msg-name">${escapeHtml(msg.name)}</div>` : ''}<div class="msg-bubble">${escapeHtml(msg.text)}</div><div class="msg-time">${timeStr}</div>`;
  messagesEl.appendChild(wrapper);

  // Track unread: not your own, not historical, window not focused
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

toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
});

if (window.innerWidth <= 700) {
  sidebar.classList.add('hidden');
}

// ===== RESUME SESSION AFTER ADMIN VISIT =====
// If we return from admin.html with saved state, restore it
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
        // Rejoin their room automatically
        enterRoom(s.room);
      } else {
        goToRoomSelect();
      }
    }
  } catch(e) {
    console.warn('Failed to restore session:', e);
  }
}

// When user clicks admin link while chatting, save session
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
