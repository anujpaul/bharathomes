import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [],
  template: `
    <p>
      property-details works!
    </p>
  `,
  styles: ``,
})
export class PropertyDetailsComponent implements OnInit {
  // Use inject to get the route parameters
  private route = inject(ActivatedRoute);
  propertyId: string | null = null;

  ngOnInit() {
    this.propertyId = this.route.snapshot.paramMap.get('id');
  }
}