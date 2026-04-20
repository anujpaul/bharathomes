import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const userId = authService.uniqueUserId; // The method we defined earlier


  if (userId) {
    console.log(`Interceptor called ${userId}`);
    // Clone the request and add the custom header to every request
    const authReq = req.clone({
      setHeaders: { 'X-User-Id': userId }
      
    });
    return next(authReq);
  }

  // If no user is logged in, pass the request as-is
  return next(req);
};