export const Lopes = {
  name: "Lopes",
  icon: "lopes-icon.jpg",
  getNextCard: (hand, targets, opponentPlays) => {
    let nextTarget = targets[targets.length - 1];
    if (hand.includes(nextTarget)) {
      return nextTarget;
    }

    // When the target is high, play the highest card; otherwise preserve high cards.
    if (nextTarget >= 10) {
      return Math.max(...hand);
    }
    return Math.min(...hand);
  },
};