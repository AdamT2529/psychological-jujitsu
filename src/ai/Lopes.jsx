export const Lopes = {
  name: "Lopes",
  icon: "lopes-icon.jpg",
  getNextCard: (hand, targets, opponentPlays) => {
    const sortedHand = [...hand].sort((a, b) => a - b);
    const currentTarget = targets.length > 0 ? targets[targets.length - 1] : 0;
    const turn = targets.length; // 1-based round count

    const drakeMap = {
      1: 4,
      2: 5,
      3: 6,
      4: 7,
      5: 8,
      6: 9,
      7: 10,
      8: 3,
      9: 2,
      10: 1,
    };

    if (sortedHand.length === 1) {
      return sortedHand[0];
    }

    const playDrake = () => {
      if (currentTarget > 10) {
        const royals = sortedHand.filter((card) => card > 10);
        if (royals.length > 0) {
          return royals[Math.floor(Math.random() * royals.length)];
        }
      }
      return drakeMap[currentTarget] ?? sortedHand[0];
    };

    const playAntiAntiDrake = () => {
      if (currentTarget > 10) {
        return sortedHand[sortedHand.length - 1];
      }

      const antiDrakePlay = (drakeMap[currentTarget] ?? 0) + 2;
      const counter = sortedHand.find((card) => card > antiDrakePlay);
      return counter ?? sortedHand[0];
    };

    if (turn <= 3) {
      return playDrake();
    }

    return playAntiAntiDrake();
  },
};
