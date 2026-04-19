import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PropertyService } from '@/app/services/property-service';
import { Property } from '@/types';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [],
  template: `
      @if (property) {
      <div class="gallery-container">
        <div class="hero-image">
          <img [src]="property.image[0]" (click)="openLightbox(0)">
        </div>
        <div class="thumbnails">
          @for (img of property.image.slice(1, 4); track img; let i = $index) {
            <img [src]="img" (click)="openLightbox(i + 1)">
          }
        </div>
      </div>
      }
  }
  `,
  styles: ``,
})
export class PropertyDetailsComponent implements OnInit {
  
  // <p>
  //     <img src="https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=2076&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D">
  //   </p>

  // Use inject to get the route parameters
  private route = inject(ActivatedRoute);
  private propertyService = inject(PropertyService);

  property: Property | null = null;
  loading: boolean =true;
  // propertyId: string | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log(`The Id is ${id}`)

    if (id){
      this.propertyService.getPropertyById(id).subscribe({

        next: (data) => {
            this.property = data;
            this.loading = false;
        },
        error: (err) =>{
            console.error('Error fetching property:', err);
            this.loading = false;
        }
      })
    }
  }
  openLightbox(index: number) {
    console.log(`Opening lightbox at index: ${index}`);
    // This is where you will add your lightbox library logic
    // e.g., this.lightbox.open(this.property.images, index);
  }
}