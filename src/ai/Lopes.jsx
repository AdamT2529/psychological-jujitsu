export const Lopes = {
  name: "Lopes",
  icon: "lopes-icon.jpg",
  getNextCard: (hand, targets, opponentPlays) => {
    let nextTarget = targets[targets.length - 1];
    if (hand.includes(nextTarget)) {
      return nextTarget;
    }
    // Lopes is a 
    // Placeholder AI: When the target is high, play the highest card; otherwise preserve high cards.
    switch (true) {
      case nextTarget >= 6:
        return Math.max(...hand);
        break;
        case nextTarget <= 3:
        return Math.min(...hand);
        break;
      default:
        return Math.random(...hand);
    }
  },
};