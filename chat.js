// Load Supabase from CDN (no build step)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import { SUPABASE_URL, SUPABASE_ANON_KEY, MAX_MESSAGES } from "./supabase-config.js";

// ===== INIT SUPABASE =====
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

let currentUser = null;
let realtimeChannel = null;

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
  localStorage.setItem('chatter_name', name);
  await enterChat();
});

async function enterChat() {
  nameScreen.classList.remove('active');
  chatScreen.classList.add('active');
  displayName.textContent = currentUser;
  msgInput.focus();

  // Clear any previous messages (in case user leaves and rejoins)
  messagesEl.innerHTML = '';

  // 1. Load recent message history
  await loadRecentMessages();

  // 2. Subscribe to new messages in real time
  subscribeToNewMessages();
}

leaveBtn.addEventListener('click', () => {
  // Unsubscribe from realtime
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  chatScreen.classList.remove('active');
  nameScreen.classList.add('active');
  nameInput.focus();
});

// ===== LOAD MESSAGE HISTORY =====
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

  // Reverse so oldest is on top
  data.reverse().forEach(addMessage);
  scrollToBottom();
}

// ===== REALTIME SUBSCRIPTION =====
function subscribeToNewMessages() {
  realtimeChannel = supabase
    .channel('messages-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        addMessage(payload.new);
        scrollToBottom();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Connected to realtime');
      } else if (status === 'CHANNEL_ERROR') {
        showSystemMessage('⚠️ Realtime connection error.');
      }
    });
}

// ===== SENDING MESSAGES =====
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

  // Clear input optimistically
  msgInput.value = '';
  updateSendButton();
  msgInput.focus();

  const { error } = await supabase
    .from('messages')
    .insert({ name: currentUser, text });

  if (error) {
    console.error('Send failed:', error);
    showSystemMessage('⚠️ Failed to send message.');
    // Restore text so user doesn't lose it
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
    ${!isSelf ? `<div class="msg-name">${escapeHtml(msg.name)}</div>` : ''}
    <div class="msg-bubble">${escapeHtml(msg.text)}</div>
    <div class="msg-time">${timeStr}</div>
  `;
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
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
