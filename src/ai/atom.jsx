export const atomAi = {
  name: "atom", 
  // icon: "https://www.sciencefacts.net/atom-2.html", // an image link
  getNextCard: (hand, targets, opponentPlays) => {
    let nextTarget = targets[targets.length - 1];
    if (nextTarget === 13) {
      return 13;
    } else if (nextTarget === 5) {
        return 4;
      } else if (nextTarget === 1) {
        return hand.includes(1) ? 1 : 2;
      } else if (nextTarget === 4) {
        return 3;
      } else if (nextTarget === 2) {
        return hand.includes(1) ? 1 : 2;
      } else if (nextTarget === 3) {
      return 2;
    } else if (nextTarget === 12) {
      return 12;
    } else if (nextTarget === 6) {
      return hand.includes(5) ? 5 : 6;
    } else if (nextTarget === 7) {
      return 8;
    } else if (nextTarget === 8) {
      return 7;
    } else if (nextTarget === 9) {
      return 10;
    } else if (nextTarget === 10) {
      return 9;
  } else if (nextTarget === 11) {
    return hand.includes(10) ? 10 : 12;
  }
  return 1;
}
}
  // We have 13 5 1 4 12, 6 7 8 9 
