export interface Element {
    id: string;
    imageUrl: string;
    row: number;
    col: number;
}

export const ELEMENTS: Element[] = [
    { id: 'air', imageUrl: '/assets/elements/air.png', row: 1, col: 1 },
    {
        id: 'nature',
        imageUrl: '/assets/elements/nature.png',
        row: 1,
        col: 6,
    },
    {
        id: 'electricity',
        imageUrl: '/assets/elements/electricity.png',
        row: 1,
        col: 9,
    },
    { id: 'water', imageUrl: '/assets/elements/water.png', row: 1, col: 13 },
    { id: 'fire', imageUrl: '/assets/elements/fire.png', row: 1, col: 17 },
    { id: 'earth', imageUrl: '/assets/elements/earth.png', row: 1, col: 21 },
    {
        id: 'psychic',
        imageUrl: '/assets/elements/psychic.png',
        row: 1,
        col: 25,
    },
    {
        id: 'summoning',
        imageUrl: '/assets/elements/summoning.png',
        row: 1,
        col: 28,
    },
];
