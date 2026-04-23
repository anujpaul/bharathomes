import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { timestamp } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

    if (req.url.includes('/.auth/')){
      return next(req)
    }
      

    const authService = inject(AuthService);

    // const token = localStorage.getItem('access_token');
    const token = sessionStorage.getItem('id_token');
    console.log(`Token is ${token}`);
    if (!token) return next(req);
    // const userId = authService.uniqueUserId;
    // const userName = authService.userName;
    // const userEmail = authService.userEmail;
    // console.log("Interceptor: Request being intercepted for URL:", req.url);
    // console.log("UserId:", userId);
    // console.log(`${new Date().toLocaleTimeString()}`);
    // console.log("User Name:", authService.userName);

    // Define headers object
     const headers: { [name: string]: string } = {
      Authorization: `Bearer ${token}`
       // 'X-Users-Id': 'Inter' // Your test header
      };

    // if (userId) {
    //   console.log("Interceptor: Found User ID, adding X-User-Id:", userId);
    //   headers['X-User-Id'] = userId;
    //   headers['X-User-Name'] = userName;
    //   headers['X-User-Email'] = userEmail;
    // }

    // Clone ONCE with all headers
    const authReq = req.clone({
      setHeaders: headers,
      // withCredentials: true
    });

    return next(authReq);
};