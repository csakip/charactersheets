export const attributes = [
  { label: "ERŐ" },
  { label: "INT" },
  { label: "ÜGY" },
  { label: "BÖL" },
  { label: "EGS" },
  { label: "KAR" },
];

export const skills = [
  "Atlétika",
  "Éberség",
  "Megtévesztés",
  "Rejtőzködés",
  "Gyógyítás",
  "Parancsnoklás",
  "Mágiaismeret",
  "Lopakodás",
  "Túlélés",
];

export const abilities = [
  "Áldás",
  "Gyógyítás",
  "Elűzés",
  "Látomás",
  "Kemény",
  "Kézitusa",
  "Pusztítás",
  "Szívós",
  "Hátbaszúrás",
  "Szerencse",
  "Reflexek",
  "Bűtykölés",
  "Trükkök",
  "Parancsolás",
  "Rituálé",
  "Idézés",
  "Házikedvenc",
  "Felderítő",
  "Sorozás",
  "Vad",
];

export interface Participant {
  id?: number;
  created_at?: string;
  updated_at?: string;
  user_id: string;
  charsheet: CharacterSheet;
}

export type CharacterSheet = {
  id?: number;
  playerName: string;
  name: string;
  class: string;
  level: number;
  attributes: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  skills: string[];
  abilities: string[];
  weapons: string;
  gear: string;
  notesLeft: string;
  notesRight: string;
  armor: string;
  shield: boolean;
  sumArmor: number;
  hpDice: number;
  hp: number;
  money: string;
  nextLevel: number;
  xp: number;
};

export const emptyCharacter = (newPlayerName): CharacterSheet => ({
  playerName: newPlayerName,
  name: "",
  class: "",
  level: 1,
  attributes: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  skills: [],
  abilities: [],
  weapons: "",
  gear: "",
  notesLeft: "",
  notesRight: "",
  armor: "",
  shield: false,
  sumArmor: 0,
  hpDice: 1,
  hp: 0,
  money: "60e",
  nextLevel: 1000,
  xp: 0,
});
