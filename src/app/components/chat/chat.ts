import { ChatMessage, ChatService } from '@/app/services/chat-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component, ElementRef, HostListener, OnInit, ViewChild, signal,
} from '@angular/core';

/** What we actually render in the message list (timestamped UI rows). */
interface DisplayMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  failed?: boolean;
}

/**
 * Generic real-estate chat. Sends the full conversation history to
 * /ai/bharathomes/chat on each turn so the backend can pass it to
 * OpenAI as-is (or do RAG / function-calling on top later).
 *
 * The first message sent is always the system prompt below — it
 * grounds the assistant in real-estate context without the user
 * having to repeat it.
 */
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="chat-widget" [class.minimized]="isMinimized" [class.expanded]="isExpanded">

  <div *ngIf="isMinimized" class="chat-button" (click)="toggleChat()">
    <div class="chat-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
      </svg>
    </div>
    <span class="pulse-dot"></span>
  </div>

  <div *ngIf="!isMinimized" class="chat-window">

    <div class="chat-header">
      <div class="header-info">
        <div class="avatar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
          </svg>
        </div>
        <div class="header-text">
          <h4>BharatHomes Assistant</h4>
          <span class="status">Online</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="icon-button" (click)="toggleExpand()" [title]="isExpanded ? 'Collapse' : 'Expand'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          </svg>
        </button>
        <button class="icon-button" (click)="closeChat()" title="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>

    <div #chatContainer class="chat-messages">
      <div
        *ngFor="let message of messages()"
        [class]="message.role === 'user' ? 'user-message' : 'bot-message'"
        [class.failed]="message.failed"
        class="message"
      >
        <div class="message-content">{{ message.text }}</div>
        <div class="message-time">{{ formatTime(message.timestamp) }}</div>
      </div>

      <div *ngIf="isTyping()" class="typing-indicator">
        <div class="typing-dots"><span></span><span></span><span></span></div>
        <span>Assistant is typing…</span>
      </div>

      <!-- Suggestion chips: only shown until the user sends their first
           real message. Quick on-ramps for the most common questions. -->
      <div *ngIf="messages().length <= 1 && !isTyping()" class="suggestions">
        <button *ngFor="let s of suggestions" type="button"
                class="suggestion-chip" (click)="useSuggestion(s)">
          {{ s }}
        </button>
      </div>
    </div>

    <div class="chat-input-container">
      <div class="input-wrapper">
        <textarea
          [(ngModel)]="userInput"
          (keydown)="onKeyPress($event)"
          placeholder="Ask about buying, renting, listing, RERA…"
          rows="1"
          class="chat-input text-gray-900"
          [disabled]="isTyping()"
        ></textarea>
        <button
          type="button"
          (click)="sendMessage()"
          [disabled]="!userInput.trim() || isTyping()"
          class="send-button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>
  `,
  styles: `
  .chat-widget {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999;
  }
  .chat-widget.expanded .chat-window {
    width: 400px;
    height: 600px;
  }

  .chat-button {
    position: relative;
    width: 60px; height: 60px;
    background: #2563eb;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
    transition: all 0.3s ease;
    color: white;
  }
  .chat-button:hover { transform: scale(1.1); box-shadow: 0 6px 25px rgba(37, 99, 235, 0.4); }
  .chat-button .chat-icon { display: flex; align-items: center; justify-content: center; }
  .chat-button .pulse-dot {
    position: absolute; top: 12px; right: 12px;
    width: 12px; height: 12px;
    background: #10b981; border-radius: 50%;
    border: 2px solid white;
    animation: pulse 2s infinite;
  }

  .chat-window {
    width: 360px; height: 520px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    display: flex; flex-direction: column;
    overflow: hidden;
    transition: all 0.3s ease;
    border: 1px solid #e1e5e9;
  }

  .chat-header {
    padding: 16px 20px;
    background: #2563eb;
    color: white;
    display: flex; justify-content: space-between; align-items: center;
  }
  .chat-header .header-info { display: flex; align-items: center; gap: 12px; }
  .chat-header .avatar {
    width: 32px; height: 32px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
  .chat-header h4 { margin: 0; font-size: 16px; font-weight: 600; }
  .chat-header .status { font-size: 12px; opacity: 0.9; }
  .chat-header .header-actions { display: flex; gap: 8px; }
  .chat-header .icon-button {
    background: none; border: none; color: white; cursor: pointer;
    padding: 4px; border-radius: 4px;
    transition: background 0.2s ease;
  }
  .chat-header .icon-button:hover { background: rgba(255, 255, 255, 0.1); }

  .chat-messages {
    flex: 1; padding: 16px;
    overflow-y: auto;
    background: #f8fafc;
    display: flex; flex-direction: column; gap: 12px;
  }
  .chat-messages::-webkit-scrollbar { width: 4px; }
  .chat-messages::-webkit-scrollbar-track { background: #f1f1f1; }
  .chat-messages::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 2px; }

  .message {
    max-width: 85%;
    padding: 10px 14px;
    border-radius: 18px;
    animation: fadeIn 0.3s ease-in;
  }
  .message.user-message {
    align-self: flex-end;
    background: #2563eb; color: white;
    border-bottom-right-radius: 4px;
  }
  .message.user-message .message-time { text-align: right; color: rgba(255, 255, 255, 0.7); }
  .message.bot-message {
    align-self: flex-start;
    background: white; color: #374151;
    border: 1px solid #e5e7eb;
    border-bottom-left-radius: 4px;
  }
  .message.bot-message .message-time { color: #6b7280; }
  .message.failed { border-color: #dc2626; }
  .message.failed .message-content::before {
    content: "⚠️ ";
  }
  .message .message-content { margin-bottom: 4px; line-height: 1.4; font-size: 14px; white-space: pre-wrap; }
  .message .message-time { font-size: 10px; margin-top: 2px; }

  .typing-indicator {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px;
    background: white; border: 1px solid #e5e7eb;
    border-radius: 18px; border-bottom-left-radius: 4px;
    align-self: flex-start;
    color: #6b7280; font-size: 12px;
  }
  .typing-dots { display: flex; gap: 3px; }
  .typing-dots span {
    width: 5px; height: 5px;
    background: #9ca3af; border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
  }
  .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
  .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

  .suggestions {
    display: flex; flex-direction: column;
    gap: 6px;
    padding: 8px 0;
  }
  .suggestion-chip {
    align-self: flex-start;
    background: white;
    border: 1px solid #cbd5e1;
    color: #2563eb;
    padding: 8px 12px;
    border-radius: 14px;
    font-size: 12.5px;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s, border-color 0.15s;
  }
  .suggestion-chip:hover {
    background: #eff6ff;
    border-color: #2563eb;
  }

  .chat-input-container { padding: 16px; background: white; border-top: 1px solid #e5e7eb; }
  .input-wrapper {
    display: flex; align-items: flex-end; gap: 8px;
    background: #f8fafc;
    border: 1px solid #e1e5e9;
    border-radius: 20px;
    padding: 6px 12px;
  }
  .input-wrapper:focus-within { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1); }
  .chat-input {
    flex: 1; border: none; outline: none;
    background: transparent; resize: none;
    font-family: inherit; font-size: 14px; line-height: 1.4;
    max-height: 80px; min-height: 20px;
  }
  .chat-input::placeholder { color: #9ca3af; }
  .chat-input:disabled { opacity: 0.6; cursor: not-allowed; }

  .send-button {
    background: #2563eb; border: none;
    border-radius: 50%; width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    color: white; cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  .send-button:hover:not(:disabled) { background: #1d4ed8; transform: scale(1.05); }
  .send-button:disabled { background: #9ca3af; cursor: not-allowed; transform: none; }
  .send-button svg { margin-left: 1px; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes typing { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-3px); } }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
  }

  @media (max-width: 480px) {
    .chat-widget { bottom: 10px; right: 10px; left: 10px; }
    .chat-window { width: 100% !important; height: 70vh; }
  }
  `,
})
export class Chat implements OnInit {
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  /**
   * Grounding system prompt. Lives in the component so it's easy to
   * tweak in code review; you could also move it to a config file or
   * fetch from the backend if you want non-developers to edit it.
   */
  private systemPrompt = `You are the BharatHomes Assistant, helping users navigate buying, renting, or listing property in India (especially Uttar Pradesh: Lucknow, Noida, Ghaziabad, Agra, Kanpur, Varanasi). You help all roles: buyers, sellers, renters, agents, and listers. Be concise, factual, and friendly. When users ask about a specific property feature (price, location, amenities), suggest they check the listing or filters. For RERA, KYC, payment, or platform-specific questions, give accurate information. If you don't know something specific to BharatHomes, say so and suggest contacting support.`;

  /** Quick on-ramps shown until the user sends their first message. */
  readonly suggestions = [
    'How do I list a property for rent?',
    'What does RERA approved mean?',
    'Show me apartments in Noida under ₹1Cr',
    'How does KYC verification work?',
  ];

  /** Display-side messages shown in the UI. Signal so Angular sees
   *  changes that happen from inside HTTP subscribe callbacks — the
   *  app runs zoneless so plain props don't trigger re-render after
   *  async work completes. */
  messages = signal<DisplayMessage[]>([]);

  /** Wire-format history sent to the backend with each call. Not a
   *  signal because it's not read from the template. */
  private history: ChatMessage[] = [];

  /** Same reason as `messages`: flipped in async callbacks, must be
   *  a signal so the typing indicator actually disappears. */
  isTyping = signal(false);

  userInput = '';
  isMinimized = true;
  isExpanded = false;

  constructor(private service: ChatService) {}

  ngOnInit() {
    // Seed system prompt and the initial assistant greeting. The greeting
    // is rendered in the UI; the system prompt is only sent to the API.
    this.history.push({ role: 'system', content: this.systemPrompt });
    this.messages.set([{
      role: 'assistant',
      text: "Hi! I'm here to help with buying, renting, or listing property on BharatHomes. What can I help you with today?",
      timestamp: new Date(),
    }]);
  }

  formatTime(date: Date): string {
    // Vanilla Intl.DateTimeFormat — no DatePipe dependency, no provider
    // gymnastics, identical "shortTime" output (e.g. "3:42 PM").
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric', minute: '2-digit',
    }).format(date);
  }

  toggleChat()    { this.isMinimized = !this.isMinimized; }
  toggleExpand()  { this.isExpanded = !this.isExpanded; }
  closeChat()     { this.isMinimized = true; }

  useSuggestion(text: string) {
    this.userInput = text;
    this.sendMessage();
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text || this.isTyping()) return;

    // Show user message immediately for snappy feel.
    this.messages.update(m => [...m, { role: 'user', text, timestamp: new Date() }]);
    this.history.push({ role: 'user', content: text });
    this.userInput = '';
    this.isTyping.set(true);
    this.scrollToBottom();

    this.service.send(text).subscribe({
      next: (resp) => {
        this.isTyping.set(false);
        const reply = resp?.message ?? '(no response)';
        this.messages.update(m => [...m, { role: 'assistant', text: reply, timestamp: new Date() }]);
        this.history.push({ role: 'assistant', content: reply });
        this.scrollToBottom();
      },
      error: (err) => {
        this.isTyping.set(false);
        console.error('Chat send failed', err);
        this.messages.update(m => [...m, {
          role: 'assistant',
          text: 'Sorry — I couldn\'t reach the assistant right now. Please try again in a moment.',
          timestamp: new Date(),
          failed: true,
        }]);
        // Roll back the last user message from history so a retry
        // doesn't duplicate it on the server side.
        this.history.pop();
        this.scrollToBottom();
      },
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop =
          this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(_event: MouseEvent) {
    // Intentionally a no-op — click-outside-to-close was distracting
    // when users tab away to copy info from a listing.
  }
}
