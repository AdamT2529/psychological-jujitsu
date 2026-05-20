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
      //} else if (nextTarget === ) {
      }
    }
  }
}
