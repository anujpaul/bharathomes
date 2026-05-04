import { Property } from '../../types';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { appConfig } from '../config/app-config';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
    
  private http = inject(HttpClient);
  private apiUrl = `${appConfig.baseUrl}/api/property`;

  getProperties(): Observable<Property[]> {
      console.log(`Base URL : ${this.apiUrl}`);
      return this.http.get<Property[]>(this.apiUrl);
    }

  getPropertyById(id: string): Observable<Property> {
      console.log(`Get Property URL: ${this.apiUrl}/${id}`);
      const resp= this.http.get<Property>(`${this.apiUrl}/${id}`);
      return resp;
    }

    uploadImages(propertyId: string, files: File[]): Observable<Property> {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      return this.http.post<Property>(
        `${this.apiUrl}/${propertyId}/images`, 
        formData, 
        { withCredentials: true }
      );
    }
    
    deleteImage(propertyId: string, Url: string): Observable<void> {
      return this.http.delete<void>(
        `${this.apiUrl}/${propertyId}/images`,
        { body: { Url }, withCredentials: true }
      );
    }
    
    updateProperty(propertyId: string, data: Partial<Property>): Observable<Property> {
      return this.http.patch<Property>(
        `${this.apiUrl}/${propertyId}`,
        data,
        { withCredentials: true }
      );
    }  
}
