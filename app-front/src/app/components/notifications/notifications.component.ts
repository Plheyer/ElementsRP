import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="notifications-container">
            <div
                *ngFor="let n of notifications()"
                class="notification"
                [ngClass]="n.type"
                (click)="dismiss(n.id)"
            >
                <strong>{{ n.title }}</strong>
                <p *ngIf="n.description">{{ n.description }}</p>
            </div>
        </div>
    `,
    styleUrl: './notifications.component.scss',
})
export class NotificationsComponent {
    readonly notifications;

    constructor(private notificationService: NotificationService) {
        this.notifications = this.notificationService.notifications;
    }

    dismiss(id: string) {
        this.notificationService.dismiss(id);
    }
}
