import { Routes } from '@angular/router';
import { PropertyDetailsComponent } from './pages/property-details/property-details'
import { HomePageComponent } from './pages/home/home';
import { ProfileComponent } from './pages/profile/profile';


export const routes: Routes = [
  // Define your routes here
  { path: '', component: HomePageComponent },
  { path: 'property/:id', component: PropertyDetailsComponent },
  { path: 'profile', component: ProfileComponent },
];