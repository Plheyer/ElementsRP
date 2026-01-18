import { Player, Spell } from 'app-shared/models';
import { SPELLS } from '..';

export function canBuySpell(player: Player, spell: Spell): boolean {
    for (const depId of spell?.dependencies || []) {
        if (!player?.spells[depId]) return false;
    }
    return true;
}

export function checkStarSpellRequirements(
    player: Player,
    spell: Spell
): boolean {
    if (!spell.isStar) return true;
    const familyStars = SPELLS.filter(
        (s) => s.family === spell.family && !!s.isStar
    );

    for (const starSpell of familyStars) {
        if (player.spells[starSpell.id]) {
            return false;
        }
    }
    return true;
}
