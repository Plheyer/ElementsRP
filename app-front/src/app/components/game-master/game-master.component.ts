import { Component, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebsocketService } from '../../services/websocket.service';
import { Player, ClientMessage } from '@elementsrp/shared';
import { NotificationService } from '../../services/notification.service';
import { PlayerCardComponent } from '../player-card/player-card.component';

@Component({
    selector: 'app-game-master',
    standalone: true,
    imports: [CommonModule, FormsModule, PlayerCardComponent],
    templateUrl: './game-master.component.html',
    styleUrl: './game-master.component.scss',
})
export class GameMasterComponent {
    readonly connected = signal<boolean>(false);
    readonly players = signal<Player[]>([]);
    gamePassword = '';
    passwordInput = '';

    constructor(
        private wsService: WebsocketService,
        private notificationService: NotificationService
    ) {
        this.wsService.connect();

        effect(
            () => {
                const msg = this.wsService.messages();
                if (!msg) return;

                switch (msg.type) {
                    case 'players':
                        this.gamePassword = this.passwordInput;
                        this.connected.set(true);
                        this.savePassword();
                        this.players.set(msg.players);
                        break;
                    case 'error':
                        this.notificationService.show(msg.message, {
                            type: 'error',
                        });
                        break;
                    case 'reset':
                        this.players.set([]);
                        this.resetPassword();
                        this.connected.set(false);
                        this.notificationService.show(
                            'La partie a été réinitialisée.',
                            { type: 'info' }
                        );
                        break;
                }
            },
            { allowSignalWrites: true }
        );

        effect(() => {
            if (this.wsService.connected()) {
                this.retrievePassword();
            }
        });
    }

    createGame() {
        if (!this.passwordInput) return;
        const message: ClientMessage = {
            type: 'join:create:game',
            password: this.passwordInput,
        };
        this.wsService.send(message);
    }

    addExperience(playerId: string, amount: number) {
        const message: ClientMessage = {
            type: 'add:experience',
            playerId,
            password: this.gamePassword,
            amount,
        };
        this.wsService.send(message);
    }

    addKnowledgePoints(playerId: string, amount: number) {
        const message: ClientMessage = {
            type: 'add:knowledgePoints',
            playerId,
            password: this.gamePassword,
            amount,
        };
        this.wsService.send(message);
    }

    resetAll() {
        const message: ClientMessage = {
            type: 'reset:game',
            password: this.gamePassword,
        };
        this.wsService.send(message);
    }

    savePassword() {
        localStorage.setItem('gm-password', this.gamePassword);
    }

    retrievePassword() {
        const saved = localStorage.getItem('gm-password');
        if (saved) {
            this.gamePassword = saved;
            this.passwordInput = saved;

            const message: ClientMessage = {
                type: 'join:create:game',
                password: this.passwordInput,
            };
            this.wsService.send(message);
        }
    }

    resetPassword() {
        localStorage.removeItem('gm-password');
        this.gamePassword = '';
        this.passwordInput = '';
    }
}
