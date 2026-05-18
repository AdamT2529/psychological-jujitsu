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
    
    // Infer what opponents have left
    const opponentRemainingHands = opponentPlays.map(cardsPlayed => 
      allCards.filter(card => !cardsPlayed.includes(card))
    );
    
    const maxOpponentCard = Math.max(
      ...opponentRemainingHands.map(h => h.length > 0 ? Math.max(...h) : 0)
    );

    // Concede low prizes (1-7): play minimum to waste opponent cards
    if (nextTarget <= 7) {
      return sortedHand[0];
    }

    // Contest high prizes (8-13): play to WIN or conserve
    if (nextTarget >= 8) {
      // Try to win with the smallest card that beats opponent max
      const winningCard = sortedHand.find(card => card > maxOpponentCard);
      if (winningCard) {
        return winningCard; // Play just enough to win
      }
      
      // Can't win - try to play one number higher to guarantee win
      const cardOneHigher = maxOpponentCard + 1;
      if (cardOneHigher <= 13 && hand.includes(cardOneHigher)) {
        return cardOneHigher;
      }

      // If can't play one higher, gamble with highest card
      // (they might not have it if they haven't used their King yet)
      return sortedHand[sortedHand.length - 1];
    }
  }
};