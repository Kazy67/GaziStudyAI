import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

const TOKEN_KEY = 'access_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Skip adding token for Auth endpoints (login, register, etc.) except logout
  // This prevents sending potentially invalid tokens to public endpoints
  const isAuthEndpoint =
    req.url.includes('/Auth/') || req.url.includes('/login');
  if (isAuthEndpoint && !req.url.includes('/logout')) {
    return next(req);
  }

  const token =
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Clear tokens
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);

        // Redirect to login
        router.navigate(['/login']);
      }

      if (error.status === 403) {
        // Forbidden access
        // const isAdminEndpoint = req.url.includes('/admin/');
        // if (!isAdminEndpoint) {
        //   router.navigate(['/unauthorized']);
        // }
        // For now, maybe just let the component handle it or redirect home/login
      }

      return throwError(() => error);
    }),
  );
};
