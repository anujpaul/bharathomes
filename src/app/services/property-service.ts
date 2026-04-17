import { Property } from '../../types';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

declare global {
  interface Window {
    __config: any;
  }
}

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  
  private baseUrl = window.__config.baseUrl;
  private http = inject(HttpClient);
  private apiUrl = `${this.baseUrl}/api/properties`;

  getProperties(): Observable<Property[]> {
      return this.http.get<Property[]>(this.apiUrl);
    }
}
