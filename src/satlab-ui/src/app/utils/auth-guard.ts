import {inject} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {Router} from '@angular/router';

export function checkLoggedIn(): boolean {
    const auth = inject(AuthService)
    const router = inject(Router)
    if (!auth.isLoggedIn()) {
        router.navigateByUrl('/configuration');
        return false
    }
    return true
}
