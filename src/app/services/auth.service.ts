import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, filter, take, timestamp } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userReady$ = new BehaviorSubject<any | null>(null);

  private http = inject(HttpClient);
  // Reactive signal to store user info
  user = signal<any | null>(null);

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

  constructor() {
    console.log(`Calling google api ${timestamp}`);
    this.checkSession();
    console.log(`Called google API ${timestamp}`);
  }

  async checkSession() {

    // if (window.location.hostname === 'localhost') {
    // // Inject a dummy user so your application thinks you are logged in
    // this.user.set({
    //       user_claims: [
    //         { 
    //           typ: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier', 
    //           val: '112577913013492532420' 
    //         },
    //         {
    //             "typ": "name",
    //             "val": "Anuj Local"
    //         }
    //       ]
    //     });
    //     console.log("Local Dev: Mock user set.");
    //     return;
    //   }

    // Azure provides the user profile at this endpoint
    this.http.get<any[]>('/.auth/me').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          // console.log('Data is ' + JSON.stringify(data, null, 2));
          this.user.set(data[0]);
          this.userReady$.next(data[0]);
          // this.fetchUserProfile();
        }
        else {
          console.log("AuthService: User is NOT logged in (/.auth/me returned empty)");
          this.user.set(null);
        }
      },
      error: () => this.user.set(null)
    });

    
  }

  waitForUser() {
    return this.userReady$.asObservable().pipe(
      filter(user => user !== null),
      take(1)
    );
  }







  fetchUserProfile() {
    this.http.get<any>('/api/user/profile').subscribe({
      next: (profile) => {

        console.log('Profile is ' + JSON.stringify(profile, null, 2));
        // Store this in a separate signal, e.g., 'userProfile'
        // This might contain: savedProperties, preferences, etc.


      }
    });
  }
}
