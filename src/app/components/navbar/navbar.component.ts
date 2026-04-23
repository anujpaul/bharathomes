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
  authMode = signal<'signin' | 'signup'>('signin');

  email = signal('');
  password = signal('');
  name = signal('');
  isLoading = signal(false);
  errorMessage = signal('');



  authService = inject(AuthService);

  toggleMenu() { this.isMenuOpen = !this.isMenuOpen; }
  
  openAuthModal(mode: 'signin' | 'signup' = 'signin') {
    this.authMode.set(mode);
    this.showAuthModal.set(true);
    this.isMenuOpen = false;
    this.resetForm();
  }

  closeAuthModal() { 
    this.showAuthModal.set(false); 
    this.email.set('');
    this.password.set('');
    this.errorMessage.set('');
  }

  switchMode(mode: 'signin' | 'signup') {
    this.authMode.set(mode);
    this.resetForm();
  }

  resetForm() {
    this.email.set('');
    this.password.set('');
    this.name.set('');
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

  async signUp() {
    if (!this.name() || !this.email() || !this.password()) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }
    if (this.password().length < 8) {
      this.errorMessage.set('Password must be at least 8 characters');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      await this.authService.signUpWithEmail(this.name(), this.email(), this.password());
      this.closeAuthModal();
    } catch (err: any) {
      this.errorMessage.set(err.message ?? 'Sign up failed');
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleSignOut() {
  await this.authService.signOut();
  }


  loginUrl = '/.auth/login/google?post_login_redirect_uri=/';
  logoutUrl = '/.auth/logout?post_login_redirect_uri=/';
}