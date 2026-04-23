import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Home, Search, Menu, X } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { AuthService } from '@/app/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  HomeIcon = Home;
  SearchIcon = Search;
  MenuIcon = Menu;
  CloseIcon = X;

  isMenuOpen = false;
  showAuthModal = signal(false);

  email = signal('');
  password = signal('');
  isLoading = signal(false);
  errorMessage = signal('');



  authService = inject(AuthService);

  toggleMenu() { this.isMenuOpen = !this.isMenuOpen; }
  openAuthModal() { this.showAuthModal.set(true); this.isMenuOpen = false;}
  closeAuthModal() { 
    this.showAuthModal.set(false); 
    this.email.set('');
    this.password.set('');
    this.errorMessage.set('');
  }

  async signIn() {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Please enter email and password');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.signInWithEmail(this.email(), this.password());
      this.closeAuthModal();
    } catch (err: any) {
      this.errorMessage.set(err.message ?? 'Sign in failed');
    } finally {
      this.isLoading.set(false);
    }
  }




  loginUrl = '/.auth/login/google?post_login_redirect_uri=/';
  logoutUrl = '/.auth/logout?post_login_redirect_uri=/';
}