import { Routes } from '@angular/router';
import { PropertyDetailsComponent } from './pages/property-details/property-details'
import { HomePageComponent } from './pages/home/home';
import { ProfileComponent } from './pages/profile/profile';
import { CreateProperty } from './components/create-property/create-property';
import { Kyc } from './components/kyc/kyc';
import { kycGuard } from './guards/kyc-guard';
// import { PropertyImageUploadComponent } from './components/property-image-upload.component/property-image-upload.component';



export const routes: Routes = [
  // Define your routes here
  { path: '', component: HomePageComponent },
  { path: 'property/create', component: CreateProperty, canActivate: [kycGuard] },
  { path: 'property/:id', component: PropertyDetailsComponent },
  // { path: 'list', component: PropertyImageUploadComponent},
  { path: 'profile', component: ProfileComponent },
  { path: 'kyc', component: Kyc},
  { path: '**', redirectTo: '' }
];