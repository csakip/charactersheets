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

export const BitDClasses = [
  { label: "Kaszaboló", description: "félelmetes és veszélyes harcos" },
  { label: "Kopó", description: "halálos mesterlövész és nyomkövető" },
  { label: "Pióca", description: "Szabotőr és technikus" },
  { label: "Pók", description: "körmönfont stratéga" },
  { label: "Sumák", description: "körmönfont manipulátor és kém" },
  { label: "Surranó", description: "lopakodó beszivárgó és betörő" },
  { label: "Suttogó", description: "varázshasználó és elementarista" },
  { label: "Egyedi", description: "" },
];

export type Room = {
  id?: number;
  created_at?: string;
  user_id: string;
  name: string;
  system: string;
  notes?: string;
  private: boolean;
};

export type Charsheet = {
  id?: number;
  user_id: string;
  system: string;
  data: WoduData | BladesData | StarWarsData;
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

export function emptyWoduData(newPlayerName: string): WoduData {
  return {
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
  };
}

export type BladesData = {
  id?: number;
  class: string;
  playerName: string;
  name: string;
  crew: string;
  alias: string;
  look: string;
  heritage: string;
  background: string;
  vice: string;
  stress: number;
  trauma: number;
  traumaWords: string[];
  harm1l: string;
  harm1r: string;
  harm2: string;
  harm3: string;
  specialAbilities: string;
  healing: number;
  armor: boolean;
  heavy: boolean;
  special: boolean;
  coin: number;
  stash: number;
  playbook: number;
  load: number;
  items: string;
  attributes: Array<{
    name: string;
    xp: number;
    values: Array<{ name: string; value: number }>;
  }>;
  friends: string;
  notes: string;
};

export function emptyBladesData(newPlayerName: string): BladesData {
  return {
    playerName: newPlayerName,
    name: "",
    specialAbilities: "",
    stress: 0,
    trauma: 0,
    traumaWords: [],
    harm1l: "",
    harm1r: "",
    harm2: "",
    harm3: "",
    healing: 0,
    armor: false,
    heavy: false,
    special: false,
    coin: 0,
    stash: 0,
    playbook: 0,
    load: 0,
    items: "",
    attributes: [
      {
        name: "Eszesség",
        xp: 0,
        values: [
          { name: "Cserkel", value: 0 },
          { name: "Tanulmányoz", value: 0 },
          { name: "Felmér", value: 0 },
          { name: "Bütyköl", value: 0 },
        ],
      },
      {
        name: "Bátorság",
        xp: 0,
        values: [
          { name: "Finesz", value: 0 },
          { name: "Oson", value: 0 },
          { name: "Küzd", value: 0 },
          { name: "Zúz", value: 0 },
        ],
      },
      {
        name: "Eltökéltség",
        xp: 0,
        values: [
          { name: "Hangol", value: 0 },
          { name: "Parancsol", value: 0 },
          { name: "Társul", value: 0 },
          { name: "Elbűvöl", value: 0 },
        ],
      },
    ],
    friends: "",
    notes: "",
    crew: "",
    class: "Egyedi",
    alias: "",
    look: "",
    heritage: "",
    background: "",
    vice: "",
  };
}

export type mothershipData = {
  id?: string;
  playerName: string;
  characterName: string;
  pronouns: string;
  personalNotes: string;
  highScore: number;
  resolve: number;

  strength: number;
  speed: number;
  intellect: number;
  combat: number;

  sanity: number;
  fear: number;
  body: number;

  class: "Melós" | "Android" | "Tudós" | "Katona" | string;

  health: number;
  currentHEalth: number;
  wounds: number;
  currentWounds: number;
  currentStress: number;
  miniumStress: number;

  trinket: string;
  patch: string;
  notes: string;

  armorPoints: number;
  credits: number;

  skills: string[];
  skillTraining: string;
  skillTimeRemaining: string;
  conditions: string;
};

export function emptyMothershipData(newPlayerName): mothershipData {
  return {
    playerName: newPlayerName,
    characterName: "",
    pronouns: "",
    personalNotes: "",
    highScore: 0,
    resolve: 0,

    strength: 0,
    speed: 0,
    intellect: 0,
    combat: 0,

    sanity: 0,
    fear: 0,
    body: 0,

    class: "",

    health: 0,
    currentHEalth: 0,
    wounds: 0,
    currentWounds: 0,
    currentStress: 0,
    miniumStress: 0,

    trinket: "",
    patch: "",
    notes: "",

    armorPoints: 0,
    credits: 0,

    skills: [],
    skillTraining: "",
    skillTimeRemaining: "",
    conditions: "",
  };
}

export type StarWarsData = {
  id?: string;
  playerName: string;
  name: string;
  type: string;
  attributes: {
    name: string;
    value: number;
    skills: { name: string; value: number; specs?: { name: string; value: number }[] }[];
  }[];
  species: string;
  gender: string;
  age: string;
  physicalDescription: string;
  personality: string;
  notes: string;
  weapons: {
    name: string;
    range: string;
    damage: string;
    notes: string;
  }[];
  armor: { name: string; bonus: string; notes: string }[];
  equipment: string;
  credits: number;
  specialAbilities: string;
  forceSensitive: boolean;
  forcePoints: number;
  control: number;
  sense: number;
  alter: number;
  darkSidePoints: number;
  move: number;
  characterPoints: number;
  totalCharacterPoints: number;
  stunned: boolean;
  wounded: boolean;
  wounded2: boolean;
  incapacitated: boolean;
  mortallyWounded: boolean;
};

export const starWarsAttributesAndSkills = [
  {
    name: "ÜGYESSÉG",
    skills: [
      "Archaikus löfegyver",
      "Sugárfegyver",
      "Sugártüzérség",
      "Lézervető",
      "Íj",
      "Pusztakezes védelem",
      "Kitérés",
      "Tűzfegyver",
      "Gránátdobás",
      "Fénykard",
      "Közelharc",
      "Közelharc védelem",
      "Nehézfegyver",
      "Zsebtolvajlás",
      "Futás",
      "Hajítófegyver",
      "Önjáró löveg",
    ],
  },
  {
    name: "TUDÁS",
    skills: [
      "Idegen fajok ismerete",
      "Bürokrácia",
      "Üzlet",
      "Kultúra",
      "Megfélemlítés",
      "Nyelvismeret",
      "Jogtudomány",
      "Bolygórendszerek ismerete",
      "Alvilág ismerete",
      "Túlélés",
      "Értékbecslés",
      "Akaraterő",
    ],
  },
  {
    name: "MECHANIKA",
    skills: [
      "Archaikus űrhajó",
      "Asztrogáció",
      "Lovaglás",
      "Csatahajó fegyverzet",
      "Csatahajó vezetés",
      "Csatahajó védőpajzsok",
      "Kommunikációs rendszerek",
      "Szárazföldi jármű",
      "Légpárnás jármű",
      "Energiapáncél",
      "Antigravitációs jármű",
      "Szenzorok",
      "Szállítóhajó",
      "Vadászhajó",
      "Fedélzeti fegyver",
      "Pajzsok",
      "Suhanó",
      "Lépegető",
    ],
  },
  {
    name: "ÉRZÉKELÉS",
    skills: [
      "Alkudozás",
      "Parancsnoklás",
      "Szélhámosság",
      "Hamisítás",
      "Szerencsejáték",
      "Rejtőzés",
      "Adatgyűjtés",
      "Meggyőzés",
      "Fürkészés",
      "Lopakodás",
    ],
  },
  {
    name: "ERŐ",
    skills: ["Pusztakezes harc", "Mászás/Ugrás", "Súlyemelés", "Kitartás", "Úszás"],
  },
  {
    name: "TECHNOLÓGIA",
    skills: [
      "Páncéljavítás",
      "Sugárfegyver javítás",
      "Csatahajó javítás",
      "Csatahajó fegyverzet javítása",
      "Számítógép programozás / javítás",
      "Robbantás",
      "Robotprogramozás",
      "Elsősegély",
      "Szárazföldi járművek javítása",
      "Légpárnás járművek javítása",
      "Orvostudomány",
      "Antigravitációs járművek javítása",
      "Biztonságtechnika",
      "Szállítóhajó javítás",
      "Vadászhajó javítás",
      "Fedélzeti fegyverek javítása",
      "Lépegetőjavítás",
    ],
  },
];

export function emptyStarWarsData(newPlayerName): StarWarsData {
  return {
    playerName: newPlayerName,
    name: "",
    type: "",
    attributes: starWarsAttributesAndSkills.map((a) => ({
      name: a.name,
      value: 6,
      skills: [],
    })),
    species: "",
    gender: "",
    age: "",
    physicalDescription: "",
    personality: "",
    notes: "",
    weapons: [],
    armor: [],
    equipment: "",
    credits: 0,
    specialAbilities: "",
    forceSensitive: false,
    forcePoints: 1,
    control: 0,
    sense: 0,
    alter: 0,
    darkSidePoints: 0,
    move: 10,
    characterPoints: 5,
    totalCharacterPoints: 5,
    stunned: false,
    wounded: false,
    wounded2: false,
    incapacitated: false,
    mortallyWounded: false,
  };
}

export const systems = [
  { label: "World of Dungeons", value: "wodu", shortLabel: "WoDu" },
  { label: "Kések az Éjben", value: "blades", shortLabel: "KaÉ" },
  { label: "Star Wars", value: "starwars", shortLabel: "SW" },
];
