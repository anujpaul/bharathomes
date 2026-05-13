import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { filter, take, timeout } from 'rxjs/operators';

export const kycGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Capture the observable inside the synchronous injection context
  // before we go async — toObservable() needs the DI scope CanActivateFn
  // gives us right here.
  const profile$ = toObservable(authService.authResponse);

  return (async () => {
    // Auth state lives on `user` (set synchronously after sign-in/sign-up
    // by setUser()). `authResponse` is the profile that's fetched
    // asynchronously; checking it for auth was the bug — for a brand new
    // user the click happens before fetchUserProfile() has resolved.
    if (!authService.user()) {
      return router.parseUrl('/');
    }

    // Profile may already be loaded, or it may be in flight (sign-up
    // just completed). Use the current value if present, otherwise wait
    // up to 5s for it.
    let profile = authService.authResponse();
    if (!profile) {
      try {
        profile = await firstValueFrom(
          profile$.pipe(filter(p => p !== null), take(1), timeout(5000))
        );
      } catch {
        // Profile fetch never completed — fall through to KYC page
        // rather than silently bouncing home, so the user sees SOMETHING.
        return router.createUrlTree(['/kyc'], {
          queryParams: { returnUrl: '/property/create' }
        });
      }
    }

    if (!profile) return router.parseUrl('/');

    if (profile.kycStatus === 'verified') {
      return true;
    }

    return router.createUrlTree(['/kyc'], {
      queryParams: { returnUrl: '/property/create' }
    });
  })();
};
