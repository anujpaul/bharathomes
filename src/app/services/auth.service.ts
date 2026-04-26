import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, filter, firstValueFrom, Observable, of, take, tap } from 'rxjs';
import { appConfig } from '../config/app-config';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly TOKEN_KEY = 'local_auth_token';
  private userReady$ = new BehaviorSubject<any | null>(null);
  private idToken: string | null = null;
  private tokenExpiry: Date | null = null;

  private http = inject(HttpClient);
  private router = inject(Router);

  user = signal<any | null>(null);
  authResponse = signal<any | null>(null);

  // Constructor stays empty — app.config.ts APP_INITIALIZER calls checkSession()
  constructor() {}

  async checkSession(): Promise<void> {
    const rehydrated = await this.tryRehydrateLocalUser();
    if (rehydrated) return;

    await firstValueFrom(
      this.http.get<any[]>('/.auth/me').pipe(
        tap(data => {
          if (data && data.length > 0) {
            this.user.set(data[0]);
            this.userReady$.next(data[0]);
            this.idToken = data[0].id_token;
            this.tokenExpiry = new Date(data[0].expires_on);
            this.fetchUserProfile();
          } else {
            this.user.set(null);
          }
        }),
        catchError(err => {
          console.error('Session check failed', err);
          this.user.set(null);
          return of(null);
        })
      )
    );
  }

  async signInWithEmail(email: string, password: string): Promise<void> {
      try{
        const response = await firstValueFrom(
        this.http.post<any[]>(`${appConfig.baseUrl}/api/auth/login`, { email, password })
      );

      if (!response || response.length === 0) throw new Error('Invalid credentials');

      const data = response[0];

      localStorage.setItem(this.TOKEN_KEY, JSON.stringify({
        token: data.access_token,
        expiresAt: data.expires_on,
        user: {
          id: data.user_id,
          name: data.user_claims.find((c: any) =>
            c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname')?.val ?? '',
          email: data.user_claims.find((c: any) =>
            c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress')?.val ?? ''
        }
      }));

      this.setUser(data, data.access_token, data.expires_on);
      this.fetchUserProfile();
    }
    catch (err: any){
      if (err.status === 401) {
        throw new Error(err.error?.message || 'Unauthorized');
      }
      throw new Error(`It's not you, its us, something went wrong`);
    }
  }

  async signUpWithEmail(name: string, email: string, password: string): Promise<void> {
    try{
      const response = await firstValueFrom(
        this.http.post<any[]>(`${appConfig.baseUrl}/api/auth/register`, { name, email, password })
      );

      if (!response || response.length === 0) throw new Error('Registration failed');

      const data = response[0];

      localStorage.setItem(this.TOKEN_KEY, JSON.stringify({
        token: data.access_token,
        expiresAt: data.expires_on,
        user: {
          id: data.user_id,
          name: data.user_claims.find((c: any) =>
            c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname')?.val ?? '',
          email: data.user_claims.find((c: any) =>
            c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress')?.val ?? ''
        }
      }));

      this.setUser(data, data.access_token, data.expires_on);
      this.fetchUserProfile();
    }
    catch(err: any){
      if (err.status === 409) {
        throw new Error(err.error?.message || 'Email already registered');
      }

      if (err.status === 401) {
        throw new Error(err.error?.message || 'Unauthorized');
      }

      throw new Error('Something went wrong');

    }
  }

  private async tryRehydrateLocalUser(): Promise<boolean> {
    const stored = localStorage.getItem(this.TOKEN_KEY);
    if (!stored) return false;

    try {
      const parsed = JSON.parse(stored);
      const { token, expiresAt, user } = parsed;

      if (!token || !expiresAt || new Date() >= new Date(expiresAt)) {
        localStorage.removeItem(this.TOKEN_KEY);
        return false;
      }

      // Set token first so interceptor attaches it to the verify call
      this.idToken = token;
      this.tokenExpiry = new Date(expiresAt);

      const profile = await firstValueFrom(
        this.http.get<any>(`${appConfig.baseUrl}/api/user/profile`,{}).pipe(
          catchError(() => of(null))
        )
      );

      if (!profile) {
        localStorage.removeItem(this.TOKEN_KEY);
        this.idToken = null;
        this.tokenExpiry = null;
        return false;
      }

      const restoredUser = {
        user_id: user.email,
        provider_name: 'local',
        id_token: '',
        access_token: token,
        expires_on: expiresAt,
        user_claims: [
          { typ: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname', val: user.name },
          { typ: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier', val: user.id },
          { typ: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress', val: user.email }
        ]
      };

      this.user.set(restoredUser);
      this.userReady$.next(restoredUser);
      return true;

    } catch {
      localStorage.removeItem(this.TOKEN_KEY);
      this.idToken = null;
      this.tokenExpiry = null;
      return false;
    }
  }

  get userName(): string {
    const userData = this.user();
    if (!userData?.user_claims) return 'User';
    const claim = userData.user_claims.find((c: any) =>
      c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname');
    return claim?.val ?? 'User';
  }

  get uniqueUserId(): string | null {
    const userData = this.user();
    if (!userData?.user_claims) return null;
    const claim = userData.user_claims.find((c: any) =>
      c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier');
    return claim?.val ?? null;
  }

  get userEmail(): string {
    const userData = this.user();
    if (!userData?.user_claims) return 'No Email';
    const claim = userData.user_claims.find((c: any) =>
      c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress');
    return claim?.val ?? 'No Email';
  }

  waitForUser(): Observable<any> {
    return this.userReady$.asObservable().pipe(
      filter(user => user !== null),
      take(1)
    );
  }

  fetchUserProfile(): void {
    this.http.get<any>(`${appConfig.baseUrl}/api/user/profile`, {}).subscribe({
      next: profile => this.authResponse.set(profile),
      error: err => console.error('fetchUserProfile failed', err)
    });
  }

  editUserProfile(updatedProfile: any): void {
    this.http.put<any>(`${appConfig.baseUrl}/api/user/profile`, 
      updatedProfile).subscribe({
      next: profile => {
        this.authResponse.set(profile);
        const currentUser = this.user();
        if (currentUser?.user_claims) {
        const updatedClaims = currentUser.user_claims.map((c: any) => {
          if (c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname') {
            return { ...c, val: profile.name };
          }
          return c;
        });

        this.user.set({
          ...currentUser,
          user_claims: updatedClaims
        });
      }
      },
      error: err => console.error('Update Profile failed', err)
    });
  }
  

  // getProfile(): Observable<any> {
  //   return this.http.post<any>(`${appConfig.baseUrl}/api/user/profile`,{});
  // }

  async getValidToken(): Promise<string | null> {
    if (!this.idToken) return null;

    if (this.tokenExpiry && new Date() >= this.tokenExpiry) {
      const isLocal = this.user()?.provider_name === 'local';

      if (isLocal) {
        await this.signOut();
        return null;
      }

      try {
        await firstValueFrom(this.http.get('/.auth/refresh'));
        const data = await firstValueFrom(this.http.get<any[]>('/.auth/me'));
        this.idToken = data[0]?.id_token ?? null;
        this.tokenExpiry = new Date(data[0]?.expires_on);
      } catch {
        await this.signOut();
        return null;
      }
    }

    return this.idToken;
  }



  
  private setUser(userData: any, token: string, expiry: string): void {
    this.idToken = token;
    this.tokenExpiry = new Date(expiry);
    this.user.set(userData);
    this.userReady$.next(userData);
  }

  async signOut(): Promise<void> {
    const currentUser = this.user();

    this.user.set(null);
    this.idToken = null;
    this.tokenExpiry = null;
    this.authResponse.set(null);
    this.userReady$.next(null);
    sessionStorage.clear();
    localStorage.removeItem(this.TOKEN_KEY);

    if (currentUser?.provider_name === 'google') {
      window.location.href = '/.auth/logout?post_logout_redirect_uri=/';
    } else {
      this.router.navigate(['/']);
    }
  }
}