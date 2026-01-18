import { Component, HostListener, input, output } from '@angular/core';
import { Spell } from '@elementsrp/shared';

@Component({
    selector: 'app-spell-modal',
    standalone: true,
    templateUrl: './spell-modal.component.html',
    styleUrls: ['./spell-modal.component.scss'],
})
export class SpellModalComponent {
    spell = input.required<Spell>();
    canBuy = input.required<(spellId: string) => boolean>();
    close = output<void>();
    buy = output<string>();

    @HostListener('document:keydown.escape')
    onEscape() {
        this.close.emit();
    }
}
