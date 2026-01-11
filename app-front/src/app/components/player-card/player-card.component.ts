import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from 'app-shared/models';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-player-card',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './player-card.component.html',
    styleUrl: './player-card.component.scss',
})
export class PlayerCardComponent {
    player = input.required<Player>();
    updateExperience = output<{ playerId: string; amount: number }>();
    updateKnowledgePoints = output<{ playerId: string; amount: number }>();

    experienceControl = new FormControl<number>(0, { nonNullable: true });

    xpProgress = computed(() => {
        const xp = this.player().experience ?? 0;
        const value = xp % 100;
        return Math.max(0, Math.min(100, value));
    });

    addXP() {
        this.updateExperience.emit({
            playerId: this.player().id,
            amount: this.experienceControl.value,
        });
        console.log(this.experienceControl.value);

        this.experienceControl.setValue(0);
    }

    increaseKP() {
        this.updateKnowledgePoints.emit({
            playerId: this.player().id,
            amount: 1,
        });
    }

    decreaseKP() {
        this.updateKnowledgePoints.emit({
            playerId: this.player().id,
            amount: -1,
        });
    }
}
