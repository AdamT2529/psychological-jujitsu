export const windammit = {
  name: "Win Dammit!",
  icon: "", // put your image here
  getNextCard: (hand, targets, opponentPlays) => {
    hand.sort((a, b) => a - b);
    let nextTarget = targets[targets.length - 1];
    if (nextTarget === 7 || nextTarget === 8 || nextTarget === 9 || nextTarget === 10){
      const HIGHCARD = [11, 12, 13];
      for (let card of HIGHCARD) {
        if (hand.includes(card)){
          return card;
        }
      }
      return Math.max(...hand)
    } 
    return Math.min(...hand)
  },

  };