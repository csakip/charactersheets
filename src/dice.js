export function format(value) {
  if (value === null || value === undefined || isNaN(value)) return "";
  if (!Number.isInteger(value)) {
    return "???";
  }
  const k = Math.floor(value / 3);
  const pip = value % 3;
  if (k * 3 + pip < 3) return "-";
  return `${k}K${pip ? "+" + pip : ""}`;
}

export function parseDice(diceString) {
  try {
    diceString = diceString.toLowerCase();
    if (diceString.indexOf("K") > -1) {
      const splitted = diceString.replaceAll("+", "").split("K");
      const parsed =
        parseInt(splitted[0]) * 3 +
        (splitted.length > 1 && splitted[1] ? parseInt(splitted[1]) : 0);
      return isNaN(parsed) ? 0 : parsed;
    } else {
      if (diceString.indexOf("+") > -1) {
        const parsed = parseInt(diceString.replaceAll("+", ""));
        return isNaN(parsed) ? 0 : parsed;
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

export function roll(value, label) {
  const k = Math.floor(value / 3);
  const pip = value % 3;
  const result = { rolls: [], sum: pip, pip: pip, extraRolls: 0 };
  if (k > 0) {
    for (let i = 0; i < k; i++) {
      const rolled = d6();
      result.rolls.push(rolled);
      result.sum += rolled;
    }

    // Roll of one on wild die
    if (result.rolls[0] === 1) {
      if (k === 1) {
        result.reduced = 0;
      } else {
        const max = Math.max(...result.rolls);
        result.reduced = result.sum - max - 1;
      }
    }

    //Roll of 6 on wild die
    let wildDie = result.rolls[0];
    while (wildDie === 6) {
      wildDie = d6();
      result.rolls.push(wildDie);
      result.sum += wildDie;
      result.extraRolls++;
    }

    if (result.reduced === undefined) {
      result.reduced = result.sum;
    }
  }

  console.log(
    label || "Dobás",
    result.sum,
    result.rolls[0] === 1 ? `levonással ${result.reduced}` : " "
  );

  return result;
}

function d6() {
  return Math.floor(Math.random() * 6) + 1;
}

export function d66s() {
  return d6().toString() + d6().toString();
}
