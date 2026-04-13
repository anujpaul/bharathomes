import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, MapPin } from 'lucide-angular';
import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <section class="relative h-[600px] flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 z-0">
        <img
          [src]="heroImage"
          alt="Agra Taj Mahal"
          class="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      </div>

      <div class="relative z-10 max-w-4xl w-full px-4 text-center">
        <h1 class="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
          Find your dream home in <span class="text-blue-400">Uttar Pradesh</span>
        </h1>
        
        <p class="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light">
          Premium listings in Noida, Greater Noida, and Agra. 
          Specializing in properties along the Express Highways.
        </p>

        <div class="bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto">
          <div class="flex-1 flex items-center px-4 gap-3 border-b md:border-b-0 md:border-r border-gray-100 py-2">
            <lucide-icon [name]="MapPinIcon" class="w-5 h-5 text-blue-600"></lucide-icon>
            <input
              type="text"
              placeholder="Enter City, Locality or Expressway..."
              class="w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder:text-gray-400"
              (input)="onInputChange($event)"
            />
          </div>
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
            <lucide-icon [name]="SearchIcon" class="w-5 h-5"></lucide-icon>
            Search Properties
          </button>
        </div>

        <div class="mt-8 flex flex-wrap justify-center gap-4">
          <span *ngFor="let tag of tags" class="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium">
            {{tag}}
          </span>
        </div>
      </div>
    </section>
  `
})
export class HeroComponent {
  @Output() search = new EventEmitter<string>();
  
  SearchIcon = Search;
  MapPinIcon = MapPin;
  tags = ['Noida Expressway', 'Yamuna Expressway', 'Agra Expressway'];
  heroImage =`${environment.blobBaseUrl}/images/TajMahalDoor.avif?${environment.sasToken}`;
  onInputChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.search.emit(value);
  }
}
