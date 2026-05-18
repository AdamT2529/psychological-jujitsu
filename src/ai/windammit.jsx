export const windammit = {
  name: "Win Dammit!",
  icon: "", // put your image here
  getNextCard: (hand, targets, opponentPlays) => {
    hand.sort
    let nextTarget = targets[targets.length - 1];
    if (nextTarget >= 7 || nextTarget <= 10){
      const HIGHCARD = [11, 12, 13];
      for (let card of HIGHCARD)
        if (hand.includes(card)){
          return card
        }
    } 
  }

  }