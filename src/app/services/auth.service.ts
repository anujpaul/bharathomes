import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  // Reactive signal to store user info
  user = signal<any | null>(null);

  get userName(): string {
    const userData = this.user();
    // Safely check if user_claims exists
    if (!userData || !userData.user_claims) return 'User';
    
    // Find the object where 'typ' is 'name'
    const nameClaim = userData.user_claims.find((c: any) => c.typ === 'name');
    return nameClaim ? nameClaim.val : 'User';
  }

  constructor() {
    this.checkSession();
  }

  async checkSession() {
    // Azure provides the user profile at this endpoint
    this.http.get<any[]>('/.auth/me').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          console.log(`Data is `)
          this.user.set(data[0]);
        }
      },
      error: () => this.user.set(null)
    });
  }
}
