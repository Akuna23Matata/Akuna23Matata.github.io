/**
 * Chat Engine for Zhibo's AI Assistant
 * Pattern-matching based response system with hard-coded responses
 */

class ChatEngine {
  constructor() {
    this.messagesArea = document.getElementById('messagesArea');
    this.chatInput = document.getElementById('chatInput');
    this.sendButton = document.getElementById('sendButton');
    this.suggestionChips = document.querySelectorAll('.suggestion-chip');
    
    // Load responses from Jekyll-rendered JSON
    this.responses = this.loadResponses();
    
    // Bind events
    this.bindEvents();
  }
  
  /**
   * Load chat responses from the embedded JSON
   */
  loadResponses() {
    try {
      const dataElement = document.getElementById('chatResponsesData');
      if (dataElement) {
        return JSON.parse(dataElement.textContent);
      }
    } catch (e) {
      console.error('Failed to load chat responses:', e);
    }
    
    // Fallback responses if loading fails
    return {
      fallback: {
        responses: ["I'm having trouble loading my knowledge base. Please try refreshing the page!"]
      }
    };
  }
  
  /**
   * Bind event listeners
   */
  bindEvents() {
    // Send button click
    this.sendButton?.addEventListener('click', () => this.handleSend());
    
    // Enter key press
    this.chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    
    // Suggestion chips
    this.suggestionChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.dataset.query;
        this.chatInput.value = this.getChipQuery(query);
        this.handleSend();
      });
    });
  }
  
  /**
   * Get the full query for a suggestion chip
   */
  getChipQuery(query) {
    const queries = {
      'publications': 'What are Zhibo\'s publications?',
      'research': 'What are Zhibo\'s research interests?',
      'contact': 'How can I contact Zhibo?'
    };
    return queries[query] || query;
  }
  
  /**
   * Handle sending a message
   */
  handleSend() {
    const message = this.chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    this.addMessage(message, 'user');
    
    // Clear input
    this.chatInput.value = '';
    
    // Show typing indicator
    this.showTypingIndicator();
    
    // Generate response after a delay (simulate thinking)
    setTimeout(() => {
      this.hideTypingIndicator();
      const response = this.generateResponse(message);
      this.addMessage(response, 'assistant');
    }, 800 + Math.random() * 700);
  }
  
  /**
   * Add a message to the chat
   */
  addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    if (sender === 'assistant') {
      messageDiv.innerHTML = `
        <div class="avatar assistant-avatar">
          <i data-lucide="bot"></i>
        </div>
        <div class="bubble assistant-bubble">
          <p>${this.formatMessage(text)}</p>
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="bubble user-bubble">
          <p>${this.escapeHtml(text)}</p>
        </div>
        <div class="avatar user-avatar">
          <i data-lucide="user"></i>
        </div>
      `;
    }
    
    this.messagesArea.appendChild(messageDiv);
    
    // Re-initialize Lucide icons for new elements
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    // Scroll to bottom
    this.scrollToBottom();
  }
  
  /**
   * Format message text (handle newlines, etc.)
   */
  formatMessage(text) {
    return this.escapeHtml(text)
      .replace(/\n/g, '<br>')
      .replace(/•/g, '&bull;');
  }
  
  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'message assistant-message';
    indicator.innerHTML = `
      <div class="avatar assistant-avatar">
        <i data-lucide="bot"></i>
      </div>
      <div class="bubble assistant-bubble typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    this.messagesArea.appendChild(indicator);
    
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    this.scrollToBottom();
  }
  
  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.remove();
    }
  }
  
  /**
   * Scroll messages area to bottom
   */
  scrollToBottom() {
    this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
  }
  
  /**
   * Generate a response based on the user's message
   */
  generateResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check each category for pattern matches
    for (const [category, data] of Object.entries(this.responses)) {
      if (category === 'fallback') continue;
      
      if (data.patterns) {
        for (const pattern of data.patterns) {
          if (lowerMessage.includes(pattern.toLowerCase())) {
            return this.getRandomResponse(data.responses);
          }
        }
      }
    }
    
    // Return fallback response
    return this.getRandomResponse(this.responses.fallback?.responses || [
      "I'm not sure about that. Try asking about Zhibo's research, publications, or education!"
    ]);
  }
  
  /**
   * Get a random response from an array
   */
  getRandomResponse(responses) {
    if (!responses || responses.length === 0) {
      return "I'm not sure how to respond to that.";
    }
    const index = Math.floor(Math.random() * responses.length);
    return responses[index];
  }
}

// Initialize chat when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.chatEngine = new ChatEngine();
});
