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

    zoom = 1;
    readonly MIN_ZOOM = 0.4;
    readonly MAX_ZOOM = 2.5;
    readonly ZOOM_STEP = 0.1;
    private pinchStartDist = 0;
    private pinchStartZoom = 1;
    private scrollRaf = 0;

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

        const tree = this.treeEl.nativeElement;

        const ro = new ResizeObserver(() => this.buildLinks());
        ro.observe(tree);

        tree.addEventListener(
            'scroll',
            () => {
                if (this.scrollRaf) return;

                this.scrollRaf = requestAnimationFrame(() => {
                    this.buildLinks();
                    this.scrollRaf = 0;
                });
            },
            { passive: true }
        );
    }

    buildLinks() {
        const tree = this.treeEl.nativeElement;

        const pos = new Map<string, { x: number; y: number }>();

        this.nodeEls.forEach((el) => {
            const id = el.nativeElement.dataset['id']!;
            const node = el.nativeElement;

            pos.set(id, {
                x: node.offsetLeft + node.offsetWidth / 2,
                y: node.offsetTop + node.offsetHeight / 2,
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

    @HostListener('window:resize')
    onResize() {
        clearTimeout(this.resizeTimer);
    }

    @HostListener('wheel', ['$event'])
    onWheel(e: WheelEvent) {
        if (!e.ctrlKey) return; // ctrl + wheel = zoom
        e.preventDefault();

        const delta = e.deltaY < 0 ? this.ZOOM_STEP : -this.ZOOM_STEP;
        this.zoom = Math.min(
            this.MAX_ZOOM,
            Math.max(this.MIN_ZOOM, this.zoom + delta)
        );
    }
    @HostListener('touchstart', ['$event'])
    onTouchStart(e: TouchEvent) {
        if (e.touches.length === 2) {
            e.preventDefault();

            this.pinchStartDist = this.getTouchDistance(e);
            this.pinchStartZoom = this.zoom;
        }
    }
    @HostListener('touchmove', ['$event'])
    onTouchMove(e: TouchEvent) {
        if (e.touches.length !== 2) return;

        e.preventDefault();

        const dist = this.getTouchDistance(e);
        const rawScale = dist / this.pinchStartDist;

        const DAMPING = 0.25;
        const smoothScale = 1 + (rawScale - 1) * DAMPING;

        this.zoom = Math.min(
            this.MAX_ZOOM,
            Math.max(this.MIN_ZOOM, this.pinchStartZoom * smoothScale)
        );
    }

    zoomIn() {
        this.zoom = Math.min(this.MAX_ZOOM, this.zoom + this.ZOOM_STEP);
    }

    zoomOut() {
        this.zoom = Math.max(this.MIN_ZOOM, this.zoom - this.ZOOM_STEP);
    }
    private getTouchDistance(e: TouchEvent): number {
        const [a, b] = [e.touches[0], e.touches[1]];
        const dx = a.clientX - b.clientX;
        const dy = a.clientY - b.clientY;
        return Math.hypot(dx, dy);
    }
}
