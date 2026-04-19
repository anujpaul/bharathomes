import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [],
  template: `
    <p>
      <img src="https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=2076&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D">
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
    console.log(`The Id is ${this.propertyId}`)
  }
}