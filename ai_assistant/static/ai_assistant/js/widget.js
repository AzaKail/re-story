/**
 * AIstronaut Chat Widget Logic
 * Features:
 * - Session storage isolation (dialog lives only until tab is closed)
 * - Real-time SSE streaming response reader
 * - Dynamic i18n synchronization with ReStory language switch
 * - Mobile responsive adaptations (< 480px)
 * - Safe markdown formatting
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'aistronaut_dialog_history';

  const I18N = {
    en: {
      assistantName: 'AIstronaut',
      statusOnline: 'Online',
      triggerLabel: 'AIstronaut',
      placeholder: 'Ask about Moon and Mars...',
      greeting: 'Greetings, explorer! I am AIstronaut, your guide to the artifacts of the Moon and Mars. How may I assist your mission today?',
      clearConfirm: 'Clear current conversation history?',
      clearTooltip: 'Clear history',
      closeTooltip: 'Close chat',
      sendTooltip: 'Send message',
      errorGeneric: 'Communication error with AIstronaut. Please check your connection.',
    },
    ru: {
      assistantName: 'AIstronaut',
      statusOnline: 'В сети',
      triggerLabel: 'AIstronaut',
      placeholder: 'Спросите о миссиях и аппаратах...',
      greeting: 'Приветствую, исследователь! Я AIstronaut, ваш гид по артефактам Луны и Марса. Чем я могу помочь вам сегодня?',
      clearConfirm: 'Очистить историю текущего диалога?',
      clearTooltip: 'Очистить историю',
      closeTooltip: 'Закрыть чат',
      sendTooltip: 'Отправить сообщение',
      errorGeneric: 'Ошибка связи с AIstronaut. Пожалуйста, проверьте подключение.',
    },
    kk: {
      assistantName: 'AIstronaut',
      statusOnline: 'Желіде',
      triggerLabel: 'AIstronaut',
      placeholder: 'Миссиялар туралы сұраңыз...',
      greeting: 'Сәлем, зерттеуші! Мен AIstronaut, Ай мен Марс артефактілері бойынша сіздің жолсерігіңізбін. Бүгін сізге қалай көмектесе аламын?',
      clearConfirm: 'Ағымдағы әңгіме тарихын тазалау керек пе?',
      clearTooltip: 'Тарихты тазалау',
      closeTooltip: 'Чатты жабу',
      sendTooltip: 'Хабарлама жіберу',
      errorGeneric: 'AIstronaut-пен байланыс қатесі. Қосылымды тексеріңіз.',
    },
  };

  function getCurrentLanguage() {
    if (window.getLang && typeof window.getLang === 'function') {
      const siteLang = window.getLang();
      if (I18N[siteLang]) return siteLang;
    }
    const htmlLang = document.documentElement.lang;
    if (htmlLang && I18N[htmlLang]) return htmlLang;
    return 'en';
  }

  function getTranslation(key, lang) {
    const activeLang = lang || getCurrentLanguage();
    const dictionary = I18N[activeLang] || I18N.en;
    return dictionary[key] || I18N.en[key] || '';
  }

  // Escape HTML to prevent XSS before rendering formatting
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Basic safe markdown parser for model answers
  function renderMarkdown(rawText) {
    let text = escapeHtml(rawText);

    // Code blocks ```code```
    text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // Inline code `code`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Bulleted lists
    const lines = text.split('\n');
    let inList = false;
    const formattedLines = [];

    for (let line of lines) {
      const listMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
      if (listMatch) {
        if (!inList) {
          formattedLines.push('<ul>');
          inList = true;
        }
        formattedLines.push('<li>' + listMatch[2] + '</li>');
      } else {
        if (inList) {
          formattedLines.push('</ul>');
          inList = false;
        }
        formattedLines.push(line);
      }
    }
    if (inList) {
      formattedLines.push('</ul>');
    }

    let result = formattedLines.join('\n');
    // Newlines to <br> except inside tags
    result = result.replace(/\n/g, '<br>');
    return result;
  }

  // Session storage helpers
  function loadHistory() {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {}
  }

  function clearHistory() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  // Get CSRF cookie value for Django POST
  function getCsrfToken() {
    const cookie = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('csrftoken='));
    if (cookie) {
      return decodeURIComponent(cookie.split('=')[1]);
    }
    const meta = document.querySelector('input[name="csrfmiddlewaretoken"]');
    return meta ? meta.value : '';
  }

  class AIstronautWidget {
    constructor() {
      this.root = document.getElementById('aistronaut-widget');
      if (!this.root) return;

      this.triggerBtn = this.root.querySelector('.aistronaut-btn-trigger');
      this.card = this.root.querySelector('.aistronaut-card');
      this.closeBtn = this.root.querySelector('.aistronaut-btn-close');
      this.clearBtn = this.root.querySelector('.aistronaut-btn-clear');
      this.messagesContainer = this.root.querySelector('.aistronaut-messages');
      this.form = this.root.querySelector('.aistronaut-form');
      this.input = this.root.querySelector('.aistronaut-input');
      this.sendBtn = this.root.querySelector('.aistronaut-btn-send');
      this.statusText = this.root.querySelector('.aistronaut-status-text');

      this.isOpen = false;
      this.isGenerating = false;
      this.history = loadHistory();

      this.initEvents();
      this.applyTranslations();
      this.renderInitialState();
    }

    initEvents() {
      this.triggerBtn.addEventListener('click', () => this.toggle());
      this.closeBtn.addEventListener('click', () => this.close());
      this.clearBtn.addEventListener('click', () => this.handleClear());

      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSend();
      });

      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSend();
        }
      });

      // Auto-grow textarea height
      this.input.addEventListener('input', () => {
        this.input.style.height = 'auto';
        const scrollH = this.input.scrollHeight;
        const newHeight = Math.min(scrollH, 100);
        this.input.style.height = Math.max(newHeight, 24) + 'px';
        this.input.style.overflowY = scrollH > 100 ? 'auto' : 'hidden';
      });

      // Synchronize with external language switch
      window.addEventListener('langchange', () => {
        this.applyTranslations();
      });
    }

    applyTranslations() {
      const lang = getCurrentLanguage();
      this.statusText.textContent = getTranslation('statusOnline', lang);
      this.input.placeholder = getTranslation('placeholder', lang);
      this.closeBtn.title = getTranslation('closeTooltip', lang);
      this.clearBtn.title = getTranslation('clearTooltip', lang);
      this.sendBtn.title = getTranslation('sendTooltip', lang);

      const triggerLabel = this.triggerBtn.querySelector('.aistronaut-trigger-label');
      if (triggerLabel) {
        triggerLabel.textContent = getTranslation('triggerLabel', lang);
      }
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.isOpen = true;
      this.card.classList.add('open');
      this.triggerBtn.style.display = 'none';
      this.scrollToBottom();
      setTimeout(() => this.input.focus(), 150);
    }

    close() {
      this.isOpen = false;
      this.card.classList.remove('open');
      this.triggerBtn.style.display = 'flex';
    }

    renderInitialState() {
      this.messagesContainer.innerHTML = '';
      if (this.history.length === 0) {
        const greeting = getTranslation('greeting');
        this.appendMessage('assistant', greeting, false);
      } else {
        for (const msg of this.history) {
          this.appendMessage(msg.role, msg.content, false);
        }
      }
      this.scrollToBottom();
    }

    handleClear() {
      const confirmText = getTranslation('clearConfirm');
      if (window.confirm(confirmText)) {
        clearHistory();
        this.history = [];
        this.renderInitialState();
      }
    }

    appendMessage(role, content, saveToStorage = true) {
      const msgEl = document.createElement('div');
      msgEl.className = 'aistronaut-msg aistronaut-msg-' + (role === 'user' ? 'user' : 'bot');

      const bubble = document.createElement('div');
      bubble.className = 'aistronaut-bubble';
      bubble.innerHTML = renderMarkdown(content);

      msgEl.appendChild(bubble);
      this.messagesContainer.appendChild(msgEl);
      this.scrollToBottom();

      if (saveToStorage) {
        this.history.push({ role, content });
        saveHistory(this.history);
      }

      return bubble;
    }

    showTypingIndicator() {
      const typingEl = document.createElement('div');
      typingEl.className = 'aistronaut-msg aistronaut-msg-bot aistronaut-typing-wrapper';
      typingEl.innerHTML = `
        <div class="aistronaut-bubble aistronaut-typing">
          <span class="aistronaut-dot"></span>
          <span class="aistronaut-dot"></span>
          <span class="aistronaut-dot"></span>
        </div>
      `;
      this.messagesContainer.appendChild(typingEl);
      this.scrollToBottom();
      return typingEl;
    }

    scrollToBottom() {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async handleSend() {
      const text = this.input.value.trim();
      if (!text || this.isGenerating) return;

      this.input.value = '';
      this.input.style.height = '24px';
      this.input.style.overflowY = 'hidden';
      this.isGenerating = true;
      this.sendBtn.disabled = true;

      // Add user message
      this.appendMessage('user', text, true);

      // Show typing indicator
      const typingIndicator = this.showTypingIndicator();

      const activeLang = getCurrentLanguage();
      const payload = {
        message: text,
        language: activeLang,
        history: this.history.slice(-6),
        stream: true,
      };

      try {
        const response = await fetch('/ai-assistant/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }

        // Prepare bot message bubble
        if (typingIndicator && typingIndicator.parentNode) {
          typingIndicator.parentNode.removeChild(typingIndicator);
        }

        const botMsgEl = document.createElement('div');
        botMsgEl.className = 'aistronaut-msg aistronaut-msg-bot';
        const botBubble = document.createElement('div');
        botBubble.className = 'aistronaut-bubble';
        botMsgEl.appendChild(botBubble);
        this.messagesContainer.appendChild(botMsgEl);

        let fullAnswer = '';

        // Read streaming chunks from Server-Sent Events
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop(); // keep unfinished fragment in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              try {
                const eventData = JSON.parse(trimmed.slice(5).trim());
                if (eventData.error) {
                  fullAnswer += ' [' + eventData.error + ']';
                } else if (eventData.token) {
                  fullAnswer += eventData.token;
                  botBubble.innerHTML = renderMarkdown(fullAnswer);
                  this.scrollToBottom();
                }
              } catch (parseErr) {}
            }
          }
        }

        if (fullAnswer.trim()) {
          this.history.push({ role: 'assistant', content: fullAnswer.trim() });
          saveHistory(this.history);
        } else {
          botBubble.innerHTML = renderMarkdown(getTranslation('errorGeneric', activeLang));
        }
      } catch (err) {
        if (typingIndicator && typingIndicator.parentNode) {
          typingIndicator.parentNode.removeChild(typingIndicator);
        }
        const errorText = getTranslation('errorGeneric', activeLang);
        this.appendMessage('assistant', errorText, false);
      } finally {
        this.isGenerating = false;
        this.sendBtn.disabled = false;
        this.scrollToBottom();
        this.input.focus();
      }
    }
  }

  // Initialize widget after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new AIstronautWidget());
  } else {
    new AIstronautWidget();
  }
})();
