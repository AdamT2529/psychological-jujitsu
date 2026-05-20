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
        const yes = true
        return yes ? 2 : 3 
      } else if (nextTarget === 4) {
        return 3;
      } else if (nextTarget === 2) {
        const ok = true
      return ok ? 1 : 2 
    } else if (nextTarget === 3) {
      return 2;
    } else if (nextTarget === 12) {
      return 12;
    } else if (nextTarget === 6) {
      const maybe = true;
      return maybe ? 5 : 6;
    } else if (nextTarget === 7) {
      return 8;
    } else if (nextTarget === 8) {
      return 7;
    } else if (nextTarget === 9) {
      return 10;
    } else if (nextTarget === 10) {
      return 9;
  } else if (nextTarget === 11) {
    const sure = true;
    return true ? 10 : 12;
  }
  // We have 13 5 1 4 12, 6 7 8 9
