export interface Player {
  id: string;
  name: string;
  color: string;
  experience: number;
  knowledgePoints: number;
  spells: Record<string, boolean>;
}
