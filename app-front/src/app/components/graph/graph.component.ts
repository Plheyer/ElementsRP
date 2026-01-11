import {
    AfterViewInit,
    Component,
    ElementRef,
    HostListener,
    QueryList,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import { Spell, SPELLS, ELEMENTS } from '@elementsrp/shared';
import { SpellModalComponent } from '../spell-modal/spell-modal.component';

@Component({
    selector: 'app-graph',
    standalone: true,
    templateUrl: './graph.component.html',
    styleUrls: ['./graph.component.scss'],
    imports: [SpellModalComponent],
})
export class GraphComponent implements AfterViewInit {
    cols = 32;
    rows = 10;

    spells = SPELLS;

    links: { x1: number; y1: number; x2: number; y2: number }[] = [];
    private resizeTimer?: number;
    selectedSpell: Spell | null = null;
    elements = ELEMENTS;

    get gridWidth() {
        return this.cols * 56 + (this.cols - 1) * 16;
    }

    get gridHeight() {
        return this.rows * 56 + (this.rows - 1) * 16;
    }

    @ViewChildren('nodeEl') nodeEls!: QueryList<ElementRef<HTMLButtonElement>>;
    @ViewChild('tree') treeEl!: ElementRef<HTMLDivElement>;

    ngAfterViewInit() {
        requestAnimationFrame(() => this.buildLinks());

        const ro = new ResizeObserver(() => this.buildLinks());
        ro.observe(this.treeEl.nativeElement);
    }

    @HostListener('window:resize')
    onResize() {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = window.setTimeout(() => this.buildLinks(), 50);
    }
    buildLinks() {
        const treeRect = this.treeEl.nativeElement.getBoundingClientRect();
        const pos = new Map<string, { x: number; y: number }>();

        this.nodeEls.forEach((el) => {
            const id = el.nativeElement.dataset['id']!;
            const r = el.nativeElement.getBoundingClientRect();

            pos.set(id, {
                x: r.left - treeRect.left + r.width / 2,
                y: r.top - treeRect.top + r.height / 2,
            });
        });

        const result: typeof this.links = [];

        for (const n of this.spells) {
            const to = pos.get(n.id);
            if (!to) continue;

            for (const d of n.dependencies) {
                const from = pos.get(d);
                if (!from) continue;

                result.push({
                    x1: from.x,
                    y1: from.y,
                    x2: to.x,
                    y2: to.y,
                });
            }
        }

        this.links = result;
    }

    click(n: Spell) {
        this.selectedSpell = n;
    }

    closeModal() {
        this.selectedSpell = null;
    }
}
