/*export const carpediem = {
  name: "Carpe Diem.",
  icon: "", 
  getNextCard: (hand, targets, opponentPlays) => {
    let nextTarget = targets[targets.length - 1];
  }
  
  //we need a general strategy where we can apply certain loopholes like below
  //dont play king ever so we can get garunteed points (need a system that decides the highest value with least risk of other people playing the king, or use the king on the highest value card if other people already used their king)
  // will have the ability to see other players hands so use that to advantage 
  // aswell as dealers hand so you might know what is next
} */
export const sandbagging = {
  name: "Sandbagging",
  icon: "🏖️",
  getNextCard: (hand, targets, opponentPlays) => {
    const nextTarget = targets[targets.length - 1]; 
    const sortedHand = [...hand].sort((a, b) => a - b);
    const allCards = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    if (!nextTarget || hand.length === 0) return sortedHand[0];

    const opponentRemainingHands = opponentPlays.map(cardsPlayed =>
      allCards.filter(card => !cardsPlayed.includes(card))
    );

    const estimatedOpponentBid = Math.round(nextTarget * 0.8);

    if (nextTarget <= 7) {
      return sortedHand[0];
    }

    if (nextTarget >= 8) {
      const winningCard = sortedHand.find(card => card > estimatedOpponentBid);
      if (winningCard) return winningCard;
      return sortedHand[sortedHand.length - 1];
    }
  }
};