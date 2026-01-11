import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Spell } from '@elementsrp/shared';

@Component({
    selector: 'app-spell-modal',
    standalone: true,
    templateUrl: './spell-modal.component.html',
    styleUrls: ['./spell-modal.component.scss'],
})
export class SpellModalComponent {
    @Input({ required: true }) spell!: Spell;
    @Output() close = new EventEmitter<void>();
}
