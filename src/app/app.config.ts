import { APP_INITIALIZER, ApplicationConfig, provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { routes } from "./app.routes";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { authInterceptor } from "./interceptors/auth-interceptor";
import { AuthService } from "./services/auth.service";

export function initializeApp(authService: AuthService) {
  // Returns a promise that Angular waits for before bootstrapping
  return () => authService.checkSession();
}

export const appConfig :ApplicationConfig = {
    providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        // provideHttpClient()
        provideHttpClient(withInterceptors([authInterceptor])),
        // provideHttpClient(),
        {
            provide: APP_INITIALIZER,
            useFactory: initializeApp,
            deps: [AuthService],
            multi: true
        }
    ]
}

//  {
//   providers: [
//     provideZonelessChangeDetection(),
//     // provideHttpClient(),
//     provideRouter(routes)
//   ]
// })