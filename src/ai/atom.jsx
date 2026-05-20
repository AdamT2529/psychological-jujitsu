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
        return hand.includes(3) ? 3 : hand[0];
      } else if (nextTarget === 2) {
        return hand.includes(2) ? 2 : 1;
      } else if (nextTarget === 3) {
      return 2;
    } else if (nextTarget === 12) {
      return 12;
    } else if (nextTarget === 6) {
      return hand.includes(5) ? 5 : 6;
    } else if (nextTarget === 7) {
      return hand.includes(8) ? 8 : 7;
    } else if (nextTarget === 8) {
      return hand.includes(7) ? 7 : 8;
    } else if (nextTarget === 9) {
      return hand.includes(10) ? 10 : 9;
    } else if (nextTarget === 10) {
      return hand.includes(9) ? 9 : 10;
    } else if (nextTarget === 11) {
      return hand.includes(10) ? 10 : 12;
    }
  return hand[0];
}
}
  // We have 13 5 1 4 12, 6 7 8 9 
