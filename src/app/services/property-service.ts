import { Property } from '../../types';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from '../config/app-config';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  
  private baseUrl = appConfig.baseUrl;
  
  private http = inject(HttpClient);
  private apiUrl = `${this.baseUrl}/api/properties`;

  getProperties(): Observable<Property[]> {
      console.log(`Base URL : ${this.baseUrl}`);
      return this.http.get<Property[]>(this.apiUrl);
    }
}
