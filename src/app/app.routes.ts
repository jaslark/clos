import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { LayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { UploadComponent } from './features/upload/upload.component';
import { authGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [loginGuard]
    },
    {
        path: '',
        component: LayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'upload', component: UploadComponent },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },
    { path: '**', redirectTo: 'dashboard' }
];
