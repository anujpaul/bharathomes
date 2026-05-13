import { Routes } from '@angular/router';
import { PropertyDetailsComponent } from './pages/property-details/property-details'
import { HomePageComponent } from './pages/home/home';
import { ProfileComponent } from './pages/profile/profile';
import { CreateProperty } from './components/create-property/create-property';
import { Kyc } from './components/kyc/kyc';
import { UpgradePage } from './pages/upgrade/upgrade';
import { kycGuard } from './guards/kyc-guard';
// import { PropertyImageUploadComponent } from './components/property-image-upload.component/property-image-upload.component';



export const routes: Routes = [
  // Define your routes here
  { path: '', component: HomePageComponent },
  // /buy and /rent reuse the home listing component but with intent locked
  // via the data property — the component reads it in ngOnInit and treats
  // it as a non-removable filter (the user can still refine by type/city/
  // budget on top of it).
  { path: 'buy',  component: HomePageComponent, data: { intent: 'sell' } },
  { path: 'rent', component: HomePageComponent, data: { intent: 'rent' } },
  { path: 'property/create', component: CreateProperty, canActivate: [kycGuard] },
  { path: 'property/:id', component: PropertyDetailsComponent },
  // { path: 'list', component: PropertyImageUploadComponent},
  { path: 'profile', component: ProfileComponent },
  { path: 'kyc', component: Kyc},
  { path: 'upgrade', component: UpgradePage },
  { path: '**', redirectTo: '' }
];