import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-logo-page',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './logo-page.component.html',
    styleUrl: './logo-page.component.scss',
})
export class LogoPageComponent {
    constructor(private router: Router) {}

    join() {
        this.router.navigate(['/setup']);
    }

    create() {
        this.router.navigate(['/game-master']);
    }
}
