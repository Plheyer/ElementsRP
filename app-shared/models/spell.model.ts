export type SpellFamily =
    | 'air'
    | 'nature'
    | 'electricity'
    | 'water'
    | 'fire'
    | 'earth'
    | 'psychic'
    | 'summoning'
    | 'common';

export interface Spell {
    id: string;
    name: string;
    description: string;
    family: SpellFamily;
    imageUrl: string;
    row: number;
    col: number;
    dependencies: string[]; // IDs des sorts dépendants
    isStar?: boolean; // Pour les sorts étoilés (6A/B/C/D, 7A/B/C/D, etc.)
}
