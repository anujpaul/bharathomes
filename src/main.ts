import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { register } from 'swiper/element/bundle';
import { appConfig } from './app/app.config';

register();
console.log('Bootstrapping BharatHomes ...');
bootstrapApplication(AppComponent, appConfig)
          .then(() => console.log('App bootstrapped successfully!'))
          .catch(err => console.error('Bootstrap error:', err));
