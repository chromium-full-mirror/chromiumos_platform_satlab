import {inject} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {Router} from '@angular/router';

export async function checkLoggedIn(): Promise<boolean> {
  const auth = inject(AuthService)
  const router = inject(Router)
  if (!await auth.isLoggedIn()) {
    return await router.navigateByUrl('/configuration')
  }
  return true
}
