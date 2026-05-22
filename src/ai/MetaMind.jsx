export const MetaMind = {
  name: "MetaMind",
  icon: "🧠",
  getNextCard: (hand, targets, opponentPlays) => {
    // 1. If only one card left, play it
    if (hand.length === 1) return hand[0];

    // 2. If it's the first round, play near the target, but not always the same
    if (targets.length === 1) {
      const target = targets[0];
      const candidates = hand.filter((card) => Math.abs(card - target) <= 2);
      if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
      }
      // Otherwise, play the median card
      const sorted = [...hand].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    }

    // 3. Pattern Recognition: Analyze opponent behavior
    let lastTarget = targets[targets.length - 2];
    let lastOpponentCards = opponentPlays.map(
      (plays) => plays[plays.length - 1],
    );
    let lastRoundStrategy = Math.max(...lastOpponentCards) - lastTarget;
    let nextTarget = targets[targets.length - 1];

    // 4. Predict and try to beat their next move by one
    let idealPlay = Math.max(
      Math.min(nextTarget + lastRoundStrategy + 1, 13),
      1,
    );
    if (hand.includes(idealPlay)) {
      return idealPlay;
    }

    // 5. Card Counting: Save high cards if most are gone, or bluff sometimes
    const allPlayed = [...targets, ...opponentPlays.flat()];
    const fullDeck = Array.from({ length: 14 }, (_, i) => i + 1);
    const unseen = fullDeck.filter(
      (card) => !allPlayed.includes(card) && !hand.includes(card),
    );
    const likelyHigh = unseen.filter((card) => card > 10);
    if (hand.some((card) => card > 10) && likelyHigh.length === 0) {
      return Math.max(...hand.filter((card) => card > 10));
    }
    if (Math.random() < 0.1 && hand.length > 2) {
      return hand[Math.floor(Math.random() * hand.length)];
    }
    // 6. Otherwise, play the lowest card to conserve better cards
    return Math.min(...hand);
  },
};
