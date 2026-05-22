import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

interface ApiAuthErrorBody {
  status?: number;
  code?: string;
  error?: string;
}

function isInvalidTokenPayload(payload: ApiAuthErrorBody | null | undefined): boolean {
  if (!payload) {
    return false;
  }

  return payload.status === 401 && String(payload.code ?? '').toUpperCase() === 'INVALID_TOKEN';
}

function forceLogoutAndRedirect(router: Router): void {
  localStorage.clear();

  if (router.url !== '/login') {
    router.navigate(['/login']);
  }
}

export const authTokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);

  // Obtener el token del localStorage
  const token = localStorage.getItem('token');

  // Si existe el token, agregarlo al header Authorization
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const body = event.body as ApiAuthErrorBody | null | undefined;

        if (isInvalidTokenPayload(body)) {
          forceLogoutAndRedirect(router);
          throw new Error(body?.error ?? 'Token invalido o expirado');
        }
      }
    }),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const body = error.error as ApiAuthErrorBody | null | undefined;
        const code = String(body?.code ?? '').toUpperCase();

        if (error.status === 401 && code === 'INVALID_TOKEN') {
          forceLogoutAndRedirect(router);
        }
      }

      return throwError(() => error);
    })
  );
};
