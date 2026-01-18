import {
    Component,
    ElementRef,
    HostListener,
    input,
    output,
    signal,
    ViewChild,
    viewChild,
} from '@angular/core';
import { Spell } from '@elementsrp/shared';
import * as party from 'party-js';

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
    buying = signal(false);

    @ViewChild('buyBtn', { static: true })
    buyBtn!: ElementRef<HTMLButtonElement>;

    @HostListener('document:keydown.escape')
    onEscape() {
        this.close.emit();
    }

    onBuy() {
        if (!this.canBuy()(this.spell().id)) return;
        this.buying.set(true);
        const btn = this.buyBtn.nativeElement;
        party.sparkles(btn, {
            count: party.variation.range(20, 30),
            speed: 300,
        });

        party.confetti(btn, {
            count: party.variation.range(40, 60),
        });

        setTimeout(() => {
            this.buying.set(false);
            this.buy.emit(this.spell().id);
        }, 1700);
    }
}
