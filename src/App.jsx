import "./App.css";
import { Card } from "./Card";
import { Hand } from "./Hand";
import { CardsPlayed } from "./CardsPlayed";
import { HumanPlayerArea } from "./HumanPlayerArea";
import { AISelector } from "./AISelector";
import { PlayerArea } from "./PlayerArea";
import { TargetArea } from "./TargetArea";
import { useEffect, useState } from "react";
import { orderedDummy, targetDummy } from "./ai/dumbAi";
import { jimminyCricketAI } from "./ai/jimminyCricketAi";
import { drake } from "./ai/drake";
import { sortOfSmart } from "./ai/sortOfSmartAI";
import { hinkleAi } from "./ai/hinkleAi";
import { brucienAI } from "./ai/brucienAi";
import { emoRAI } from "./ai/Emor";
import { SimulatorUi } from "./Simulator";
import { generateHand, getWinnerIndex } from "./gameLogic";
import { randoAI } from "./ai/randomAI";
import { seamusAi } from "./ai/seamusAi";
import { isValid } from "./validator";
import { victoryAi } from "./ai/victoryAi";
import { batman } from "./ai/batman";
import { sampleAi } from "./ai/templateAi";
import { WoatAI } from "./ai/woatAi";
import { madDummyAi } from "./ai/madDummy";
import { kendrickAi } from "./ai/kendrickLamar";
import { hinksLilFriend } from "./ai/hinksLilFriend";
import { megamente } from "./ai/Megamente";
import { MetaMind } from "./ai/MetaMind";
import { takeSureBetsAi } from "./ai/takeSureBets";
import { tronAi } from "./ai/tronAI";
import { Tournament } from "./Tournament";
import { hinkle26 } from "./ai/hinkle26";

const availableAIs = [
  hinkle26,
  tronAi,
  takeSureBetsAi,
  sampleAi,
  madDummyAi,
  WoatAI,
  kendrickAi,
  batman,
  MetaMind,
  victoryAi,
  drake,
  hinksLilFriend,
  megamente,
  sortOfSmart,
  brucienAI,
  seamusAi,
  emoRAI,
  targetDummy,
  randoAI,
  hinkleAi,
  jimminyCricketAI,
  orderedDummy,
];

const GameUI = ({ availableAIs }) => {
  const targetSuit = "hearts";
  const otherSuits = [
    "diamonds",
    "spades",
    "clubs",
    "lizards",
    "fruit",
    "tshirts",
    "robots",
  ];
  const [numberOfAIs, setNumberOfAIs] = useState(2); // may never change
  const [ais, setAIs] = useState([sortOfSmart, targetDummy]);
  const [trash, setTrash] = useState([]);
  const [humanHand, setHumanHand] = useState(generateHand());

  const [useHumanPlayer, setUseHumanPlayer] = useState(true);
  let players = [null, ...ais];
  // generate a hand for each AI -- will need new logic if we actually
  // change the number of AIs
  const [hands, setHands] = useState(players.map((a) => generateHand()));
  const [targets, setTargets] = useState(generateHand(true));
  const [targetIndex, setTargetIndex] = useState(0);
  const [humanWon, setHumanWon] = useState([]);
  const [playedCards, setPlayedCards] = useState(players.map((a) => []));
  const [wonCards, setWonCards] = useState(players.map((a) => []));

  const handleAIChange = (newAI, idx) => {
    // Create a new list with the updated AI at the specified index
    const updatedAIs = [...ais];
    updatedAIs[idx] = newAI;
    // Update the state with the new AI list
    setAIs(updatedAIs);
  };
  /*
   * @return the index of winner, or -1 if no one wins
   */

  /*
   * onCardPlayed takes a single human play and then uses it to
   * trigger our AI plays which in turn trigger the update to the
   * game for the next round. Basically all the logic for each
   * round of the game is contained in onCardPlayed :-)
   */
  const onCardPlayed = (humanCard) => {
    // Update the human player first:
    // 1. add played card to "played" list
    // 2. Remove played card from hand
    // Now iterate through the AI to find out the AI plays...
    // AI needs to know what cards we've bid on (targetsSoFar)

    // Make an array to store the decisions of each AI player...
    let humanCards = [humanCard];
    // Get each AI's play
    playAIs(humanCards);
  };

  const playAIs = (humanCards = []) => {
    let cardsPlayedThisRound = [];
    let targetsSoFar = targets.slice(0, targetIndex + 1);
    ais.forEach((ai) => {
      let myHand = hands[cardsPlayedThisRound.length];
      let myPlayed = playedCards[cardsPlayedThisRound.length];
      let card = ai.getNextCard(
        [...myHand],
        targetsSoFar,
        playedCards.filter((pp) => pp != myPlayed),
      );
      if (!isValid(card, myHand)) {
        window.alert("Invalid card played by AI", card);
        console.error(
          "Invalid card ",
          card,
          "played from hand",
          myHand,
          "by AI",
          ai,
        );
        throw new Error("Invalid Card");
      }
      cardsPlayedThisRound.push(card);
    });
    cardsPlayedThisRound = [...cardsPlayedThisRound, ...humanCards];
    setPlayedCards(
      playedCards.map((played, idx) => [...played, cardsPlayedThisRound[idx]]),
    );
    // Remove played cards from list of cards
    setHands(
      hands.map((hand, idx) =>
        hand.filter((card) => card !== cardsPlayedThisRound[idx]),
      ),
    );
    // Finally, let's update the winner and the target...
    // Pick the winner, and update...
    let winner = getWinnerIndex(cardsPlayedThisRound);
    if (winner === -1) {
      setTrash([...trash, targets[targetIndex]]);
    } else {
      const newWon = [...wonCards];
      newWon[winner] = [...newWon[winner], targets[targetIndex]];
      setWonCards(newWon);
    }
    setTargetIndex(targetIndex + 1);
  };

  const resetGame = () => {
    setTargets(generateHand(true));
    setHands(players.map((a) => generateHand()));
    setHumanHand(generateHand());
    setWonCards(players.map((a) => []));
    setPlayedCards(players.map((a) => []));
    setTrash([]);
    setTargetIndex(0);
  };

  useEffect(() => {
    if (useHumanPlayer) {
      setAIs(ais.slice(0, 2));
    } else {
      if (ais.length < 3) {
        setAIs([...ais, availableAIs[0]]);
      }
    }
  }, [useHumanPlayer]);

  return (
    <main>
      <h1 className="header">Psychological Jujitsu</h1>
      <div className="target">
        {targetIndex < targets.length ? (
          <TargetArea
            target={targets[targetIndex]}
            trash={trash}
            suit={targetSuit}
          />
        ) : (
          <div className="game-over">Game Over</div>
        )}
      </div>

      {ais.map((ai, idx) => (
        <div className={`aiPlayer player-${idx + 1}`} key={idx}>
          <AISelector
            selected={ai}
            onSelect={(newAI) => handleAIChange(newAI, idx)}
            idx={idx}
            allAIs={availableAIs}
          ></AISelector>

          <PlayerArea
            round={targetIndex}
            ai={ai}
            suit={otherSuits[idx]}
            hand={hands[idx]}
            playedValues={playedCards[idx]}
            cardsWon={wonCards[idx]}
          />
        </div>
      ))}
      {useHumanPlayer ? (
        <div className="human">
          <h2>Human Area</h2>
          <HumanPlayerArea
            onCardPlayed={onCardPlayed}
            handValues={hands[2]}
            playedValues={playedCards[2]}
            cardsWon={wonCards[2]}
            suit={otherSuits[2]}
          />
        </div>
      ) : (
        <div />
      )}

      <div className="round">
        {targetIndex <= 12 ? (
          <div>Round {targetIndex + 1}</div>
        ) : (
          <button onClick={resetGame}>New Game?</button>
        )}
        <button onClick={() => setUseHumanPlayer(!useHumanPlayer)}>
          Switch to {useHumanPlayer ? "All AI" : "Human player"}
        </button>
        <div className="instructions">
          {useHumanPlayer ? (
            "Click a Card to Play It"
          ) : (
            <button onClick={() => playAIs([])} disabled={targetIndex > 12}>
              Next Turn
            </button>
          )}
        </div>
      </div>
    </main>
  );
};

const App = () => {
  const UNSET = 0;
  const GAME_MODE = 1;
  const SIM_MODE = 2;
  const TOURNAMENT_MODE = 3;
  let [gameMode, setGameMode] = useState(0);
  return (
    <div>
      {gameMode === GAME_MODE ? (
        <GameUI availableAIs={availableAIs} />
      ) : gameMode === SIM_MODE ? (
        <SimulatorUi availableAIs={availableAIs} />
      ) : gameMode === TOURNAMENT_MODE ? (
        <Tournament availableAIs={availableAIs} />
      ) : (
        <div className="startPage">
          <button className="playGame" onClick={() => setGameMode(GAME_MODE)}>
            Play Game
          </button>
          <button className="runSim" onClick={() => setGameMode(SIM_MODE)}>
            Run Simulations
          </button>
          <button
            className="runSim"
            onClick={() => setGameMode(TOURNAMENT_MODE)}
          >
            Tournament Mode
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
