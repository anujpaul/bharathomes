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

  authService = inject(AuthService);

  toggleMenu() { this.isMenuOpen = !this.isMenuOpen; }
  openAuthModal() { this.showAuthModal.set(true); }
  closeAuthModal() { this.showAuthModal.set(false); }

  loginUrl = '/.auth/login/google?post_login_redirect_uri=/';
  logoutUrl = '/.auth/logout?post_login_redirect_uri=/';
}