import { Routes } from '@angular/router';
import { PropertyDetailsComponent } from './pages/property-details/property-details'
import { HomePageComponent } from './pages/home/home';

export const routes: Routes = [
  // Define your routes here
  { path: '', component: HomePageComponent },
  { path: 'property/:id', component: PropertyDetailsComponent }
];