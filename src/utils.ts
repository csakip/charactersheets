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
  "Rejtélyfejtés",
  "Gyógyítás",
  "Parancsnoklás",
  "Mágiaismeret",
  "Lopakodás",
  "Túlélés",
];

export const abilities = [
  {
    name: "Áldás",
    description:
      "Szentelt vízzel felkenhetsz tárgyakat,\nhogy szentnek és mágikusnak számítsanak.\n+3 sebzés a gonosz ellen, rövid ideig.",
  },
  {
    name: "Gyógyítás",
    description:
      "Megpróbálhatod semlegesíteni a mérgeket,\nátkokat, vagy sebeket gyógyíthatsz érintéssel.",
  },
  {
    name: "Elűzés",
    description:
      "Megpróbálhatsz élőhalottakat visszatartani\nszent hatalmaddal és szent szimbólumoddal.",
  },
  {
    name: "Látomás",
    description: "Szentelt víz megivásával kapcsolatba\nléphetsz isteneddel, útmutatásért.",
  },
  { name: "Kemény", description: "+1 páncél" },
  {
    name: "Kézitusa",
    description: "+1 sebzés és a viselt páncél\neggyel könnyebb típusnak számít.",
  },
  { name: "Pusztítás", description: "+2 közelharci sebzés" },
  { name: "Szívós", description: "+6 HP" },
  { name: "Hátbaszúrás", description: "Rejtett helyről támadva +3 sebzés." },
  {
    name: "Szerencse",
    description: "Naponta egyszer egy elhibázott dobást\nrészleges sikerré változtathatsz.",
  },
  { name: "Reflexek", description: "Mindig először cselekedhetsz\nés reagálhatsz, ha megleptek." },
  {
    name: "Bűtykölés",
    description:
      "Gyorsan megpróbálhatsz zsebet metszeni,\nzárat nyitni vagy csapdát hatástalanítani.",
  },
  {
    name: "Trükkök",
    description: "Három egyszerű varázslat ismerete:\nGyertya, Árnyék, Beszédhangod kivetítése.",
  },
  {
    name: "Parancsolás",
    description: "Megpróbálhatsz bármilyen szellemnek,\ndémonnak stb. parancsolni.",
  },
  {
    name: "Rituálé",
    description:
      "Ősi könyvekből és tekercsekből okkult rituálékat\nvégezhetsz - két ismert rituáléval kezdesz.",
  },
  {
    name: "Idézés",
    description: "Két szellem megidézéséhez szükséges\nokkult tudással kezded a játékot.",
  },
  { name: "Házikedvenc", description: "Van egy hűséges és hatékony állati társad." },
  {
    name: "Felderítő",
    description: "Ha felderítesz, mindig észreveszed a\ncélpontot, mielőtt az észrevenne téged.",
  },
  { name: "Sorozás", description: "+2 távolsági sebzés." },
  { name: "Vad", description: "Állatokkal beszélgethetsz és\nmegpróbálhatsz parancsolni nekik." },
];

export type Room = {
  id?: number;
  created_at?: string;
  user_id: string;
  name: string;
  description?: string;
  system: string;
  private: boolean;
};

export type Charsheet = {
  id?: number;
  user_id: string;
  system: string;
  data: WoduData | BladesData;
  created_at?: string;
  updated_at?: string;
  rooms_charsheets?: { room_id: number }[];
  room_id?: number;
};

export type WoduData = {
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

export const emptyWoduData = (newPlayerName): WoduData => ({
  playerName: newPlayerName,
  name: "",
  class: "Egyedi",
  level: 1,
  attributes: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  skills: [],
  abilities: [],
  weapons: "",
  gear: "",
  notesLeft: "",
  notesRight: "",
  armor: "Nincs",
  shield: false,
  sumArmor: 0,
  hpDice: 1,
  hp: 0,
  money: "60e",
  nextLevel: 1000,
  xp: 0,
});

export type BladesData = {
  id?: number;
  class?: string;
  playerName: string;
  name: string;
};

export const emptyBladesData = (newPlayerName): BladesData => ({
  playerName: newPlayerName,
  name: "",
});

export const systems = [
  { label: "World of Dungeons", value: "wodu", shortLabel: "WoDu" },
  { label: "Kések az Éjben", value: "blades", shortLabel: "KaÉ" },
];

export function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollAttribute() {
  const roll = rollD6() + rollD6();
  if (roll <= 6) return 0;
  if (roll <= 9) return 1;
  if (roll <= 11) return 2;
  return 3;
}

// Take each word, use the first letter and capitalize it, then join them with a dot
export function shortenName(name: string) {
  if (name.length < 8) return name;
  return (
    name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join(".") + "."
  );
}
