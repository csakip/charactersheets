import {
  BladesData,
  emptyBladesData,
  emptyStarWarsData,
  emptyWoduData,
  StarWarsData,
  WoduData,
} from "./constants";
import { saveCharsheet } from "./supabase";

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

export function isMobile() {
  return window.matchMedia("(max-width: 768px)");
}

export async function createCharacter(
  userId: string,
  selectedSystem: string,
  newPlayerName: string,
  rollChecked: boolean,
  attributes: any,
  roomId: string | null
) {
  let char: WoduData | BladesData | StarWarsData = null;

  switch (selectedSystem) {
    case "wodu": {
      char = emptyWoduData(newPlayerName.trim());

      // Roll attributes if the checkbox is checked
      if (rollChecked) {
        do {
          attributes.forEach((a) => {
            const roll = rollAttribute();
            (char as WoduData).attributes[a.label.toLowerCase()] = roll;
          });
        } while (Object.values((char as WoduData).attributes).reduce((sum, c) => sum + c, 0) < 5);
      }

      break;
    }
    case "blades": {
      char = emptyBladesData(newPlayerName.trim());
      break;
    }
    case "starwars": {
      char = emptyStarWarsData(newPlayerName.trim());
      break;
    }
  }
  const id = await saveCharsheet(
    {
      user_id: userId,
      system: selectedSystem,
      data: char,
    },
    roomId
  );
  return id;
}

export function findParentAttributeAndSkill(
  attributes: {
    name: string;
    value: number;
    skills?: {
      name: string;
      value: number;
      specs?: { name: string; value: number }[];
    }[];
  }[],
  specToFind: { name: string; value: number }
): {
  attribute: { name: string; value: number };
  skill: { name: string; value: number; specs?: { name: string; value: number }[] };
} | null {
  for (const attribute of attributes) {
    for (const skill of attribute.skills) {
      if (skill.specs) {
        for (const spec of skill.specs) {
          if (spec.name === specToFind.name && spec.value === specToFind.value) {
            return { attribute, skill };
          }
        }
      }
    }
  }

  return null; // Return null if spec not found
}
