import { Property } from '../../types';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/properties';

  getProperties(): Observable<Property[]> {
      return this.http.get<Property[]>(this.apiUrl);
    }
}
