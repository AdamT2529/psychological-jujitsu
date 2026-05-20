const FULL_HAND = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
// Bail if winning a target requires overspending more than this above the target value
const COST_THRESHOLD = 4;
// Log per-play decisions only every N games to avoid flooding the console
const LOG_EVERY_N_GAMES = 25;
// How many recent past games to scan when doing template matching
const TEMPLATE_WINDOW = 300;

export const hinkle26 = {
  name: "Hinkle26", // a cute name
  icon: "-", // an image link
  getNextCard(hand, targets, opponentPlays) {
    const nextTarget = targets[targets.length - 1];

    hinkle26.storeHistory(hand, targets, opponentPlays);

    if (targets.length === 13) {
      // Last card is forced — record profiles before leaving this game
      this.characterizeOpponentStrategiesPostGame();
      this.memory.myLastPlay = hand[0];

      // Log a summary of the two new profiles just built
      const newProfiles = this.memory.opponentProfiles.filter(
        (p) => p.gameIdx === this.memory.currentGame - 1,
      );
      const stats = this.memory.predictionStats;
      const exactPct =
        stats.total > 0 ? Math.round((100 * stats.exact) / stats.total) : "n/a";
      const closePct =
        stats.total > 0 ? Math.round((100 * stats.close) / stats.total) : "n/a";
      const errTotal = stats.over + stats.under;
      const overPct =
        errTotal > 0 ? Math.round((100 * stats.over) / errTotal) : "n/a";
      const cs = this.memory.competeStats;
      const competeWinPct =
        cs.total > 0 ? Math.round((100 * cs.won) / cs.total) : "n/a";
      const ts = this.memory.tierStats;
      const tierTotal = Object.values(ts).reduce((a, b) => a + b, 0);
      const tierStr =
        tierTotal > 0
          ? Object.entries(ts)
              .filter(([, v]) => v > 0)
              .map(([k, v]) => `${k}=${Math.round((100 * v) / tierTotal)}%`)
              .join(" ")
          : "n/a";
      console.log(
        `Hinkle26 — game ${this.memory.currentGame} done.`,
        `Predictions: exact=${exactPct}% close(±2)=${closePct}% | errors: over=${overPct}% under=${100 - overPct}%`,
        `COMPETE win rate: ${competeWinPct}% (${cs.won}/${cs.total})`,
        `Tiers: ${tierStr}`,
        `Final scores:`,
        { ...this.memory.currentGameScores },
        newProfiles.map((p) => ({
          position: p.position,
          dominant: p.dominantStrategy,
          primaryDelta: p.primaryDelta,
          bail: p.bailPattern,
          deltas: p.deltaDistribution,
        })),
      );

      return hand[0];
    }

    const myPlay = this.decidePlay(hand, nextTarget, targets, opponentPlays);
    this.memory.myLastPlay = myPlay;
    return myPlay;
  },

  // Core decision logic: predict what opponents will play, then decide whether
  // to compete for the target or bail with the lowest card.
  decidePlay(hand, target, targets, opponentPlays) {
    const r1 = predictOpponentPlay(
      0,
      target,
      targets,
      opponentPlays,
      this.memory,
    );
    const r2 = predictOpponentPlay(
      1,
      target,
      targets,
      opponentPlays,
      this.memory,
    );
    const pred1 = r1.value;
    const pred2 = r2.value;

    // Track which prediction tier was used
    this.memory.tierStats[r1.tier] = (this.memory.tierStats[r1.tier] || 0) + 1;
    this.memory.tierStats[r2.tier] = (this.memory.tierStats[r2.tier] || 0) + 1;

    // Store for accuracy tracking next turn
    this.memory.lastPredictions = { pred1, pred2 };

    const maxPredicted = Math.max(pred1, pred2);
    const idealCard = maxPredicted + 1;
    const verbose = this.memory.currentGame % LOG_EVERY_N_GAMES === 1;
    const sc = this.memory.currentGameScores;
    const scoreStr = `scores=[me:${sc.me} o1:${sc.opp1} o2:${sc.opp2}]`;

    // Bail if target isn't worth the spend
    if (idealCard > 13 || idealCard - target > COST_THRESHOLD) {
      const play = Math.min(...hand);
      this.memory.lastDecision = "BAIL";
      if (verbose)
        console.log(
          `  target=${target} pred=[${pred1}(${r1.tier}),${pred2}(${r2.tier})] ideal=${idealCard} → BAIL → play=${play} ${scoreStr}`,
        );
      return play;
    }

    // Play the lowest card in hand that still beats both opponents.
    // Add +1 safety buffer (play 2nd-lowest viable) to hedge against under-prediction —
    // when we decide to compete it's usually because prediction was affordable, but
    // opponents tend to play slightly higher than predicted in exactly those cases.
    const viable = hand.filter((c) => c >= idealCard);
    if (viable.length === 0) {
      const play = Math.min(...hand);
      this.memory.lastDecision = "CANT_WIN";
      if (verbose)
        console.log(
          `  target=${target} pred=[${pred1}(${r1.tier}),${pred2}(${r2.tier})] ideal=${idealCard} → CAN'T WIN → play=${play} ${scoreStr}`,
        );
      return play;
    }
    // Use idealCard+1 if available, otherwise play bare minimum
    const play = viable.length > 1 ? viable[1] : viable[0];
    this.memory.lastDecision = "COMPETE";
    if (verbose)
      console.log(
        `  target=${target} pred=[${pred1}(${r1.tier}),${pred2}(${r2.tier})] ideal=${idealCard} → COMPETE → play=${play} ${scoreStr}`,
      );
    return play;
  },

  storeHistory(hand, targets, opponentPlays) {
    if (targets.length === 1) {
      // New game — reset per-game state
      this.memory.currentGame++;
      this.memory.myLastPlay = null;
      this.memory.currentGameScores = { me: 0, opp1: 0, opp2: 0 };
      this.memory.lastPredictions = { pred1: null, pred2: null };
      this.memory.lastDecision = null;
      this.memory.currentGameObservations = { opp1: [], opp2: [] };
      this.memory.gameHistory.push({ playerMap1: {}, playerMap2: {} });
      return;
    }

    const currentGameHistory =
      this.memory.gameHistory[this.memory.currentGame - 1];
    const lastTarget = targets[targets.length - 2];
    const myLastPlay = this.memory.myLastPlay;
    const opp1Play = opponentPlays[0][opponentPlays[0].length - 1];
    const opp2Play = opponentPlays[1][opponentPlays[1].length - 1];

    // Reconstruct each opponent's hand at the moment they played last turn
    // (exclude last play to get hand before they played it)
    const opp1HandAtPlay = FULL_HAND.filter(
      (c) => !opponentPlays[0].slice(0, -1).includes(c),
    );
    const opp2HandAtPlay = FULL_HAND.filter(
      (c) => !opponentPlays[1].slice(0, -1).includes(c),
    );

    const winner = inferWinner(myLastPlay, opp1Play, opp2Play);

    // Update running scores
    if (winner === "me") this.memory.currentGameScores.me += lastTarget;
    else if (winner === "opp1")
      this.memory.currentGameScores.opp1 += lastTarget;
    else if (winner === "opp2")
      this.memory.currentGameScores.opp2 += lastTarget;

    // Check last turn's prediction accuracy
    const { pred1, pred2 } = this.memory.lastPredictions;
    if (pred1 !== null) {
      this.memory.predictionStats.total += 2;
      if (opp1Play === pred1) this.memory.predictionStats.exact++;
      if (opp2Play === pred2) this.memory.predictionStats.exact++;
      if (Math.abs(opp1Play - pred1) <= 2) this.memory.predictionStats.close++;
      if (Math.abs(opp2Play - pred2) <= 2) this.memory.predictionStats.close++;
      if (opp1Play > pred1) this.memory.predictionStats.under++; // we under-predicted
      if (opp1Play < pred1) this.memory.predictionStats.over++; // we over-predicted
      if (opp2Play > pred2) this.memory.predictionStats.under++;
      if (opp2Play < pred2) this.memory.predictionStats.over++;
    }

    // Track whether our last COMPETE decision actually won
    if (this.memory.lastDecision === "COMPETE") {
      this.memory.competeStats.total++;
      if (winner === "me") this.memory.competeStats.won++;
    }

    const play1 = characterizePlay(opp1HandAtPlay, opp1Play, lastTarget);
    const play2 = characterizePlay(opp2HandAtPlay, opp2Play, lastTarget);

    // Store per-game characterization with winner
    currentGameHistory.playerMap1[lastTarget] = { ...play1, winner };
    currentGameHistory.playerMap2[lastTarget] = { ...play2, winner };

    // Accumulate this game's behavioral observations for template matching
    this.memory.currentGameObservations.opp1.push(play1);
    this.memory.currentGameObservations.opp2.push(play2);

    // Update cross-game card history for this target value
    this.memory.cardHistory[lastTarget].plays.push({
      myPlay: myLastPlay,
      opp1Play,
      opp2Play,
      opp1Char: play1,
      opp2Char: play2,
      // Winning card value (null = tie) — more useful than 'me'/'opp1' for learning
      // which card value tends to win each target
      winningCard: getWinningCard(myLastPlay, opp1Play, opp2Play),
    });

    // On the 13th target we can infer the final plays for all three players:
    // opponents have one card left, and so do we (hand.length === 1 here)
    if (targets.length === 13) {
      const finalTarget = targets[12]; // actual value of the last target
      const finalCard1 = FULL_HAND.find((c) => !opponentPlays[0].includes(c));
      const finalCard2 = FULL_HAND.find((c) => !opponentPlays[1].includes(c));
      const myFinalPlay = hand[0]; // only one card left

      const finalWinner = inferWinner(myFinalPlay, finalCard1, finalCard2);
      if (finalWinner === "me") this.memory.currentGameScores.me += finalTarget;
      else if (finalWinner === "opp1")
        this.memory.currentGameScores.opp1 += finalTarget;
      else if (finalWinner === "opp2")
        this.memory.currentGameScores.opp2 += finalTarget;
      const finalPlay1 = characterizePlay(
        [finalCard1],
        finalCard1,
        finalTarget,
      );
      const finalPlay2 = characterizePlay(
        [finalCard2],
        finalCard2,
        finalTarget,
      );

      currentGameHistory.playerMap1[finalTarget] = {
        ...finalPlay1,
        winner: finalWinner,
      };
      currentGameHistory.playerMap2[finalTarget] = {
        ...finalPlay2,
        winner: finalWinner,
      };

      this.memory.cardHistory[finalTarget].plays.push({
        myPlay: myFinalPlay,
        opp1Play: finalCard1,
        opp2Play: finalCard2,
        opp1Char: finalPlay1,
        opp2Char: finalPlay2,
        winningCard: getWinningCard(myFinalPlay, finalCard1, finalCard2),
      });

      currentGameHistory.player1Plays = [...opponentPlays[0], finalCard1];
      currentGameHistory.player2Plays = [...opponentPlays[1], finalCard2];
    } else {
      currentGameHistory.player1Plays = [...opponentPlays[0]];
      currentGameHistory.player2Plays = [...opponentPlays[1]];
    }
    currentGameHistory.targets = [...targets];
  },

  // Called at game end — classifies each opponent's play for every target into a
  // behavior bucket, then stores a compact profile in memory.opponentProfiles.
  characterizeOpponentStrategiesPostGame() {
    const game = this.memory.gameHistory[this.memory.currentGame - 1];

    for (const [position, playerMap] of [
      ["opp1", game.playerMap1],
      ["opp2", game.playerMap2],
    ]) {
      // Bucket plays into named categories
      const strategy = {
        MATCHES: [], // delta === 0
        PLAYS_HIGHEST: [], // played their highest available card
        PLAYS_LOWEST: [], // played their lowest available card
        OTHER: [], // above/below target but not an extreme
      };

      // Count how many targets were played at each delta value
      const deltaDistribution = {};

      for (const [targetStr, charPlay] of Object.entries(playerMap)) {
        strategy[classifyBehavior(charPlay)].push(Number(targetStr));
        const key =
          charPlay.delta >= 0 ? `+${charPlay.delta}` : `${charPlay.delta}`;
        deltaDistribution[key] = (deltaDistribution[key] || 0) + 1;
      }

      // Primary delta: modal delta across all plays (e.g. '+2' means they usually play target+2)
      const primaryDeltaKey = Object.entries(deltaDistribution).reduce(
        (best, curr) => (curr[1] > best[1] ? curr : best),
      )[0];
      const primaryDelta = Number(primaryDeltaKey);

      // Bail pattern: when they deviate from primaryDelta, do they dump low, play high, or mix?
      const deviations = Object.values(playerMap).filter(
        (p) => p.delta !== primaryDelta,
      );
      const bailsLow = deviations.filter((p) => p.lowest).length;
      const bailsHigh = deviations.filter((p) => p.highest).length;
      const bailPattern =
        deviations.length === 0
          ? "NONE"
          : bailsLow >= deviations.length * 0.6
            ? "BAIL_LOWEST"
            : bailsHigh >= deviations.length * 0.6
              ? "BAIL_HIGHEST"
              : "MIXED";

      // Dominant strategy: MATCHES / PLAYS_HIGHEST / PLAYS_LOWEST, or DELTA_+N
      const namedDominant = Object.entries(strategy)
        .filter(([k]) => k !== "OTHER")
        .reduce((best, curr) =>
          curr[1].length > best[1].length ? curr : best,
        )[0];
      const dominantStrategy =
        strategy[namedDominant].length >= strategy.OTHER.length
          ? namedDominant
          : `DELTA_${primaryDeltaKey}`;

      this.memory.opponentProfiles.push({
        gameIdx: this.memory.currentGame - 1,
        position,
        strategy,
        dominantStrategy, // e.g. 'MATCHES', 'PLAYS_HIGHEST', 'DELTA_+2'
        deltaDistribution, // e.g. { '+2': 10, '-10': 2, '+0': 1 }
        primaryDelta, // e.g. 2  — modal delta regardless of extreme
        bailPattern, // e.g. 'BAIL_LOWEST' — what they do when off-delta
        observedTargets: Object.keys(playerMap).length,
      });
    }
  },

  memory: {
    myLastPlay: null,
    currentGame: 0,
    gameHistory: [],
    // For each target value 1-13, accumulate every observed play across all games
    cardHistory: Object.fromEntries(FULL_HAND.map((n) => [n, { plays: [] }])),
    // One entry per opponent per game — grows across the whole tournament
    opponentProfiles: [],
    // Running scores for the current game
    currentGameScores: { me: 0, opp1: 0, opp2: 0 },
    // Predictions made last turn — compared against actuals in storeHistory
    lastPredictions: { pred1: null, pred2: null },
    // Cumulative prediction accuracy across the whole tournament
    predictionStats: { total: 0, exact: 0, close: 0, over: 0, under: 0 }, // close = within ±2
    // Track whether COMPETE decisions actually won
    competeStats: { total: 0, won: 0 },
    lastDecision: null, // 'COMPETE' | 'BAIL' | 'CANT_WIN'
    // Per-turn behavioral observations for the current game (for template matching)
    currentGameObservations: { opp1: [], opp2: [] },
    // Count how often each prediction tier is used
    // in-game: delta fingerprint matched a profile
    // in-game-raw: delta fingerprint used directly (no profile match)
    // history: card history for this target value
    // profile: last game's opponent profile
    // modal: modal delta across all profiles
    // blind: no data at all
    tierStats: {},
  },
};

// Predicts what opponent oppIdx will play on the current target.
// Returns { value, tier } where tier describes which evidence source was used:
//   'template'    — best-matching past game found via full behavioral profile comparison
//   'in-game'     — ≥2 plays, delta fingerprint matched a stored profile (fallback if no template)
//   'in-game-raw' — ≥2 plays, delta used directly with no profile match
//   'profile'     — last game's opponent profile for this seat
//   'history'     — card history for this target (population-level, LearningMan-style)
//   'modal'       — modal delta across all stored profiles
//   'blind'       — no data at all
function predictOpponentPlay(oppIdx, target, targets, opponentPlays, memory) {
  const plays = opponentPlays[oppIdx];
  const pastTargets = targets.slice(0, -1);
  const position = oppIdx === 0 ? "opp1" : "opp2";
  const observations = memory.currentGameObservations[position];

  // Tier 1: Template matching — find the most behaviorally similar past game.
  // Requires ≥2 observations so the similarity score is meaningful.
  if (observations.length >= 2) {
    const bestPlay = findBestMatchingGame(
      memory.gameHistory,
      oppIdx,
      observations,
      target,
      memory.currentGame,
    );
    if (bestPlay !== null) {
      return { value: bestPlay, tier: "template" };
    }
    // No strong template match — fall back to in-game delta fingerprint
    const gameDeltas = plays.map((play, k) => play - pastTargets[k]);
    const modalDelta = findMode(gameDeltas);
    const matchingProfiles = memory.opponentProfiles.filter(
      (p) => p.primaryDelta === modalDelta,
    );
    if (matchingProfiles.length > 0) {
      const profile = matchingProfiles[matchingProfiles.length - 1];
      return {
        value: Math.min(13, Math.max(1, target + profile.primaryDelta)),
        tier: "in-game",
      };
    }
    return {
      value: Math.min(13, Math.max(1, target + modalDelta)),
      tier: "in-game-raw",
    };
  }

  // Tier 2: Last game's profile for this seat — opponent-identity-aware, better than population.
  const lastGameIdx = memory.currentGame - 1;
  const lastGameProfile = memory.opponentProfiles.find(
    (p) => p.gameIdx === lastGameIdx && p.position === position,
  );
  if (lastGameProfile) {
    return {
      value: Math.min(13, Math.max(1, target + lastGameProfile.primaryDelta)),
      tier: "profile",
    };
  }

  // Tier 3: Card history (population-level — LearningMan-style, last resort before modal)
  const history = memory.cardHistory[target].plays;
  if (history.length > 0) {
    const oppPlays = history.map((p) =>
      oppIdx === 0 ? p.opp1Play : p.opp2Play,
    );
    return { value: weightedSample(oppPlays), tier: "history" };
  }

  // Tier 4: Modal delta across all stored profiles
  if (memory.opponentProfiles.length > 0) {
    const allDeltas = memory.opponentProfiles.map((p) => p.primaryDelta);
    const typicalDelta = findMode(allDeltas);
    return {
      value: Math.min(13, Math.max(1, target + typicalDelta)),
      tier: "modal",
    };
  }

  return { value: Math.min(13, target), tier: "blind" };
}

// Scores how well a past game's playerMap matches the current in-game observations.
// Recognizes bail patterns (played lowest) and big-play patterns (played highest)
// independent of the exact card value, plus delta-proximity for mid-range plays.
// Returns a normalized score in [0, 1].
function scoreGameMatch(playerMap, observations) {
  let score = 0;
  let possible = 0;
  for (const obs of observations) {
    const past = playerMap[obs.target];
    if (!past) continue;
    possible += 3;
    if (obs.lowest && past.lowest) {
      score += 3; // both bailed — strong behavioral match
    } else if (obs.highest && past.highest) {
      score += 3; // both went big — strong behavioral match
    } else if (!obs.lowest && !obs.highest && !past.lowest && !past.highest) {
      // Both played mid-range — score by delta proximity
      score += Math.max(0, 3 - Math.abs(obs.delta - past.delta));
    }
    // bail vs non-bail mismatch scores 0 (hard disqualifier)
  }
  return possible > 0 ? score / possible : 0;
}

// Scans recent past games to find the one whose playerMap best matches current
// in-game observations. Returns the predicted play for queryTarget from that
// game, or null if no game scores above the match threshold.
function findBestMatchingGame(
  gameHistory,
  oppIdx,
  observations,
  queryTarget,
  currentGame,
) {
  const playerMapKey = oppIdx === 0 ? "playerMap1" : "playerMap2";
  const MATCH_THRESHOLD = 0.65;
  const windowStart = Math.max(0, currentGame - 1 - TEMPLATE_WINDOW);

  let bestScore = MATCH_THRESHOLD;
  let bestPlay = null;

  // Scan most recent games first (recency bias: earlier exit on good match)
  for (let g = currentGame - 2; g >= windowStart; g--) {
    const game = gameHistory[g];
    if (!game) continue;
    const playerMap = game[playerMapKey];
    if (!playerMap || playerMap[queryTarget] === undefined) continue;

    const score = scoreGameMatch(playerMap, observations);
    if (score > bestScore) {
      bestScore = score;
      bestPlay = playerMap[queryTarget].play;
    }
  }

  return bestPlay;
}

// Returns the modal (most frequent) value in an array of numbers.
function findMode(arr) {
  const freq = {};
  for (const v of arr) freq[v] = (freq[v] || 0) + 1;
  return Number(
    Object.entries(freq).reduce((best, curr) =>
      curr[1] > best[1] ? curr : best,
    )[0],
  );
}

// Recency-biased random sample: weight[i] = i+1 so recent entries are favoured.
// Handles bimodal distributions correctly — no averaging.
function weightedSample(values) {
  const total = (values.length * (values.length + 1)) / 2;
  let r = Math.random() * total;
  for (let i = 0; i < values.length; i++) {
    r -= i + 1;
    if (r <= 0) return values[i];
  }
  return values[values.length - 1];
}

// Determines who won a round given the three plays.
// Returns 'me', 'opp1', 'opp2', or 'tie' (nobody captures on a tie for highest).
function inferWinner(myPlay, opp1Play, opp2Play) {
  const plays = [myPlay, opp1Play, opp2Play];
  const maxPlay = Math.max(...plays);
  if (plays.filter((p) => p === maxPlay).length > 1) return "tie";
  if (myPlay === maxPlay) return "me";
  if (opp1Play === maxPlay) return "opp1";
  return "opp2";
}

// Returns the actual winning card value, or null on a tie.
// More useful than inferWinner for learning which card value tends to win a target.
function getWinningCard(myPlay, opp1Play, opp2Play) {
  const plays = [myPlay, opp1Play, opp2Play];
  const maxPlay = Math.max(...plays);
  if (plays.filter((p) => p === maxPlay).length > 1) return null;
  return maxPlay;
}

// Classifies a single play into a named bucket.
// Priority: exact match > extreme card > other (captured in deltaDistribution).
function classifyBehavior(charPlay) {
  if (charPlay.delta === 0) return "MATCHES";
  if (charPlay.highest) return "PLAYS_HIGHEST";
  if (charPlay.lowest) return "PLAYS_LOWEST";
  return "OTHER"; // delta captured in deltaDistribution
}

function characterizePlay(hand, play, target) {
  const couldMatch = hand.includes(target);
  const highest = Math.max(...hand);
  const lowest = Math.min(...hand);
  return {
    play,
    target,
    couldMatch,
    highest: play === highest,
    lowest: play === lowest,
    delta: play - target,
  };
}
