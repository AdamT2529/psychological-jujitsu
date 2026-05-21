export const tronAi = {
  name: "tron",
  icon: "-",
  getNextCard: (hand, targets, opponentPlays) => {
    let nextTarget = targets[targets.length - 1];
    let sortedHand = [...hand].sort((a, b) => a - b);

    // Drake's predictable plays for targets 1-10
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

    // Detect Drake or anti-Drake after just 1 move
    let isDrake = false;
    let isAntiDrake = false;
    for (let eachOpponentPlays of opponentPlays) {
      if (eachOpponentPlays.length >= 1 && targets.length >= 1) {
        let t = targets[0];
        let play = eachOpponentPlays[0];
        if (drakeMap[t] === play) {
          isDrake = true;
        } else if (play === drakeMap[t] + 1 || play === drakeMap[t] + 2) {
          isAntiDrake = true;
        }
      }
    }
    //console.log("isDrake:", isDrake, "isAntiDrake:", isAntiDrake);

    // If both detected (very rare, but possible if ambiguous), prioritize anti-Drake
    if (isDrake && isAntiDrake) {
      if (nextTarget >= 1 && nextTarget <= 10) {
        let antiDrakePlay = drakeMap[nextTarget] + 2;
        let counter = sortedHand.find((card) => card > antiDrakePlay);
        if (counter !== undefined) return counter;
        return sortedHand[0];
      }
      if (nextTarget > 10) {
        let royals = sortedHand.filter((card) => card > 10);
        if (royals.length > 0) return royals[0];
        return sortedHand[0];
      }
    }

    // If only Drake detected, beat Drake
    if (isDrake) {
      if (nextTarget >= 1 && nextTarget <= 10) {
        let drakePlay = drakeMap[nextTarget];
        let counter = sortedHand.find((card) => card > drakePlay);
        if (counter !== undefined) return counter;
        return sortedHand[0];
      }
      if (nextTarget > 10) {
        let royals = sortedHand.filter((card) => card > 10);
        if (royals.length > 0) return royals[0];
        return sortedHand[0];
      }
    }

    // If only anti-Drake detected, beat anti-Drake
    if (isAntiDrake) {
      if (nextTarget >= 1 && nextTarget <= 10) {
        let antiDrakePlay = drakeMap[nextTarget] + 2;
        let counter = sortedHand.find((card) => card > antiDrakePlay);
        if (counter !== undefined) return counter;
        return sortedHand[0];
      }
      if (nextTarget > 10) {
        let royals = sortedHand.filter((card) => card > 10);
        if (royals.length > 0) return royals[0];
        return sortedHand[0];
      }
    }

    // --- Original adaptive strategy below ---

    let opponentAvg =
      opponentPlays.length > 0
        ? opponentPlays.reduce((a, b) => a + b, 0) / opponentPlays.length
        : null;

    if (opponentAvg !== null && opponentAvg > Math.max(...hand) / 2) {
      if (nextTarget >= 8) {
        return sortedHand[sortedHand.length - 1];
      }
      return sortedHand[0];
    }

    if (opponentAvg !== null && opponentAvg <= Math.max(...hand) / 2) {
      if (nextTarget >= 6) {
        let desired = nextTarget + 2;
        if (hand.includes(desired)) {
          return desired;
        }
        let nextBest = sortedHand.find((card) => card > nextTarget);
        if (nextBest !== undefined) {
          return nextBest;
        }
      }
      return sortedHand[0];
    }

    // Default: balanced strategy
    let desired = nextTarget + 2;
    if (hand.includes(desired)) {
      return desired;
    }
    let nextBest = sortedHand.find((card) => card > nextTarget);
    if (nextBest !== undefined) {
      return nextBest;
    }
    return sortedHand[0];
  },
};
