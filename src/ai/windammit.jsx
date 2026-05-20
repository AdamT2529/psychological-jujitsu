const isSandbagPlay = (target, play) => {
  return target >= 9 && target <= 10 && play <= target - 3;
};

const detectSandbagging = (targets, opponentPlays) => {
  const candidateRounds = [];

  for (let round = 0; round < targets.length; round++) {
    const target = targets[round];
    if (target === 9 || target === 10) {
      const roundPlays = opponentPlays
        .map((plays) => plays[round])
        .filter((play) => typeof play === "number");
      if (roundPlays.length > 0) {
        candidateRounds.push({ target, plays: roundPlays });
      }
    }
  }

  if (candidateRounds.length < 3) {
    return false;
  }

  let sandbagRoundCount = 0;
  let totalRounds = candidateRounds.length;

  for (let { target, plays } of candidateRounds) {
    const roundSandbags = plays.filter((play) => isSandbagPlay(target, play)).length;
    if (roundSandbags === plays.length) {
      sandbagRoundCount += 1;
    }
  }

  return sandbagRoundCount / totalRounds >= 0.66;
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
    const candidate = sortedHand.find((card) => card > nextTarget);
    return candidate !== undefined ? candidate : lowest;
  }

  if (nextTarget === 9 || nextTarget === 10) {
    const candidate = sortedHand.find((card) => card > nextTarget);
    return candidate !== undefined ? candidate : lowest;
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
