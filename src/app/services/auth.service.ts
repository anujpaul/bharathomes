import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  // Reactive signal to store user info
  user = signal<any | null>(null);

  constructor() {
    this.checkSession();
  }

  async checkSession() {
    // Azure provides the user profile at this endpoint
    this.http.get<any[]>('/.auth/me').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.user.set(data[0]);
        }
      },
      error: () => this.user.set(null)
    });
  }
}
