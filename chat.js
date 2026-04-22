import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, MAX_MESSAGES } from "./supabase-config.js";

// ===== INIT =====
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== ELEMENTS =====
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
let currentUserId = null; // unique ID for this browser session
let messagesChannel = null;
let presenceChannel = null;

// ===== EMOJI DATA =====
const EMOJI_CATEGORIES = {
  '😀': {
    name: 'Smileys',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','💩','🤡','👹','👺','👻','👽','👾','🤖']
  },
  '👍': {
    name: 'Gestures',
    emojis: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🦷','🦴','👀','👁️','👅','👄','💋']
  },
  '❤️': {
    name: 'Hearts',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','💌','💋','💍','💎','🌹','🌷','💐','🥀','🌸','🌺']
  },
  '🎉': {
    name: 'Celebration',
    emojis: ['🎉','🎊','🎈','🎁','🎂','🍰','🧁','🍾','🥂','🍻','🍺','🥳','🎆','🎇','✨','🎐','🎀','🎗️','🏆','🥇','🥈','🥉','🏅','🎖️','🔥','💥','⭐','🌟','💫','⚡']
  },
  '🐶': {
    name: 'Animals',
    emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🐺','🐗','🐴','🦄','🐝','🪲','🦋','🐌','🐞','🐢','🐍','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈']
  },
  '🍔': {
    name: 'Food',
    emojis: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🧇','🧀','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🌮','🌯','🍜','🍝','🍣','🍤','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','☕','🍵','🧃','🥤','🧋','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🍾']
  },
  '⚽': {
    name: 'Activity',
    emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🎮','🕹️','🎲','🧩','♟️','🎯','🎳']
  },
  '🚗': {
    name: 'Travel',
    emojis: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🏍️','🛺','🚲','🛴','🛹','🛼','🚊','🚝','🚄','🚅','🚈','🚂','✈️','🛫','🛬','🛩️','💺','🚀','🛸','🚁','⛵','🚤','🛥️','🛳️','⛴️','🚢','⚓','🗺️','🗽','🗼','🏰','🏯','🏟️','🎡','🎢','🎠','🏖️','🏝️','⛰️','🏔️','🗻','🌋','🏕️','⛺']
  },
  '💡': {
    name: 'Objects',
    emojis: ['⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','🕹️','💾','💿','📀','📷','📹','🎥','📞','☎️','📺','📻','🎙️','🎚️','🎛️','⏱️','⏰','⏳','📡','🔋','🔌','💡','🔦','🕯️','🧯','🛢️','💸','💵','💰','💳','💎','⚖️','🧰','🔧','🔨','🛠️','⚙️','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🔭','🔬','🕳️','🩹','🩺','💊','💉','🧬','🦠','🧫','🧪','🌡️','🧹','🧺','🧻','🧼','🧽','🚽','🚿','🛁','🪥','🪒','🧴','🪞','🪣','🧷','🪡','🧵','🪢']
  },
  '🌈': {
    name: 'Symbols',
    emojis: ['✅','❌','⭕','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','💯','🔝','🆒','🆕','🆙','🆓','🆗','🆘','🈁','❗','❓','❕','❔','‼️','⁉️','💤','💢','💬','💭','🗯️','♨️','🌈','☀️','🌤️','⛅','🌥️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄','🌬️','💨','💧','💦','☔','☂️','🌊','🌫️']
  }
};

// ===== NAME ENTRY =====
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
  currentUser = name;
  currentUserId = generateUserId();
  localStorage.setItem('chatter_name', name);
  await enterChat();
});

function generateUserId() {
  return 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

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
  await leaveChat();
});

async function leaveChat() {
  if (messagesChannel) {
    await supabase.removeChannel(messagesChannel);
    messagesChannel = null;
  }
  if (presenceChannel) {
    await presenceChannel.untrack();
    await supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  }
  chatScreen.classList.remove('active');
  nameScreen.classList.add('active');
  usersList.innerHTML = '';
  onlineCount.textContent = '0';
  nameInput.focus();
}

// Leave cleanly when tab closes
window.addEventListener('beforeunload', () => {
  if (presenceChannel) {
    presenceChannel.untrack();
  }
});

// ===== MESSAGE HISTORY =====
async function loadRecentMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(MAX_MESSAGES);

  if (error) {
    console.error('Failed to load messages:', error);
    showSystemMessage('⚠️ Could not load messages. Check your Supabase setup.');
    return;
  }

  data.reverse().forEach(addMessage);
  scrollToBottom();
}

// ===== REALTIME MESSAGES =====
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

// ===== PRESENCE (online users) =====
function joinPresence() {
  presenceChannel = supabase.channel('online-users', {
    config: { presence: { key: currentUserId } }
  });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      renderOnlineUsers(state);
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
  // `state` is an object: { userId: [ { name, user_id, ... } ], ... }
  const users = [];
  for (const key in state) {
    const entries = state[key];
    if (entries && entries.length > 0) {
      users.push(entries[0]);
    }
  }

  // Sort: self first, then alphabetical
  users.sort((a, b) => {
    if (a.user_id === currentUserId) return -1;
    if (b.user_id === currentUserId) return 1;
    return a.name.localeCompare(b.name);
  });

  onlineCount.textContent = users.length;

  if (users.length === 0) {
    usersList.innerHTML = '<div class="empty-users">No one else here yet</div>';
    return;
  }

  usersList.innerHTML = users.map(u => {
    const isSelf = u.user_id === currentUserId;
    return `
      <div class="user-item ${isSelf ? 'is-self' : ''}">
        <div class="user-avatar" style="background: ${colorFromName(u.name)}">
          ${escapeHtml(u.name[0] || '?')}
        </div>
        <div class="user-name">${escapeHtml(u.name)}</div>
        <div class="user-dot"></div>
      </div>
    `;
  }).join('');
}

// Deterministic color from a name (same name = same color)
function colorFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

// ===== SEND MESSAGES =====
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

  const { error } = await supabase
    .from('messages')
    .insert({ name: currentUser, text });

  if (error) {
    console.error('Send failed:', error);
    showSystemMessage('⚠️ Failed to send message.');
    msgInput.value = text;
    updateSendButton();
  }
}

// ===== RENDER MESSAGES =====
function addMessage(msg) {
  const isSelf = msg.name === currentUser;
  const wrapper = document.createElement('div');
  wrapper.className = `message ${isSelf ? 'self' : 'other'}`;

  const timeStr = msg.created_at ? formatTime(msg.created_at) : '';

  wrapper.innerHTML = `
    $${!isSelf ? `<div class="msg-name">$${escapeHtml(msg.name)}</div>` : ''}
    <div class="msg-bubble">${escapeHtml(msg.text)}</div>
    <div class="msg-time">${timeStr}</div>
  `;
  messagesEl.appendChild(wrapper);
}

function showSystemMessage(text) {
  const el = document.createElement('div');
  el.className =
