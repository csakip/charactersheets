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
