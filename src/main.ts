import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

console.log('Bootstrapping BharatHomes UP...');
bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideHttpClient()
  ]
}).then(() => console.log('App bootstrapped successfully!'))
  .catch(err => console.error('Bootstrap error:', err));
