import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Home, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-angular';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <footer class="bg-gray-900 text-gray-300 pt-20 pb-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div class="space-y-6">
            <div class="flex items-center gap-2">
              <div class="bg-blue-600 p-2 rounded-lg">
                <lucide-icon [name]="HomeIcon" class="w-6 h-6 text-white"></lucide-icon>
              </div>
              <span class="text-xl font-bold tracking-tight text-white">
                Bharat<span class="text-blue-400">Homes</span>
                <span class="ml-1 text-xs font-medium text-gray-500 uppercase tracking-widest">UP</span>
              </span>
            </div>
            <p class="text-sm leading-relaxed text-gray-400">
              The most trusted real estate marketplace in Uttar Pradesh. 
              Connecting buyers with premium properties along the Noida, 
              Greater Noida, and Agra Expressways.
            </p>
            <div class="flex gap-4">
              <a *ngFor="let social of socials" href="#" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
                <lucide-icon [name]="social" class="w-5 h-5"></lucide-icon>
              </a>
            </div>
          </div>

          <div>
            <h4 class="text-white font-bold mb-6">Quick Links</h4>
            <ul class="space-y-4 text-sm">
              <li><a href="#" class="hover:text-blue-400 transition-colors">Search Properties</a></li>
              <li><a href="#" class="hover:text-blue-400 transition-colors">Featured Listings</a></li>
              <li><a href="#" class="hover:text-blue-400 transition-colors">Our Agents</a></li>
              <li><a href="#" class="hover:text-blue-400 transition-colors">Sell Your Property</a></li>
              <li><a href="#" class="hover:text-blue-400 transition-colors">Real Estate News</a></li>
            </ul>
          </div>

          <div>
            <h4 class="text-white font-bold mb-6">Locations</h4>
            <ul class="space-y-4 text-sm">
              <li><a href="#" class="hover:text-blue-400 transition-colors">Noida Expressway</a></li>
              <li><a href="#" class="hover:text-blue-400 transition-colors">Greater Noida West</a></li>
              <li><a href="#" class="hover:text-blue-400 transition-colors">Yamuna Expressway</a></li>
              <li><a href="#" class="hover:text-blue-400 transition-colors">Fatehabad Road, Agra</a></li>
              <li><a href="#" class="hover:text-blue-400 transition-colors">Shastri Puram, Agra</a></li>
            </ul>
          </div>

          <div>
            <h4 class="text-white font-bold mb-6">Contact Us</h4>
            <ul class="space-y-4 text-sm">
              <li class="flex items-start gap-3">
                <lucide-icon [name]="MapPinIcon" class="w-5 h-5 text-blue-400 shrink-0"></lucide-icon>
                <span>9 Sarojni Nagar, Sikandra Bodla Road, Agra, Uttar Pradesh</span>
              </li>
              <li class="flex items-center gap-3">
                <lucide-icon [name]="PhoneIcon" class="w-5 h-5 text-blue-400 shrink-0"></lucide-icon>
                <span>+91 97595 98991</span>
              </li>
              <li class="flex items-center gap-3">
                <lucide-icon [name]="MailIcon" class="w-5 h-5 text-blue-400 shrink-0"></lucide-icon>
                <span>sunnypaul@bharathomes.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-medium uppercase tracking-widest">
          <p>© 2024 BharatHomes UP. All Rights Reserved.</p>
          <div class="flex gap-8">
            <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" class="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" class="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  HomeIcon = Home;
  FacebookIcon = Facebook;
  TwitterIcon = Twitter;
  InstagramIcon = Instagram;
  LinkedinIcon = Linkedin;
  MailIcon = Mail;
  PhoneIcon = Phone;
  MapPinIcon = MapPin;

  socials = [Facebook, Twitter, Instagram, Linkedin];
}
