import { Agent } from '@/types';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from '../config/app-config';

@Injectable({
  providedIn: 'root',
})
export class AgentService {

  private baseUrl = appConfig.baseUrl;
  private http = inject(HttpClient);
  private apiUrl = `${this.baseUrl}/api/agent`;
  
  getAgents(): Observable<Agent[]>{
    return this.http.get<Agent[]>(`${this.apiUrl}/agents`, { withCredentials: true });
  }

  getAgent(agentId: string): Observable<Agent>{
    return this.http.get<Agent>(`${this.apiUrl}/${agentId}`,  { withCredentials: true});
  }
}
