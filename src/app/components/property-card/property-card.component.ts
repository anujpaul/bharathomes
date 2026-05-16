import { CUSTOM_ELEMENTS_SCHEMA, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bed, Bath, Square, MapPin, Star } from 'lucide-angular';
import { Property } from '../../../types';
import { LightboxService } from '../../services/lightbox-service';
import { RouterLink } from '@angular/router';
import { InrPricePipe } from '@/app/pipes/inr-price.pipe';
import { LeafletModule } from '@bluehalo/ngx-leaflet';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, InrPricePipe, LeafletModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
      <div class="relative aspect-[4/3] overflow-hidden">

        <swiper-container [loop]="true" [pagination]="true" [navigation]="true">
          @for (img of property.images; track img; let i = $index) {
            <swiper-slide>
              @if (isVideo(img)) {
                <video [src]="img" controls preload="metadata" playsinline
                       class="w-full h-full object-cover bg-black"></video>
              } @else {
                <img [src]="img" class="w-full h-full object-cover cursor-pointer" (click)="openLightbox(i)" />
              }
            </swiper-slide>
          }
        </swiper-container>
        <!-- All badge wrappers need z-20 — Swiper injects its internal
             elements at z-index 10 after Angular renders, which silently
             covers any absolute-positioned sibling without an explicit
             higher z-index. -->
        <div class="absolute top-4 left-4 flex gap-2 z-20">
          @if (property.isFeatured) {
            <span class="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
              <lucide-icon [name]="StarIcon" class="w-3 h-3 fill-current"></lucide-icon>
              Featured
            </span>
          }
          @if (property.isReraRegistered) {
            <span class="bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg"
                  [title]="property.reraRegistrationNumber ? 'RERA: ' + property.reraRegistrationNumber : 'RERA Approved'">
              <!-- Inline checkmark — no extra lucide import needed. -->
              <svg viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 011.4-1.4L9 11.6l6.3-6.3a1 1 0 011.4 0z" clip-rule="evenodd" />
              </svg>
              RERA Approved
            </span>
          }
        </div>
        <div class="absolute bottom-4 left-4 z-20">
          <span class="bg-white/90 backdrop-blur-md text-gray-900 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
            {{property.type}}
          </span>
        </div>

        <!-- Days-in-market pill, top-right. Mirrors the listedSince badge
             on property-details.ts so the metric is visible at a glance
             without crowding the existing top-left badges.

             z-20 is REQUIRED here: Swiper initializes after Angular renders,
             then injects its own internal elements at z-index 10. Without
             explicit z-20 the pill briefly appears, then gets covered the
             moment Swiper finishes hydrating. -->
        @if (property.listedSince) {
          <div class="absolute top-4 right-4 z-20">
            <span class="bg-white/90 backdrop-blur-md text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              🕒 {{property.listedSince}} ago
            </span>
          </div>
        }
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
            {{ property.price | inrPrice }}<!--
            -->@if (isRent) {<span class="text-sm text-gray-500 font-medium ml-1">/ month</span>}
          </div>
          <a [routerLink]="['/property', property.id]"
            class="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors">
            Details
          </a>
        </div>
      </div>
    </div>
  `
})
export class PropertyCardComponent {
  @Input() property!: Property;
  
  constructor(private lightbox: LightboxService) {}

  StarIcon = Star;
  MapPinIcon = MapPin;
  BedIcon = Bed;
  BathIcon = Bath;
  SquareIcon = Square;

  ngOnInit() {
  console.log("Images array length:", this.property.images.length);
}
  
  openLightbox(index: number) {
    this.lightbox.open(this.property.images, index);
  }

  // Treat URLs ending in common video extensions as video media. Used by
  // the carousel to pick between <video> and <img>. Extension-based for now;
  // when we add a proper `mediaType` field to Property.images entries this
  // becomes `m.type === 'video'` and the regex goes away.
  isVideo(url: string): boolean {
    return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url);
  }

  /**
   * Case-insensitive check — at least one row in the DB has "Rent" with a
   * capital R because the normalization in PropertyService.CreatePropertyAsync
   * was added after that listing was created. Comparing lowercased on every
   * read defends against any future inconsistency too.
   */
  get isRent(): boolean {
    return this.property?.listingIntent?.toLowerCase() === 'rent';
  }
}
