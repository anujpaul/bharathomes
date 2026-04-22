import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Home, Search, User, Menu } from 'lucide-angular';
import { RouterLink } from '@angular/router';
import { AuthService } from '@/app/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  templateUrl: `./navbar.component.html`
})
export class NavbarComponent {
  HomeIcon = Home;
  SearchIcon = Search;
  UserIcon = User;
  MenuIcon = Menu;
  isMenuOpen = false;

  authService = inject(AuthService);

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  loginUrl = '/.auth/login/google?post_login_redirect_uri=/';
  logoutUrl = '/.auth/logout?post_login_redirect_uri=/';
}
