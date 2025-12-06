import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly TOKEN_KEY = 'auth_token';
    // Signal to track auth state for reactive UI updates
    isAuthenticated = signal<boolean>(this.checkLogin());

    constructor(private router: Router) { }

    login(username: string, password: string): Observable<boolean> {
        // Mock login logic
        if (username === 'admin' && password === '123') {
            return of(true).pipe(
                delay(800), // Simulate network delay
                tap(() => {
                    this.setToken('mock-jwt-token-xyz-123');
                    this.isAuthenticated.set(true);
                })
            );
        }
        return throwError(() => new Error('Invalid credentials')).pipe(delay(800));
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        this.isAuthenticated.set(false);
        this.router.navigate(['/login']);
    }

    isLoggedIn(): boolean {
        return this.isAuthenticated();
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    private setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    private checkLogin(): boolean {
        return !!localStorage.getItem(this.TOKEN_KEY);
    }
}
