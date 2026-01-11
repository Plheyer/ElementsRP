import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { WebsocketService } from '../../services/websocket.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-player-setup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './player-setup.component.html',
    styleUrl: './player-setup.component.scss',
})
export class PlayerSetupComponent {
    readonly playerName = new FormControl('', {
        nonNullable: true,
        validators: [
            Validators.required,
            Validators.minLength(1),
            Validators.maxLength(20),
            Validators.pattern(/^[a-zA-Z0-9_-]+$/),
        ],
    });

    readonly playerColor = new FormControl('#ff4500', {
        nonNullable: true,
    });

    readonly nameError = computed(() => {
        const c = this.playerName;
        if (!c.touched) return null;

        if (c.hasError('required')) return 'Le nom est requis';
        if (c.hasError('minlength')) return 'Minimum 3 caractères';
        if (c.hasError('maxlength')) return 'Maximum 20 caractères';
        if (c.hasError('pattern'))
            return 'Caractères autorisés : a-z A-Z 0-9 _ -';

        return null;
    });

    readonly isValid = computed(
        () => this.playerName.valid && this.playerColor.valid
    );
    private joinAcknowledged = signal(false);

    constructor(
        private websocketService: WebsocketService,
        private router: Router,
        private notificationService: NotificationService
    ) {
        effect(
            () => {
                const msg = this.websocketService.messages();
                if (!msg) return;
                this.joinAcknowledged.set(true);
                console.log(msg);

                switch (msg.type) {
                    case 'players':
                        this.router.navigate([
                            `/player/${this.playerName.value}`,
                        ]);
                        break;
                    case 'error':
                        this.notificationService.show(msg.message, {
                            type: 'error',
                        });
                        break;
                }
            },
            { allowSignalWrites: true }
        );
        this.websocketService.connect();
    }

    createPlayer(): void {
        if (!this.isValid()) return;

        const player = {
            id: crypto.randomUUID(),
            name: this.playerName.value,
            color: this.playerColor.value,
            experience: 0,
            knowledgePoints: 0,
            spells: {},
        };

        this.websocketService.send({ type: 'join', player });
        setTimeout(() => {
            if (!this.joinAcknowledged()) {
                this.notificationService.show(
                    'Impossible de rejoindre le jeu, le serveur n’a pas répondu.',
                    { type: 'error' }
                );
            }
        }, 2000);
    }
}
