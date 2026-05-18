export const windammit = {
  name: "Rando Ralph", // a cute name
  icon: "-", // an image link
  getNextCard: (hand, targets, opponentPlays) => {
    // Play a random card!
    let index = Math.floor(Math.random() * hand.length);
    return hand[index];
  },
};