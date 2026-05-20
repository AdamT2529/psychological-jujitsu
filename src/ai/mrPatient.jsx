export const mrPatient = {
  name: "Mr. Patient",
  icon: "", // puedes poner un link de imagen aquí
  getNextCard: (hand, targets, opponentPlays) => {
    let turnNumber = targets.length;
    let activeDeck;
    if (turnNumber < 4) {
      activeDeck = hand.filter((c) => [1, 2, 4, 6, 8].includes(c));
    } else if (turnNumber < 9) {
      activeDeck = hand.filter((c) =>
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(c),
      );
    } else {
      activeDeck = hand;
    }
    let target = targets[targets.length - 1];
    let idealCards = [target + 2, target + 1, target];
    for (let c of idealCards) {
      if (activeDeck.includes(c)) {
        return c;
      }
    }
    // If no ideal card is found, return the lowest card in the active deck
    return Math.min(...activeDeck);
  },
};
