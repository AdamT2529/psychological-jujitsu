const detectSandbagging = (targets, opponentPlays) => {
  const flattenedPlays = opponentPlays.flat();
  if (flattenedPlays.length < 3) {
    return false;
  }

  let sandbagRounds = 0;
  let relevantRounds = 0;

  for (let round = 0; round < targets.length; round++) {
    const target = targets[round];
    if (target >= 9) {
      relevantRounds += 1;
      const roundPlays = opponentPlays
        .map((plays) => plays[round])
        .filter((play) => typeof play === "number");
      for (let play of roundPlays) {
        if (play <= 5 || play <= target - 3) {
          sandbagRounds += 1;
        }
      }
    }
  }

  return relevantRounds > 0 && sandbagRounds / relevantRounds >= 0.5;
};

const originalWindammitStrategy = (hand, nextTarget) => {
  const sortedHand = [...hand].sort((a, b) => a - b);
  if (
    nextTarget === 7 ||
    nextTarget === 8 ||
    nextTarget === 9 ||
    nextTarget === 10
  ) {
    const HIGHCARD = [11, 12, 13];
    for (let card of HIGHCARD) {
      if (sortedHand.includes(card)) {
        return card;
      }
    }
    return Math.max(...sortedHand);
  }
  return Math.min(...sortedHand);
};

const antiSandbaggingStrategy = (hand, nextTarget) => {
  const sortedHand = [...hand].sort((a, b) => a - b);
  const lowest = sortedHand[0];

  if (nextTarget >= 11) {
    return lowest;
  }

  if (nextTarget >= 7 && nextTarget <= 10) {
    const candidate = sortedHand.find((card) => card > nextTarget);
    return candidate !== undefined ? candidate : Math.max(...sortedHand);
  }

  return lowest;
};

export const windammit = {
  name: "Win Dammit!",
  icon: "",
  getNextCard: (hand, targets, opponentPlays) => {
    const nextTarget = targets[targets.length - 1];
    if (detectSandbagging(targets, opponentPlays)) {
      return antiSandbaggingStrategy(hand, nextTarget);
    }
    return originalWindammitStrategy(hand, nextTarget);
  },
};
