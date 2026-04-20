import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PropertyService } from '@/app/services/property-service';
import { Property } from '@/types';
import { Observable } from 'rxjs';
import { LightboxService } from '@/app/services/lightbox-service';

@Component({
  selector: 'app-property-details',
  standalone: true,
  // Add DecimalPipe to imports here
  imports: [AsyncPipe, DecimalPipe], 
  template: `
    @if (property$ | async; as property) {
    <div class="page-container">
      <div class="gallery-container">
    <div class="hero-image">
      <img [src]="property.image[0]" (click)="openLightbox(property, 0)" alt="Main">
    </div>

    <div class="thumbnail-grid">
      @for (img of property.image.slice(1, 5); track img; let i = $index) {
        <div class="thumbnail-wrapper">
          <img [src]="img" (click)="openLightbox(property, i + 1)" alt="Thumb">
          
          @if (i === 3 && property.image.length > 5) {
            <div class="more-overlay" (click)="openLightbox(property, 5); $event.stopPropagation()">
              <span>+{{ property.image.length - 5}}</span>
            </div>
          }
        </div>
      }
    </div>
  </div>

      <div class="property-info-section">
        <h1>{{ property.title }}</h1>
        <div class="price-tag">₹ {{ property.price | number:'1.0-0' }}</div>
        <p class="location-text">{{ property.location }}, {{ property.city }}</p>
        
        <div class="specs-grid">
          <div class="spec-item"><strong>{{ property.beds }}</strong> Beds</div>
          <div class="spec-item"><strong>{{ property.baths }}</strong> Baths</div>
          <div class="spec-item"><strong>{{ property.sqft }}</strong> Sq.ft</div>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; padding: 20px; }
    
    /* Gallery stays on top */
    .gallery-container { display: flex; gap: 15px; max-width: 1000px; margin: 0 auto; }
  .hero-image { flex: 2; }
  .hero-image img { width: 100%; height: 400px; object-fit: cover; border-radius: 8px; cursor: pointer; }

  .thumbnail-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  
  .thumbnail-wrapper { position: relative; cursor: pointer; }
  .thumbnail-wrapper img { width: 100%; height: 195px; object-fit: cover; border-radius: 8px; }

  /* "+More" Styling */
  .more-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    border-radius: 8px;
  }

    /* Info Section at Bottom */
    .property-info-section { border-top: 1px solid #eee; padding-top: 20px; }
    .property-info-section h1 { font-size: 2rem; margin-bottom: 10px; }
    .price-tag { font-size: 1.5rem; color: #2c3e50; font-weight: bold; margin-bottom: 10px; }
    .location-text { color: #7f8c8d; font-size: 1.1rem; margin-bottom: 20px; }
    
    .specs-grid { display: flex; gap: 40px; }
    .spec-item { background: #f8f9fa; padding: 10px 20px; border-radius: 6px; }
  `]
})
export class PropertyDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private propertyService = inject(PropertyService);
  private lightboxService = inject(LightboxService);

  property$!: Observable<Property>;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.property$ = this.propertyService.getPropertyById(id);
    }
  }

  openLightbox(property: Property, index: number) {
  console.log(`Opening lightbox for:`, property.image, `at index: ${index}`);
  // Pass the full array and the index
  this.lightboxService.open(property.image, index);
}
}