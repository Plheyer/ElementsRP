import { Injectable, signal } from '@angular/core';

export type NotificationType = 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    title: string;
    description?: string;
    type: NotificationType;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    readonly notifications = signal<Notification[]>([]);

    show(
        title: string,
        options: { type?: NotificationType; description?: string } = {}
    ) {
        const id = crypto.randomUUID();
        const notif: Notification = {
            id,
            title,
            description: options.description,
            type: options.type ?? 'info',
        };
        this.notifications.update((arr) => [...arr, notif]);

        setTimeout(() => {
            this.dismiss(id);
        }, 3000);
    }

    dismiss(id: string) {
        this.notifications.update((arr) => arr.filter((n) => n.id !== id));
    }
}
