import { Agent } from '@/types';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AgentService {

  private http = inject(HttpClient);
  private apiUrl = 'https://bharathomes-service.azurewebsites.net/api/agents';
  
  getAgents(): Observable<Agent[]>{
    return this.http.get<Agent[]>(this.apiUrl);
  }
}
