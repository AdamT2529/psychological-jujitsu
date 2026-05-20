const FULL_HAND = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
// If winning a target would require spending a card more than this many points
// above the target value, bail instead. e.g. threshold=4 means winning a 3
// is only worth it if the cost is <= 7; if opponents are both playing 8+ on a 3,
// dump a 1 and save your good cards.
const COST_THRESHOLD = 4;

export const learningMan = {
  name: "LearningMan",
  icon: "-",

  getNextCard(hand, targets, opponentPlays) {
    const target = targets[targets.length - 1];

    if (targets.length === 1) {
      // New game
      learningMan.memory.gamesPlayed++;
      learningMan.memory.myLastPlay = null;
    } else {
      // Record what the ideal card WOULD have been for the previous target
      learningMan.recordIdealCard(targets, opponentPlays);
    }

    // On the last turn, also infer and record the final target's ideal card
    if (targets.length === 13) {
      learningMan.recordFinalIdealCard(targets, opponentPlays, hand);
      // Log the ideal card map after each completed game so we can watch it converge
      const summary = Object.fromEntries(
        FULL_HAND.map((n) => {
          const ideals = learningMan.memory.idealCards[n];
          return [
            n,
            {
              raw: ideals,
              // Show the recency-weighted probability of each value, not an average
              // (averaging a bimodal distribution like [13,1,1] gives a useless middle)
              likelyPlay: ideals.length ? weightedSample(ideals) : null,
            },
          ];
        }),
      );
      console.log(
        `LearningMan after game ${learningMan.memory.gamesPlayed} — per-target ideals:`,
        summary,
        `\nglobal deltas (${learningMan.memory.globalIdealDeltas.length} obs):`,
        learningMan.memory.globalIdealDeltas,
      );
    }

    const myPlay = learningMan.chooseCard(hand, target);
    learningMan.memory.myLastPlay = myPlay;
    return myPlay;
  },

  // Record the minimum card that would have won the PREVIOUS target,
  // given what opponents just played.
  // Also records the delta into globalIdealDeltas for cross-target fallback.
  recordIdealCard(targets, opponentPlays) {
    const lastTarget = targets[targets.length - 2];
    const opp1Play = opponentPlays[0][opponentPlays[0].length - 1];
    const opp2Play = opponentPlays[1][opponentPlays[1].length - 1];
    const idealCard = Math.max(opp1Play, opp2Play) + 1;
    const tooExpensive = idealCard - lastTarget > COST_THRESHOLD;
    if (idealCard > 13 || tooExpensive) {
      learningMan.memory.idealCards[lastTarget].push(1);
      learningMan.memory.globalIdealDeltas.push("bail");
    } else {
      learningMan.memory.idealCards[lastTarget].push(idealCard);
      learningMan.memory.globalIdealDeltas.push(idealCard - lastTarget);
    }
  },

  // On the final turn we can infer both opponents' last cards and record
  // the ideal card for the 13th target before the round is played.
  recordFinalIdealCard(targets, opponentPlays, hand) {
    const finalTarget = targets[12];
    const finalOpp1 = FULL_HAND.find((c) => !opponentPlays[0].includes(c));
    const finalOpp2 = FULL_HAND.find((c) => !opponentPlays[1].includes(c));
    const idealCard = Math.max(finalOpp1, finalOpp2) + 1;
    if (idealCard <= 13) {
      learningMan.memory.idealCards[finalTarget].push(idealCard);
      learningMan.memory.globalIdealDeltas.push(idealCard - finalTarget);
    } else {
      learningMan.memory.idealCards[finalTarget].push(1);
      learningMan.memory.globalIdealDeltas.push("bail");
    }
  },

  // Pick which card to play for the current target.
  // Three-tier fallback: per-target data > global delta data > match target.
  chooseCard(hand, target) {
    const ideals = learningMan.memory.idealCards[target];

    // Tier 1: we have per-target history — sample a past ideal card directly
    if (ideals.length > 0) {
      const sampledIdeal = weightedSample(ideals);
      return closestCard(hand, sampledIdeal);
    }

    // Tier 2: no per-target data yet, but we have cross-target delta observations
    const deltas = learningMan.memory.globalIdealDeltas;
    if (deltas.length > 0) {
      const sampledDelta = weightedSample(deltas);
      if (sampledDelta === "bail") return Math.min(...hand);
      return closestCard(hand, target + sampledDelta);
    }

    // Tier 3: no data at all (first card of the first game) — just match the target
    return closestCard(hand, target);
  },

  memory: {
    gamesPlayed: 0,
    myLastPlay: null,
    // Per-target history: list of ideal card values seen for each target
    idealCards: Object.fromEntries(FULL_HAND.map((n) => [n, []])),
    // Cross-target history: signed deltas (or 'bail') from every observed round
    // Used as a fallback when per-target data is sparse
    globalIdealDeltas: [],
  },
};

// Recency-weighted random sample: picks one past ideal card at random,
// where more recent entries are proportionally more likely to be chosen.
// e.g. for [13, 1, 1] → weights [1, 2, 3] → P(13)=1/6, P(1 recent)=3/6
// This handles bimodal distributions correctly — never picks a nonsensical middle.
function weightedSample(values) {
  const totalWeight = values.reduce((sum, _, i) => sum + (i + 1), 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < values.length; i++) {
    rand -= i + 1;
    if (rand <= 0) return values[i];
  }
  return values[values.length - 1];
}

// Return the card in hand numerically closest to desired.
// On a tie in distance, prefer the higher card (more likely to win).
function closestCard(hand, desired) {
  return hand.reduce((best, card) => {
    const bestDist = Math.abs(best - desired);
    const cardDist = Math.abs(card - desired);
    if (cardDist < bestDist) return card;
    if (cardDist === bestDist) return card > best ? card : best; // prefer higher
    return best;
  });
}
