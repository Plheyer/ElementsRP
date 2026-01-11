import {
    Component,
    computed,
    effect,
    inject,
    input,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from 'app-shared/models';
import { WebsocketService } from '../../services/websocket.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { GraphComponent } from '../graph/graph.component';

@Component({
    selector: 'app-player-view',
    standalone: true,
    imports: [CommonModule, GraphComponent],
    templateUrl: './player-view.component.html',
    styleUrls: ['./player-view.component.scss'],
})
export class PlayerViewComponent {
    playerId = input.required<string>();
    private readonly wsService: WebsocketService = inject(WebsocketService);
    private readonly router: Router = inject(Router);
    private readonly notificationService: NotificationService =
        inject(NotificationService);
    readonly player = signal<Player | null>(null);

    xpProgress = computed(() => {
        const xp = this.player()?.experience ?? 0;
        const value = xp % 100;
        return Math.max(0, Math.min(100, value));
    });

    constructor() {
        this.wsService.connect();
        effect(
            () => {
                const msg = this.wsService.messages();
                if (!msg) return;

                switch (msg.type) {
                    case 'player':
                        this.player.set(msg.player);
                        break;
                    case 'players':
                        this.player.set(
                            msg.players.find(
                                (p) => p.name === this.playerId()
                            ) || null
                        );
                        break;
                    case 'error':
                        this.notificationService.show(msg.message, {
                            type: 'error',
                        });
                        break;
                    case 'reset':
                        this.router.navigate([`/`]);
                        break;
                }
            },
            { allowSignalWrites: true }
        );
        effect(() => {
            if (this.wsService.connected() && this.playerId()) {
                this.wsService.send({
                    type: 'get:player',
                    playerId: this.playerId(),
                });
            }
        });
    }
}
