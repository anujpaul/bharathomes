import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { appConfig } from '../config/app-config';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip Azure auth endpoints
  if (req.url.includes('/.auth/')) {
    return next(req);
  }

  // Skip requests not going to your backend
  if (!req.url.startsWith(appConfig.baseUrl)) {
    return next(req);
  }

  const authService = inject(AuthService);

  return from(authService.getValidToken()).pipe(
    switchMap(token => {
      if (!token) return next(req);

      return next(req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      }));
    })
  );
};