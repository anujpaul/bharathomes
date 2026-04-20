import { ApplicationConfig, provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { routes } from "./app.routes";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { authInterceptor } from "./interceptors/auth-interceptor";

export const appConfig :ApplicationConfig = {
    providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes),
        // provideHttpClient()
        provideHttpClient(withInterceptors([authInterceptor]))
    ]
}

//  {
//   providers: [
//     provideZonelessChangeDetection(),
//     // provideHttpClient(),
//     provideRouter(routes)
//   ]
// })