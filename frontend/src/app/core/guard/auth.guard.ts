import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const TOKEN_KEY = 'access_token';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Check token directly from storage
  const token =
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

  if (token) {
    return true;
  }

  // Redirect to login with return url
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
};
