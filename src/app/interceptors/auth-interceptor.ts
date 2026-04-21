import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  if (req.url.includes('./auth')){
    return next(req)
  }
    

  const authService = inject(AuthService);
  const userId = authService.uniqueUserId;

  console.log("Interceptor: Request being intercepted for URL:", req.url);
  console.log("UserId:", userId);

  // Define headers object
  const headers: { [name: string]: string } = {
    'X-Users-Id': 'Inter' // Your test header
  };

  if (userId) {
    console.log("Interceptor: Found User ID, adding X-User-Id:", userId);
    headers['X-User-Id'] = userId;
  }

  // Clone ONCE with all headers
  const authReq = req.clone({
    setHeaders: headers,
    withCredentials: true
  });

  return next(authReq);
};