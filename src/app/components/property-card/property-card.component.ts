import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bed, Bath, Square, MapPin, Star } from 'lucide-angular';
import { Property } from '../../../types';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
      <div class="relative aspect-[4/3] overflow-hidden">
        <img
          [src]="property.image"
          [alt]="property.title"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div class="absolute top-4 left-4 flex gap-2">
          @if (property.isFeatured) {
            <span class="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
              <lucide-icon [name]="StarIcon" class="w-3 h-3 fill-current"></lucide-icon>
              Featured
            </span>
          }
          @if (property.expresswayProximity) {
            <span class="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
              Expressway Access
            </span>
          }
        </div>
        <div class="absolute bottom-4 left-4">
          <span class="bg-white/90 backdrop-blur-md text-gray-900 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
            {{property.type}}
          </span>
        </div>
      </div>

      <div class="p-6">
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {{property.title}}
          </h3>
        </div>
        
        <div class="flex items-center gap-1 text-gray-500 text-sm mb-4">
          <lucide-icon [name]="MapPinIcon" class="w-4 h-4"></lucide-icon>
          <span class="line-clamp-1">{{property.location}}</span>
        </div>

        <div class="flex items-center justify-between py-4 border-t border-gray-50 mb-4">
          <div class="flex flex-col items-center">
            <div class="flex items-center gap-1.5 text-gray-900 font-semibold">
              <lucide-icon [name]="BedIcon" class="w-4 h-4 text-blue-600"></lucide-icon>
              {{property.beds > 0 ? property.beds : '-'}}
            </div>
            <span class="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Beds</span>
          </div>
          <div class="h-8 w-px bg-gray-100"></div>
          <div class="flex flex-col items-center">
            <div class="flex items-center gap-1.5 text-gray-900 font-semibold">
              <lucide-icon [name]="BathIcon" class="w-4 h-4 text-blue-600"></lucide-icon>
              {{property.baths > 0 ? property.baths : '-'}}
            </div>
            <span class="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Baths</span>
          </div>
          <div class="h-8 w-px bg-gray-100"></div>
          <div class="flex flex-col items-center">
            <div class="flex items-center gap-1.5 text-gray-900 font-semibold">
              <lucide-icon [name]="SquareIcon" class="w-4 h-4 text-blue-600"></lucide-icon>
              {{property.sqft}}
            </div>
            <span class="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Sq.Ft</span>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-2xl font-black text-gray-900">
            {{formatCurrency(property.price)}}
          </div>
          <button class="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors">
            Details
          </button>
        </div>
      </div>
    </div>
  `
})
export class PropertyCardComponent {
  @Input() property!: Property;

  StarIcon = Star;
  MapPinIcon = MapPin;
  BedIcon = Bed;
  BathIcon = Bath;
  SquareIcon = Square;

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
