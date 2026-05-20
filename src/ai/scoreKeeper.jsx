export const scoreKeeper = {
  name: "Score Keeper",
  icon: "",
  // This AI will focus on value
  gameInfo: {
    myLastPlay: 0,
    gameCount: 0,
    score: {
      me: 0,
      opp1: 0,
      opp2: 0,
    },
  },
  getNextCard(hand, targets, opponentPlays) {
    if (targets.length === 1) {
      // New game!
      this.gameInfo.gameCount++;
      this.gameInfo.score = { me: 0, opp1: 0, opp2: 0 }; // reset score!
      // First hand, we play the neutral strategy
      return this.playCard(hand, targets[0]);
    } else {
      this.updateScore(targets, opponentPlays);
    }
    // hand = my remaining cards (provided by game engine, already up to date)
    // Derive opponent remaining hands from what they've played so far
    const FULL_HAND = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const opp1Hand = FULL_HAND.filter((c) => !opponentPlays[0].includes(c));
    const opp2Hand = FULL_HAND.filter((c) => !opponentPlays[1].includes(c));

    const myHandValue = hand.reduce((acc, c) => acc + c, 0);
    const opp1HandValue = opp1Hand.reduce((acc, c) => acc + c, 0);
    const opp2HandValue = opp2Hand.reduce((acc, c) => acc + c, 0);

    // And let's compute the remaining value of targets...
    let totalValue = 13 + 12 + 11 + 10 + 9 + 8 + 7 + 6 + 5 + 4 + 3 + 2 + 1;
    let remainingValue =
      totalValue -
      this.gameInfo.score.me -
      this.gameInfo.score.opp1 -
      this.gameInfo.score.opp2;

    let meVs1Left = myHandValue - opp1HandValue;
    let meVs2Left = myHandValue - opp2HandValue;
    let meVs1 = this.gameInfo.score.me - this.gameInfo.score.opp1;
    let meVs2 = this.gameInfo.score.me - this.gameInfo.score.opp2;

    const target = targets[targets.length - 1];
    const iHaveStrongestHand = meVs1Left > 0 && meVs2Left > 0;
    const iHaveWeakestHand = meVs1Left < 0 && meVs2Left < 0;
    const iAmWinning = meVs1 > 0 && meVs2 > 0;
    const iAmLosing = meVs1 < 0 && meVs2 < 0;

    if (iAmWinning && remainingValue < Math.max(meVs1, meVs2)) {
      // Safely ahead — can't be caught, dump lowest card
      console.log("Scorekeeper: winning mode, coasting");
      return this.playCard(hand, Math.min(...hand));
    }

    if (iAmLosing && iHaveWeakestHand) {
      // Behind AND outgunned — only contest high-value targets, bail on everything else
      console.log("Scorekeeper: weakest hand, only playing for >9");
      if (target >= 9) {
        return this.playCard(hand, Math.max(...hand));
      }
      return this.playCard(hand, Math.min(...hand));
    }

    if (iHaveStrongestHand) {
      // I have the most firepower — play just above target to win efficiently
      console.log("Scorekeeper: strongest hand, playing just above target");
      const viable = hand.filter((c) => c > target);
      const card = viable.length > 0 ? Math.min(...viable) : Math.min(...hand);
      return this.playCard(hand, card);
    }
    console.log("Scorekeeper: default mode, just playing target");
    // Default: play closest card to target
    return this.playCard(hand, target);
  },

  playCard(hand, n) {
    // Find the closest card in hand to n, preferring higher on tie
    const card = hand.reduce((best, c) => {
      const db = Math.abs(best - n);
      const dc = Math.abs(c - n);
      return dc < db || (dc === db && c > best) ? c : best;
    });
    this.gameInfo.myLastPlay = card;
    return card;
  },

  updateScore(targets, opponentPlays) {
    let opp1LastPlay = opponentPlays[0][opponentPlays[0].length - 1];
    let opp2LastPlay = opponentPlays[1][opponentPlays[1].length - 1];
    let lastTarget = targets[targets.length - 2];
    if (
      opp1LastPlay > opp2LastPlay &&
      opp1LastPlay > this.gameInfo.myLastPlay
    ) {
      this.gameInfo.score.opp1 += lastTarget;
    } else if (
      opp2LastPlay > opp1LastPlay &&
      opp2LastPlay > this.gameInfo.myLastPlay
    ) {
      this.gameInfo.score.opp2 += lastTarget;
    } else if (
      this.gameInfo.myLastPlay > opp1LastPlay &&
      this.gameInfo.myLastPlay > opp2LastPlay
    ) {
      this.gameInfo.score.me += lastTarget;
    }
  },
};
