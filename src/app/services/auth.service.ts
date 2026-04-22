import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, filter, firstValueFrom, Observable, of, take, tap, timestamp } from 'rxjs';
import { appConfig } from '../config/app-config';
import { UserProfile } from '@/types';


@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private userReady$ = new BehaviorSubject<any | null>(null);
  // userProfile$!: Observable<UserProfile>;

  private http = inject(HttpClient);
  // Reactive signal to store user info
  user = signal<any | null>(null);
  userProfile = signal<any | null>(null);
  get userName(): string {

    console.log("UserName called in AuthService");
    const userData = this.user();
    // Safely check if user_claims exists
    if (!userData || !userData.user_claims) return 'User';
    
    // Find the object where 'typ' is 'name'
    const nameClaim = userData.user_claims.find((c: any) => c.typ === 'name');
    return nameClaim ? nameClaim.val : 'User';
  }

  get uniqueUserId(): string | null {
  const user = this.user();
  if (!user || !user.user_claims) return null;
  
  // Find the claim specifically where the type is nameidentifier
  const idClaim = user.user_claims.find((c: any) => 
    c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
  );
  return idClaim ? idClaim.val : null;
}

get userEmail(): string {
  const user = this.user();
  if (!user || !user.user_claims) return 'No Email';

  // Find the claim with the specific email address type
  const emailClaim = user.user_claims.find((c: any) => 
    c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
  );

  return emailClaim ? emailClaim.val : 'No Email';
}

  constructor() {
    console.log(`Calling google api ${new Date().toLocaleTimeString()}`);
    // this.checkSession();
    console.log(`Called google API ${new Date().toLocaleTimeString()}`);
  }

  async checkSession(): Promise<any> {
  return firstValueFrom(this.http.get<any[]>('/.auth/me').pipe(
    tap(data => {
      if (data && data.length > 0) {
        this.user.set(data[0]);
        this.userReady$.next(data[0]);
        this.fetchUserProfile(data);
      } else {
        this.user.set(null);
      }
    }),
    catchError((err) => {
      console.error("AuthService: Session check failed", err);
      this.user.set(null);
      return of(null);
    })
  ));
}

  waitForUser() {
    return this.userReady$.asObservable().pipe(
      filter(user => user !== null),
      take(1)
    );
  }

  fetchUserProfile(data: any[]) {

    this.http.post<any>(`${appConfig.baseUrl}/api/userProfile`, data).subscribe({
      next: (profile) => {

        console.log('Profile is ' + JSON.stringify(profile, null, 2));
        this.userProfile.set(profile);
      }
    });
  }
}
