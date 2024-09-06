// Imports
import { ready } from 'https://lsong.org/scripts/dom.js';
import { query } from 'https://lsong.org/scripts/query.js';
import { parse } from 'https://lsong.org/scripts/marked.js';
import { Ollama } from './ollama.js';

// Constants and Initialization
const { system = '', assistant = '', user = '', model = 'qwen2:latest' } = query;
const ollama = new Ollama({ host: 'https://ollama.lsong.org' });
const history = [];

// DOM Elements
let form, systemInput, userInput, messageList, modelsSelect;

// Helper Functions
function createMessageElement(role, content) {
  const messageElement = document.createElement('li');
  messageElement.className = `message-role-${role}`;
  messageElement.innerHTML = parse(content);
  return messageElement;
}

async function appendMessage(role, content) {
  const messageElement = createMessageElement(role, content);
  messageList.appendChild(messageElement);
  history.push({ role, content });
  return messageElement;
}

async function handleSend() {
  if (history.length === 0 && systemInput.value) {
    await appendMessage('system', systemInput.value);
  }
  const userContent = userInput.value.trim();
  await appendMessage('user', userContent);
  const responseStream = ollama.chat({
    model: modelsSelect.value,
    messages: [...history]
  });
  const assistantMessage = await appendMessage('assistant', '');
  for await (const part of responseStream) {
    if (part.error) {
      return;
    }
    const { content } = part.message;
    assistantMessage.innerHTML = parse(history[history.length - 1].content += content);
  }
  userInput.value = '';
  userInput.focus();
}

async function initializeChat() {
  if (model) {
    const models = await ollama.list();
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.model;
      option.textContent = model.name;
      modelsSelect.appendChild(option);
    });
    modelsSelect.value = model;
  }
  if (system) {
    systemInput.value = system;
    await appendMessage('system', system);
  }
  if (assistant) {
    await appendMessage('assistant', assistant);
  }
  if (user) {
    userInput.value = user;
    await handleSend();
  }
}

// Main Function
ready(async () => {
  // Initialize DOM elements
  form = document.getElementById('form');
  systemInput = document.getElementById('system');
  userInput = document.getElementById('user');
  messageList = document.getElementById('messages');
  modelsSelect = document.getElementById('models');

  // Set up event listeners
  form.addEventListener('submit', async e => {
    e.preventDefault();
    await handleSend();
  });

  // Initialize chat and populate models list
  await initializeChat();
});