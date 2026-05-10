import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { appConfig } from '../config/app-config';
import { Observable } from 'rxjs';
import { UserProfile } from '@/types';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private http = inject(HttpClient);
  private apiUrl = `${appConfig.baseUrl}/api/user`

  getUserProfileById(id: string): Observable<UserProfile>{
    console.log(`Getting profile of ${id}`);
    const user = this.http.get<UserProfile>(`${this.apiUrl}/${id}`);
    return user;
  }
  
}
