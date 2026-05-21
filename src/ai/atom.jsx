export const atomAi = {
  name: "atom", 
  // icon: "https://www.sciencefacts.net/atom-2.html", // an image link
  getNextCard: (hand, targets, opponentPlays) => {
    let nextTarget = targets[targets.length - 1];
    const pick = (a, b) =>
      hand.includes(a) ? a :
      hand.includes(b) ? b : 
      hand[0];
    
      if (nextTarget === 13) {
      return hand.includes(13) ? 13 : hand[0]
    } else if (nextTarget === 5) {
        return hand.includes(4) ? 4 : hand[0]
      } else if (nextTarget === 1) {
        return pick (1, 2);
      } else if (nextTarget === 4) {
        return hand.includes(3) ? 3 : hand[0];
      } else if (nextTarget === 2) {
        return pick(2, 1);
      } else if (nextTarget === 3) {
      return pick(3, 4);
    } else if (nextTarget === 12) {
      return hand.includes(12) ? 12 : hand[0]
    } else if (nextTarget === 6) {
      return pick(6, 5);
    } else if (nextTarget === 7) {
      return pick(7, 6);
    } else if (nextTarget === 8) {
      return pick(8, 7);
    } else if (nextTarget === 9) {
      return pick(9, 8);
    } else if (nextTarget === 10) {
      return pick(10, 9);
    } else if (nextTarget === 11) {
      return pick(11, 10);
    }
  return hand[0];
}
}
  // We have 13 5 1 4 12, 6 7 8 9 
