import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private http = inject(HttpClient);

  lookupPincode(pin: string): Observable<{ city: string; state: string; pincode: string } | null> {
    if (pin.length !== 6) return of(null);
    return this.http.get<any[]>(`https://api.postalpincode.in/pincode/${pin}`).pipe(
      map(res => {
        const po = res?.[0]?.PostOffice?.[0];
        if (!po) return null;
        return {
          city: po.Division || po.District,
          state: po.State,
          pincode: pin,
        };
      }),
      catchError(() => of(null))
    );
  }
  
}
