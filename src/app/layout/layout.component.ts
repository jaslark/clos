import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  // Signal to track state
  collapsed = signal(false);

  // Breadcrumbs state
  breadcrumbs = signal<string[]>(['Dashboard']);

  ngOnInit() {
    // Initial breadcrumb check
    this.updateBreadcrumbs(this.router.url);

    // Listen for route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateBreadcrumbs(event.url);
    });
  }

  toggleSidebar() {
    this.collapsed.update(val => !val);
  }

  logout() {
    this.authService.logout();
  }

  private updateBreadcrumbs(url: string) {
    const segments = url.split('/').filter(s => s);
    if (segments.length === 0) {
      this.breadcrumbs.set(['Dashboard']);
      return;
    }

    // Capitalize first letter of each segment
    const formatted = segments.map(s => s.charAt(0).toUpperCase() + s.slice(1));
    this.breadcrumbs.set(formatted);
  }
}