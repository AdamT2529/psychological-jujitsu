import React, { useState, useEffect, useRef, useCallback } from "react";
import { AISelector } from "./AISelector";
import { generateHand, getWinnerIndex } from "./gameLogic";
import { isValid } from "./validator";

/* Citation: this was initially vibe-coded with Agent-mode Copilot using GPT-4.1
The first draft was unusably bad, so I had GPT o3 rewrite it to refactor and 
use components.

The second draft is workable so I'm keeping it.

AI was directed by Mr. Hinkle, but this Tournament module was pretty much
all machine written.

-- Mr. H
*/

/**
 * Utility: all 3-way combinations from a source array
 */
function combinationsOfThree(arr) {
  const out = [];
  for (let i = 0; i < arr.length - 2; i++)
    for (let j = i + 1; j < arr.length - 1; j++)
      for (let k = j + 1; k < arr.length; k++)
        out.push([arr[i], arr[j], arr[k]]);
  return out;
}

/**
 * Pure function – plays a full match (many rounds) between three AIs and returns
 * aggregated results.   Keeping this pure makes the component logic far simpler.
 */
function playMatch(ais, rounds) {
  const totals = [0, 0, 0]; // sum of card-points
  const wins = [0, 0, 0]; // rounds won outright
  const ties = [0, 0, 0]; // tied-round appearances

  for (let r = 0; r < rounds; r++) {
    const targets = generateHand(true);
    const hands = Array.from({ length: 3 }, () => generateHand(false));
    const played = [[], [], []];
    const captured = [[], [], []];

    for (let t = 0; t < targets.length; t++) {
      const targetsSoFar = targets.slice(0, t + 1);
      const plays = ais.map((ai, idx) => {
        const card = ai.getNextCard(
          [...hands[idx]],
          targetsSoFar,
          played.filter((_, i) => i !== idx),
        );
        return isValid(card, hands[idx]) ? card : -1;
      });
      const winner = getWinnerIndex(plays);
      if (winner > -1) captured[winner].push(targets[t]);
      plays.forEach((p, i) => {
        hands[i] = hands[i].filter((c) => c !== p);
        played[i].push(p);
      });
    }

    // per-round bookkeeping
    const roundPts = captured.map((cs) => cs.reduce((sum, c) => sum + c, 0));
    const maxPts = Math.max(...roundPts);
    const roundWinners = roundPts.flatMap((pts, i) =>
      pts === maxPts ? [i] : [],
    );
    if (roundWinners.length === 1) {
      wins[roundWinners[0]]++;
    } else {
      roundWinners.forEach((i) => ties[i]++);
    }
    roundPts.forEach((pt, i) => (totals[i] += pt));
  }

  // Determine match winner (wins → points)
  const maxWins = Math.max(...wins);
  const prelim = wins.flatMap((w, i) => (w === maxWins ? [i] : []));
  const matchWinner =
    prelim.length === 1
      ? prelim[0]
      : prelim.reduce(
          (best, i) => (totals[i] > totals[best] ? i : best),
          prelim[0],
        );

  const tie =
    prelim.length > 1 && prelim.every((i) => totals[i] === totals[prelim[0]]);

  return { totals, wins, ties, matchWinner, tie };
}

/**
 * Helper – immutable standings update after a match.
 */
function updateStandings(prev, ais, res) {
  const next = { ...prev };
  ais.forEach((ai, idx) => {
    if (!next[ai.name])
      next[ai.name] = { wins: 0, losses: 0, ties: 0, matches: 0, points: 0 };
    const rec = next[ai.name];
    if (res.tie) {
      // tie only for those involved in tie
      if ([res.matchWinner].flat().includes(idx)) rec.ties++;
      else rec.losses++;
    } else {
      idx === res.matchWinner ? rec.wins++ : rec.losses++;
    }
    rec.matches++;
    rec.points += res.totals[idx];
  });
  return next;
}

/* ----------------------------- PRESENTATION ----------------------------- */
const Controls = ({
  canNext,
  onNext,
  autoRun,
  setAutoRun,
  delay,
  setDelay,
  current,
  total,
}) => (
  <div
    style={{
      position: "sticky",
      top: 0,
      background: "#111",
      padding: 8,
      display: "flex",
      gap: 12,
      borderBottom: "1px solid #333",
      zIndex: 5,
      color: "#fff",
      alignItems: "center",
    }}
  >
    <button onClick={onNext} disabled={!canNext || autoRun}>
      Next Match
    </button>
    <button onClick={() => setAutoRun(true)} disabled={autoRun || !canNext}>
      Auto-Run
    </button>
    <button onClick={() => setAutoRun(false)} disabled={!autoRun}>
      Stop
    </button>
    <label
      style={{ marginLeft: 24, display: "flex", alignItems: "center", gap: 8 }}
    >
      <span style={{ fontSize: "0.95em", color: "#ffd700" }}>Delay (ms):</span>
      <input
        type="range"
        min={50}
        max={2000}
        step={10}
        value={delay}
        onChange={(e) => setDelay(Number(e.target.value))}
        style={{ verticalAlign: "middle" }}
      />
      <span style={{ minWidth: 40, textAlign: "right" }}>{delay}</span>
      <span style={{ fontSize: "0.85em", color: "#bbb", marginLeft: 8 }}>
        (Higher = Slower)
      </span>
    </label>
    <span style={{ marginLeft: 24 }}>
      Match {current + 1} / {total}
    </span>
  </div>
);

const MatchList = ({ matchups, currentIdx, matchResults, rounds }) => (
  <div
    style={{
      flex: 1,
      overflowY: "auto",
      maxHeight: "70vh",
      border: "1px solid #2e4d2e",
      // background: "#fff", // REMOVE: let inherit dark bg
    }}
  >
    <table
      style={{
        width: "100%",
        fontSize: "0.95em",
        borderCollapse: "collapse",
      }}
    >
      <thead>
        <tr>
          <th>#</th>
          <th colSpan={3}>Matchup</th>
        </tr>
      </thead>
      <tbody>
        {matchups.map((ais, idx) => {
          const res = matchResults[idx];
          const isCurrent = idx === currentIdx;
          // Prepare winner/tie logic
          let winnerArr = [];
          if (res) {
            if (res.tie) {
              winnerArr = [res.matchWinner].flat();
            } else {
              winnerArr = [res.matchWinner];
            }
          }
          return (
            <React.Fragment key={idx}>
              <tr
                style={
                  isCurrent ? { background: "#224422", fontWeight: "bold" } : {}
                }
              >
                <td
                  rowSpan={3}
                  style={{
                    verticalAlign: "middle",
                    fontWeight: "bold",
                  }}
                >
                  {idx + 1}
                </td>
                {ais.map((ai, i) => (
                  <td
                    key={ai.name}
                    style={{
                      textAlign: "center",
                      fontWeight: winnerArr.includes(i) ? "bold" : undefined,
                      position: "relative",
                    }}
                  >
                    {ai.name}
                    {winnerArr.includes(i) && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: "1.1em",
                          verticalAlign: "middle",
                        }}
                        role="img"
                        aria-label="winner"
                      >
                        👑
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              <tr style={isCurrent ? { background: "#224422" } : {}}>
                {ais.map((ai, i) => (
                  <td
                    key={ai.name + "-wlts"}
                    style={{
                      textAlign: "center",
                      fontSize: "0.95em",
                    }}
                  >
                    {res
                      ? `${res.wins[i]}-${
                          res.losses
                            ? res.losses[i]
                            : rounds - res.wins[i] - res.ties[i]
                        }-${res.ties[i]}`
                      : "-"}
                  </td>
                ))}
              </tr>
              <tr style={isCurrent ? { background: "#224422" } : {}}>
                {ais.map((ai, i) => (
                  <td
                    key={ai.name + "-pts"}
                    style={{
                      textAlign: "center",
                      fontSize: "0.95em",
                      color:
                        winnerArr.includes(i) && isCurrent
                          ? "#d4af37"
                          : undefined,
                    }}
                  >
                    {res ? `${res.totals[i]} pts` : "-"}
                  </td>
                ))}
              </tr>
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  </div>
);

const Standings = ({ standings }) => (
  <div style={{ flex: 1 }}>
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "0.9em",
      }}
      border="1"
      cellPadding="4"
    >
      <thead>
        <tr>
          <th>AI</th>
          <th>W</th>
          <th>L</th>
          <th>T</th>
          <th>Pts</th>
          <th>M</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(standings)
          .sort((a, b) => b[1].wins - a[1].wins || b[1].points - a[1].points)
          .map(([name, r]) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{r.wins}</td>
              <td>{r.losses}</td>
              <td>{r.ties}</td>
              <td>{r.points}</td>
              <td>{r.matches}</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

export const Tournament = ({ availableAIs }) => {
  const [selected, setSelected] = useState([]);
  const [rounds, setRounds] = useState(10);

  const [matchups, setMatchups] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [standings, setStandings] = useState({});
  const [autoRun, setAutoRun] = useState(false);
  const [delay, setDelay] = useState(600);
  const [currentAnim, setCurrentAnim] = useState({
    phase: "idle",
    idx: -1,
    result: null,
  });

  // ----- helpers
  const canStep = currentIdx >= 0 && currentIdx < matchups.length;

  const doMatch = useCallback(() => {
    if (!canStep) return;
    const skipAnim = delay < 600;
    const res = playMatch(matchups[currentIdx], rounds);
    setStandings((prev) => updateStandings(prev, matchups[currentIdx], res));
    setMatchResults((prev) => {
      const upd = [...prev];
      upd[currentIdx] = res;
      return upd;
    });
    if (skipAnim) {
      setCurrentIdx((i) => i + 1);
    } else {
      setCurrentAnim({ phase: "showing", idx: currentIdx, result: res });
      setTimeout(() => {
        setCurrentAnim((prev) => ({ ...prev, phase: "fading" }));
        setTimeout(() => {
          setCurrentAnim({ phase: "idle", idx: -1, result: null });
          setCurrentIdx((i) => i + 1);
        }, 600);
      }, 1200);
    }
  }, [canStep, currentIdx, matchups, rounds, delay]);

  // ----- auto-run effect
  useEffect(() => {
    if (!autoRun) return;
    if (!canStep) {
      setAutoRun(false);
      return;
    }
    const id = setTimeout(doMatch, delay);
    return () => clearTimeout(id);
  }, [autoRun, canStep, delay, doMatch]);

  // ----- UI actions
  const toggleAI = (ai, checked) => {
    setSelected((prev) =>
      checked ? [...prev, ai] : prev.filter((a) => a.name !== ai.name),
    );
  };

  const startTournament = () => {
    const combos = combinationsOfThree(selected);
    combos.sort((a, b) => Math.random() - 0.5); // shuffle for variety
    setMatchups(combos);
    setMatchResults(Array(combos.length));
    setCurrentIdx(0);
    setStandings({});
    setAutoRun(false);
  };

  // Animated overlay for current match result
  const renderAnimOverlay = () => {
    if (currentAnim.phase === "idle" || currentAnim.idx < 0) return null;
    const ais = matchups[currentAnim.idx];
    const res = currentAnim.result;
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 60,
          zIndex: 20,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          className={`anim-overlay anim-overlay-${currentAnim.phase}`}
          style={{
            background: "#111", // black background for pop effect
            border: "2px solid #ffd700",
            borderRadius: 16,
            boxShadow: "0 8px 32px #000a",
            padding: "24px 48px",
            fontSize: "1.5em",
            fontWeight: "bold",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 32,
            opacity: currentAnim.phase === "fading" ? 0 : 1,
            transform:
              currentAnim.phase === "showing"
                ? "translateY(0) scale(1)"
                : currentAnim.phase === "fading"
                  ? "translateY(40px) scale(0.95)"
                  : "translateY(-40px) scale(0.95)",
            transition: "transform 0.5s, opacity 0.5s",
          }}
        >
          {ais.map((ai, i) => {
            const isWinner = !res.tie && res.matchWinner === i;
            const isTied = res.tie && [res.matchWinner].flat().includes(i);
            return (
              <span
                key={ai.name}
                style={{
                  margin: "0 16px",
                  fontWeight: isWinner || isTied ? "bold" : "normal",
                  color: isWinner ? "#ffd700" : isTied ? "#b8860b" : "#fff",
                  position: "relative",
                  transition: "transform 0.4s, color 0.4s",
                  transform: isWinner ? "scale(1.2)" : "scale(1)",
                }}
              >
                {isWinner && (
                  <span
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: -38,
                      transform: "translateX(-50%)",
                      fontSize: "1.2em",
                      color: "#ffd700",
                      filter: "drop-shadow(0 2px 2px #0006)",
                      pointerEvents: "none",
                    }}
                  >
                    {"\uD83D\uDC51"}
                  </span>
                )}
                {ai.name}
              </span>
            );
          })}
          <span style={{ marginLeft: 24, fontSize: "0.8em", color: "#bbb" }}>
            {res.tie ? "Tie!" : `${ais[res.matchWinner].name} wins`}
          </span>
        </div>
      </div>
    );
  };

  /* ------------------------------ render ----------------------------- */
  return (
    <div style={{ position: "relative" }}>
      {renderAnimOverlay()}
      <h2>Tournament</h2>
      {currentIdx === -1 && (
        <>
          <h3>Select AIs</h3>
          {availableAIs.map((ai) => (
            <label key={ai.name} style={{ marginRight: 12 }}>
              <input
                type="checkbox"
                checked={selected.some((a) => a.name === ai.name)}
                onChange={(e) => toggleAI(ai, e.target.checked)}
              />
              {ai.name}
            </label>
          ))}
          <div style={{ marginTop: 8 }}>
            Rounds per match:
            <input
              type="number"
              value={rounds}
              min={1}
              max={100}
              onChange={(e) => setRounds(Number(e.target.value))}
              style={{ width: 60, marginLeft: 8 }}
            />
          </div>
          <button
            disabled={selected.length < 3}
            onClick={startTournament}
            style={{ marginTop: 12 }}
          >
            Start Tournament
          </button>
        </>
      )}

      {currentIdx >= 0 && (
        <>
          <Controls
            canNext={canStep}
            onNext={doMatch}
            autoRun={autoRun}
            setAutoRun={setAutoRun}
            delay={delay}
            setDelay={setDelay}
            current={currentIdx}
            total={matchups.length}
          />
          <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
            <MatchList
              matchups={matchups}
              currentIdx={currentIdx}
              matchResults={matchResults}
              rounds={rounds}
            />
            <Standings standings={standings} />
          </div>
        </>
      )}
      <style>{`
        .anim-overlay-showing {
          animation: popIn 0.5s cubic-bezier(.68,-0.55,.27,1.55);
        }
        .anim-overlay-fading {
          opacity: 0;
          transition: opacity 0.5s;
        }
        @keyframes popIn {
          0% { opacity: 0; transform: translateY(-40px) scale(0.95); }
          80% { opacity: 1; transform: translateY(8px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        tr[style*="background: #e1f5fe"] {
          background: #b2df8a !important;
          color: #222 !important;
        }
      `}</style>
    </div>
  );
};
