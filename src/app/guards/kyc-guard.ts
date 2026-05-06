import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const kycGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.authResponse();
  
  if(!user){
    return router.parseUrl('/');
  }

  if (user.kycStatus === 2) {
    console.log(`User is a KYC Verified `);
    return true;
  }

  return router.createUrlTree(['/kyc'] ,{
    queryParams: { returnUrl: '/property/create' }
  });
};
