import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Home, Search, User, Menu } from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-2">
            <div class="bg-blue-600 p-2 rounded-lg">
              <lucide-icon [name]="HomeIcon" class="w-6 h-6 text-white"></lucide-icon>
            </div>
            <span class="text-xl font-bold tracking-tight text-gray-900">
              Bharat<span class="text-blue-600">Homes</span>
              <span class="ml-1 text-xs font-medium text-gray-400 uppercase tracking-widest">UP</span>
            </span>
          </div>

          <div class="hidden md:flex items-center gap-8">
            <a href="#" class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Buy</a>
            <a href="#" class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Rent</a>
            <a href="#" class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Sell</a>
            <a href="#" class="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Agents</a>
          </div>

          <div class="flex items-center gap-4">
            <button class="p-2 text-gray-400 hover:text-gray-600 md:hidden">
              <lucide-icon [name]="SearchIcon" class="w-5 h-5"></lucide-icon>
            </button>
            <button class="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
              <lucide-icon [name]="UserIcon" class="w-4 h-4"></lucide-icon>
              Sign In
            </button>
            <button class="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
              Sign Up
            </button>
            <button class="p-2 text-gray-600 md:hidden">
              <lucide-icon [name]="MenuIcon" class="w-6 h-6"></lucide-icon>
            </button>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  HomeIcon = Home;
  SearchIcon = Search;
  UserIcon = User;
  MenuIcon = Menu;
}
