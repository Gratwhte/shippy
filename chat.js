// Load Firebase from CDN (no build step needed)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase, ref, push, onChildAdded, query, limitToLast, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

import { firebaseConfig, MAX_MESSAGES } from "./firebase-config.js";

// ===== INIT FIREBASE =====
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, 'messages');

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
let listenerAttached = false;

// ===== NAME ENTRY =====
// Remember the name if they've been here before
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

joinBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) return;
  currentUser = name;
  localStorage.setItem('chatter_name', name);
  enterChat();
});

function enterChat() {
  nameScreen.classList.remove('active');
  chatScreen.classList.add('active');
  displayName.textContent = currentUser;
  msgInput.focus();

  // Start listening for messages (only once)
  if (!listenerAttached) {
    listenForMessages();
    listenerAttached = true;
  }
}

leaveBtn.addEventListener('click', () => {
  chatScreen.classList.remove('active');
  nameScreen.classList.add('active');
  nameInput.focus();
});

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

function sendMessage() {
  const text = msgInput.value.trim();
  if (!text || !currentUser) return;
  push(messagesRef, {
    name: currentUser,
    text: text,
    timestamp: serverTimestamp()
  }).catch(err => {
    console.error('Send failed:', err);
    showSystemMessage('⚠️ Failed to send message. Check console.');
  });
  msgInput.value = '';
  updateSendButton();
  msgInput.focus();
}

// ===== RECEIVING MESSAGES =====
function listenForMessages() {
  const recentQuery = query(messagesRef, limitToLast(MAX_MESSAGES));
  onChildAdded(recentQuery, (snapshot) => {
    const msg = snapshot.val();
    if (!msg) return;
    addMessage(msg);
  }, (error) => {
    console.error('Listen failed:', error);
    showSystemMessage('⚠️ Connection error. Check Firebase setup.');
  });
}

function addMessage(msg) {
  const isSelf = msg.name === currentUser;
  const wrapper = document.createElement('div');
  wrapper.className = `message ${isSelf ? 'self' : 'other'}`;

  const timeStr = msg.timestamp ? formatTime(msg.timestamp) : '';

  wrapper.innerHTML = `
    ${!isSelf ? `<div class="msg-name">${escapeHtml(msg.name)}</div>` : ''}
    <div class="msg-bubble">${escapeHtml(msg.text)}</div>
    <div class="msg-time">${timeStr}</div>
  `;
  messagesEl.appendChild(wrapper);
  // Auto-scroll to bottom
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showSystemMessage(text) {
  const el = document.createElement('div');
  el.className = 'system-msg';
  el.textContent = text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function formatTime(ts) {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// Prevents XSS / HTML injection in messages
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
