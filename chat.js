import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, MAX_MESSAGES } from "./supabase-config.js";

console.log('🔵 chat.js loaded');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const nameScreen = document.getElementById('nameScreen');
const chatScreen = document.getElementById('chatScreen');
const nameInput = document.getElementById('nameInput');
const joinBtn = document.getElementById('joinBtn');
const displayName = document.getElementById('displayName');
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

let currentUser = null;
let currentUserId = null;
let messagesChannel = null;
let presenceChannel = null;

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

const savedName = localStorage.getItem('chatter_name');
if (savedName) nameInput.value = savedName;

function updateJoinButton() {
  joinBtn.disabled = nameInput.value.trim().length === 0;
}
nameInput.addEventListener('input', updateJoinButton);
updateJoinButton();

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !joinBtn.disabled) joinBtn.click();
});

joinBtn.addEventListener('click', async () => {
  const name = nameInput.value.trim();
  if (!name) return;
  joinBtn.disabled = true;
  joinBtn.textContent = 'Joining...';
  try {
    currentUser = name;
    currentUserId = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('chatter_name', name);
    await enterChat();
  } catch (err) {
    console.error('Join failed:', err);
    alert('Join failed: ' + err.message);
    joinBtn.disabled = false;
    joinBtn.textContent = 'Join Chat →';
  }
});

async function enterChat() {
  nameScreen.classList.remove('active');
  chatScreen.classList.add('active');
  displayName.textContent = currentUser;
  msgInput.focus();
  messagesEl.innerHTML = '';
  await loadRecentMessages();
  subscribeToNewMessages();
  joinPresence();
}

leaveBtn.addEventListener('click', async () => {
  if (messagesChannel) {
    await supabase.removeChannel(messagesChannel);
    messagesChannel = null;
  }
  if (presenceChannel) {
    try { await presenceChannel.untrack(); } catch(e) {}
    await supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  }
  chatScreen.classList.remove('active');
  nameScreen.classList.add('active');
  usersList.innerHTML = '';
  onlineCount.textContent = '0';
  joinBtn.disabled = false;
  joinBtn.textContent = 'Join Chat →';
  nameInput.focus();
});

window.addEventListener('beforeunload', () => {
  if (presenceChannel) {
    try { presenceChannel.untrack(); } catch(e) {}
  }
});

async function loadRecentMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(MAX_MESSAGES);
  if (error) {
    console.error('Load messages error:', error);
    showSystemMessage('⚠️ ' + error.message);
    return;
  }
  if (data) data.reverse().forEach(addMessage);
  scrollToBottom();
}

function subscribeToNewMessages() {
  messagesChannel = supabase
    .channel('messages-channel')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        addMessage(payload.new);
        scrollToBottom();
      }
    )
    .subscribe();
}

function joinPresence() {
  presenceChannel = supabase.channel('online-users', {
    config: { presence: { key: currentUserId } }
  });
  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      renderOnlineUsers(presenceChannel.presenceState());
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({
          name: currentUser,
          user_id: currentUserId,
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
  if (!text || !currentUser) return;
  msgInput.value = '';
  updateSendButton();
  msgInput.focus();
  closeEmojiPicker();
  const { error } = await supabase.from('messages').insert({ name: currentUser, text });
  if (error) {
    console.error('Send failed:', error);
    showSystemMessage('⚠️ ' + error.message);
    msgInput.value = text;
    updateSendButton();
  }
}

function addMessage(msg) {
  const isSelf = msg.name === currentUser;
  const wrapper = document.createElement('div');
  wrapper.className = `message ${isSelf ? 'self' : 'other'}`;
  const timeStr = msg.created_at ? formatTime(msg.created_at) : '';
  wrapper.innerHTML = `${!isSelf ? `<div class="msg-name">${escapeHtml(msg.name)}</div>` : ''}<div class="msg-bubble">${escapeHtml(msg.text)}</div><div class="msg-time">${timeStr}</div>`;
  messagesEl.appendChild(wrapper);
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
  div.textContent = str;
  return div.innerHTML;
}

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

console.log('✅ chat.js ready');
