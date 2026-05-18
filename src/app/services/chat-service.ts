import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';import { Observable } from 'rxjs';

/**
 * One turn in a chat. `role` matches the OpenAI chat-completions shape
 * so the backend can pass it straight through to OpenAI if it wants.
 *   - 'system' = grounding / personality prompt (set on first call only)
 *   - 'user'   = the human
 *   - 'assistant' = the LLM's reply
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Backend response shape. Match this in your /ai/bharathomes/chat handler. */
export interface ChatResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);

  // NOTE: real http:// scheme is required — without it Angular treats
  // this as a relative path against the current origin and the request
  // goes to /localhost:8085/... which 404s silently.
  // If the chat backend ever moves into the API app, swap this for
  // `${appConfig.baseUrl}/api/chat` or similar.
  private apiUrl = 'https://resume.azure-api.net/ai/bharathomes/chat';

  /**
   * Send the full conversation history each call. Stateless backend is
   * the simplest pattern — server forwards messages to OpenAI and
   * returns the assistant's reply. No session storage needed anywhere.
   */
  send(message: string): Observable<ChatResponse> {
    const headers = this.getHeader();
    return this.http.post<ChatResponse>(this.apiUrl, message , {headers});
  
  } 

  
  getHeader(): HttpHeaders{
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': 'bac3b53a10684a79977325d79356784f'
      })
    return headers;
   }

  
}
