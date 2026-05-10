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

  createProperty(payload: Omit<Property, 'id' | 'agents' | 'listerId' | 'agentId' >): Observable<Property> {
    return this.http.post<Property>(`${this.apiUrl}/property`, payload);
  }

  uploadImages(propertyId: string, files: File[]): Observable<string[]> {
    console.log(`Id is : ${propertyId}`);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file, file.name));
    return this.http.post<string[]>(`${this.apiUrl}/${propertyId}/media`, formData);
  }

  reorderImages(propertyId: string, images: { url: string, sortOrder: number }[]): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${propertyId}/reorder-images`, { images });
  }

    // uploadImages(propertyId: string, files: File[]): Observable<Property> {
    //   const formData = new FormData();
    //   files.forEach(file => formData.append('files', file));
    //   return this.http.post<Property>(
    //     `${this.apiUrl}/${propertyId}/images`, 
    //     formData, 
    //     { withCredentials: true }
    //   );
    // }
    
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

    uploadReraDoc(propertyId: string, file: File): Observable<void> {
      const formData = new FormData();
      formData.append('file', file, file.name);
      return this.http.post<void>(`${this.apiUrl}/${propertyId}/rera-doc`, formData);
    }
}
