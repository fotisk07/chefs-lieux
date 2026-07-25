import { useMemo, useState } from 'react';
import { geoCentroid } from 'd3-geo';
import rawDepartments from './data/departments.json';
import CapitalPicker from './components/CapitalPicker';
import Confetti from './components/Confetti';
import FranceMap from './components/FranceMap';
import { buildSchedule, mapPoints, normalize, randomDrinkMessage, streakMessage } from './game/game';
import { playCorrect, playDrink } from './game/sounds';
import { triviaFor } from './data/trivia';
import type { AnswerResult, DepartmentCollection, GameMode, Player, ScheduledQuestion } from './types';

const departments = rawDepartments as DepartmentCollection;
const byCode = new Map(departments.features.map((feature) => [feature.properties.code, feature]));
const capitals = [...new Set(departments.features.map((feature) => feature.properties.capital))].sort((a, b) => a.localeCompare(b, 'fr'));

type Phase = 'setup' | 'round-intro' | 'question' | 'result' | 'bonus-intro' | 'round-end' | 'game-end';

function distanceBetween(codeA: string, codeB: string): number {
  const [lon1, lat1] = geoCentroid(byCode.get(codeA)!);
  const [lon2, lat2] = geoCentroid(byCode.get(codeB)!);
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function distanceComment(distance?: number): string {
  if (distance === undefined) return '';
  if (distance < 80) return 'Very close!';
  if (distance > 450) return 'Wrong side of France!';
  return 'Not quite there.';
}

function roundTitle(player: Player, rank: number, count: number): string {
  if (rank === 0) return 'Minister of Geography';
  if (rank === count - 1) return 'Cartographic Catastrophe';
  if (player.bestStreak >= 3) return 'Keeper of the Flame';
  return 'Respectable Surveyor';
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [names, setNames] = useState(['', '']);
  const [mode, setMode] = useState<GameMode>('capital');
  const [rounds, setRounds] = useState(3);
  const [turns, setTurns] = useState(3);
  const [players, setPlayers] = useState<Player[]>([]);
  const [schedule, setSchedule] = useState<ScheduledQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [drinkMessage, setDrinkMessage] = useState('');
  const [roundLoserId, setRoundLoserId] = useState<string | null>(null);

  const cleanedNames = names.map((name) => name.trim()).filter(Boolean);
  const requiredQuestions = cleanedNames.length * rounds * (turns + 1);
  const canStart = cleanedNames.length > 0 && requiredQuestions <= departments.features.length && rounds > 0 && turns > 0;
  const currentQuestion = schedule[questionIndex];
  const currentDepartment = currentQuestion ? byCode.get(currentQuestion.departmentCode)! : null;
  const currentPlayer = currentQuestion ? players.find((player) => player.id === currentQuestion.playerId)! : null;
  const usedCodes = useMemo(
    () => schedule.slice(0, questionIndex + (phase === 'question' || phase === 'round-intro' || phase === 'bonus-intro' ? 0 : 1)).map((question) => question.departmentCode),
    [schedule, questionIndex, phase],
  );

  function startGame() {
    if (!canStart) return;
    const initialPlayers = cleanedNames.map((name, index): Player => ({
      id: `player-${index}-${Date.now()}`,
      name,
      totalScore: 0,
      roundScore: 0,
      drinks: 0,
      streak: 0,
      bestStreak: 0,
      correctAnswers: 0,
    }));
    setPlayers(initialPlayers);
    setSchedule(buildSchedule(initialPlayers, rounds, turns, departments.features));
    setQuestionIndex(0);
    setResult(null);
    setRoundLoserId(null);
    setPhase('round-intro');
  }

  function answer(correct: boolean, details: Partial<AnswerResult>) {
    if (!currentQuestion || phase !== 'question') return;
    const basePoints = mode === 'map' && details.distanceKm !== undefined
      ? mapPoints(details.distanceKm)
      : correct ? 1 : 0;
    const points = basePoints * (currentQuestion.bonus ? 2 : 1);
    const nextPlayers = players.map((player): Player => {
      if (player.id !== currentQuestion.playerId) return player;
      const streak = correct ? player.streak + 1 : 0;
      return {
        ...player,
        totalScore: player.totalScore + points,
        roundScore: player.roundScore + points,
        drinks: player.drinks + (correct ? 0 : 1),
        streak,
        bestStreak: Math.max(player.bestStreak, streak),
        correctAnswers: player.correctAnswers + (correct ? 1 : 0),
      };
    });
    setPlayers(nextPlayers);
    setResult({ correct, points, ...details });
    if (correct) {
      playCorrect();
      setDrinkMessage('');
    } else {
      playDrink();
      setDrinkMessage(randomDrinkMessage());
    }
    setPhase('result');
  }

  function chooseCapital(chosenCapital: string) {
    answer(normalize(chosenCapital) === normalize(currentDepartment!.properties.capital), { chosenCapital });
  }

  function chooseDepartment(chosenCode: string) {
    const correct = chosenCode === currentQuestion.departmentCode;
    answer(correct, {
      chosenCode,
      distanceKm: correct ? 0 : distanceBetween(chosenCode, currentQuestion.departmentCode),
    });
  }

  function continueAfterResult() {
    const nextQuestion = schedule[questionIndex + 1];
    const roundFinished = !nextQuestion || nextQuestion.round !== currentQuestion.round;
    if (roundFinished) {
      const lowest = Math.min(...players.map((player) => player.roundScore));
      const losers = players.filter((player) => player.roundScore === lowest);
      const uniqueLoser = players.length > 1 && losers.length === 1 ? losers[0] : null;
      setRoundLoserId(uniqueLoser?.id ?? null);
      if (uniqueLoser) {
        setPlayers((current) => current.map((player) => player.id === uniqueLoser.id ? { ...player, drinks: player.drinks + 1 } : player));
        playDrink();
      }
      setPhase('round-end');
      return;
    }

    setQuestionIndex((index) => index + 1);
    setResult(null);
    setDrinkMessage('');
    if (nextQuestion.bonus && !currentQuestion.bonus) setPhase('bonus-intro');
    else setPhase('question');
  }

  function beginBonus() {
    setPhase('question');
  }

  function nextRoundOrFinish() {
    if (questionIndex >= schedule.length - 1) {
      setPhase('game-end');
      return;
    }
    setPlayers((current) => current.map((player) => ({ ...player, roundScore: 0 })));
    setQuestionIndex((index) => index + 1);
    setRoundLoserId(null);
    setResult(null);
    setPhase('round-intro');
  }

  function resetGame() {
    setPhase('setup');
    setPlayers([]);
    setSchedule([]);
    setQuestionIndex(0);
    setResult(null);
  }

  if (phase === 'setup') {
    return (
      <main className="app setup-page">
        <header className="hero">
          <p className="eyebrow">A French geography drinking game</p>
          <h1>Chefs-<span>Lieux</span></h1>
          <p>Know your préfectures. Find your départements. Avoid the sip.</p>
        </header>

        <section className="setup-grid">
          <div className="panel">
            <div className="section-number">01</div>
            <h2>Who's playing?</h2>
            <div className="name-list">
              {names.map((name, index) => (
                <div className="name-row" key={index}>
                  <span>{index + 1}</span>
                  <input
                    aria-label={`Player ${index + 1} name`}
                    placeholder={`Player ${index + 1}`}
                    value={name}
                    onChange={(event) => setNames((current) => current.map((item, i) => i === index ? event.target.value : item))}
                  />
                  {names.length > 1 && <button className="icon-button" onClick={() => setNames((current) => current.filter((_, i) => i !== index))} aria-label="Remove player">×</button>}
                </div>
              ))}
            </div>
            <button className="text-button" onClick={() => setNames((current) => [...current, ''])}>+ Add player</button>
          </div>

          <div className="panel">
            <div className="section-number">02</div>
            <h2>Choose the challenge</h2>
            <div className="mode-options">
              <button className={`mode-card ${mode === 'capital' ? 'selected' : ''}`} onClick={() => setMode('capital')}>
                <b>Chef-lieu</b><span>See a département, name its capital.</span>
              </button>
              <button className={`mode-card ${mode === 'map' ? 'selected' : ''}`} onClick={() => setMode('map')}>
                <b>On the map</b><span>See a name, find its shape.</span>
              </button>
            </div>
            <div className="number-options">
              <label>Rounds<input type="number" min="1" max="96" value={rounds} onChange={(event) => setRounds(Math.max(1, Number(event.target.value)))} /></label>
              <label>Turns / player<input type="number" min="1" max="95" value={turns} onChange={(event) => setTurns(Math.max(1, Number(event.target.value)))} /></label>
            </div>
            <div className={`question-count ${requiredQuestions > 96 ? 'error' : ''}`}>
              <b>{requiredQuestions}</b> of 96 départements will be used
              <small>Includes one double-points bonus question per player and round.</small>
            </div>
          </div>
        </section>
        <button className="primary start-button" disabled={!canStart} onClick={startGame}>Start the game <span>→</span></button>
        {cleanedNames.length === 0 && <p className="form-error">Enter at least one player name.</p>}
        {requiredQuestions > 96 && <p className="form-error">Reduce players, rounds, or turns: departments never repeat.</p>}
        <p className="safety">Every penalty means one sip. Non-alcoholic drinks are always welcome.</p>
      </main>
    );
  }

  if (phase === 'round-intro') {
    const standings = [...players].sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));
    const topScore = standings[0]?.totalScore ?? 0;
    const leaders = standings.filter((player) => player.totalScore === topScore);
    return (
      <main className="app centered-screen round-intro-screen">
        <p className="eyebrow">Round {currentQuestion.round + 1} of {rounds}</p>
        <h1>{currentQuestion.round === 0 ? 'Ready to explore?' : leaders.length === 1 ? `${leaders[0].name} is leading` : 'The lead is tied'}</h1>
        <section className="standings-card panel">
          <h2>Current standings</h2>
          {standings.map((player, index) => (
            <div className={`standing-row ${index === 0 && leaders.length === 1 ? 'leader' : ''}`} key={player.id}>
              <span>{index + 1}</span><b>{player.name}</b><strong>{player.totalScore} pts</strong>
            </div>
          ))}
        </section>
        <button className="primary" onClick={() => setPhase('question')}>Start round {currentQuestion.round + 1} →</button>
      </main>
    );
  }

  if (phase === 'bonus-intro') {
    return (
      <main className="app centered-screen bonus-screen">
        <p className="eyebrow">Round {currentQuestion.round + 1}</p>
        <div className="bonus-bolt">×2</div>
        <h1>Bonus round</h1>
        <p>One question each. No timer—just double points.</p>
        <button className="primary" onClick={beginBonus}>Bring it on</button>
      </main>
    );
  }

  if (phase === 'round-end') {
    const ranking = [...players].sort((a, b) => b.totalScore - a.totalScore || b.roundScore - a.roundScore);
    const isFinalRound = questionIndex === schedule.length - 1;
    return (
      <main className="app results-page">
        <header><p className="eyebrow">Round {currentQuestion.round + 1} complete</p><h1>The reckoning</h1></header>
        <div className="results-grid">
          <section className="ranking panel">
            {ranking.map((player, index) => (
              <article className={`rank-row ${index === 0 ? 'winner' : ''} ${player.id === roundLoserId ? 'loser' : ''}`} key={player.id}>
                <strong>{index + 1}</strong>
                <div><h3>{player.name}</h3><small>+{player.roundScore} this round · {roundTitle(player, index, ranking.length)}</small></div>
                <b>{player.totalScore} pts</b>
              </article>
            ))}
            {roundLoserId ? (
              <div className="penalty">🥃 {players.find((player) => player.id === roundLoserId)?.name}: one extra sip!</div>
            ) : (
              <div className="no-penalty">A tie at the bottom—no extra penalty!</div>
            )}
          </section>
          <section className="progress-panel panel">
            <h2>{usedCodes.length} / 96 explored</h2>
            <FranceMap departments={departments} usedCodes={usedCodes} compact />
          </section>
        </div>
        <button className="primary" onClick={nextRoundOrFinish}>{isFinalRound ? 'See final results' : 'Next round'} →</button>
      </main>
    );
  }

  if (phase === 'game-end') {
    const ranking = [...players].sort((a, b) => b.totalScore - a.totalScore || a.drinks - b.drinks);
    return (
      <main className="app results-page final-page">
        <Confetti amount={140} golden />
        <header><p className="eyebrow">The big winner</p><h1>👑 {ranking[0]?.name}</h1><p>Vive la géographie!</p></header>
        <section className="final-podium panel">
          {ranking.map((player, index) => (
            <article key={player.id} className={index === 0 ? 'champion' : ''}>
              <span>{index === 0 ? '👑' : `#${index + 1}`}</span>
              <div><h2>{player.name}</h2><p>Best streak: {player.bestStreak} · Correct: {player.correctAnswers} · Sips: {player.drinks}</p></div>
              <strong>{player.totalScore} pts</strong>
            </article>
          ))}
        </section>
        <div className="final-actions"><button className="primary" onClick={resetGame}>Play again</button></div>
      </main>
    );
  }

  const activeStreakMessage = currentPlayer ? streakMessage(currentPlayer.streak) : null;
  const leadingScore = Math.max(...players.map((player) => player.totalScore));
  return (
    <main className="app game-page">
      <header className="game-header">
        <div><span className="logo">Chefs-Lieux</span><small>Round {currentQuestion.round + 1} / {rounds}</small></div>
        <div className="turn-order score-board">
          {players.map((player) => (
            <span key={player.id} className={`${player.id === currentPlayer!.id ? 'active' : ''} ${player.totalScore === leadingScore && leadingScore > 0 ? 'leading' : ''}`}>
              {player.totalScore === leadingScore && leadingScore > 0 ? '♛ ' : ''}{player.name} · <b>{player.totalScore} pts</b>
            </span>
          ))}
        </div>
      </header>

      <div className="game-layout">
        <section className={`question-panel ${mode === 'capital' ? 'capital-question' : 'map-question'}`}>
          {mode === 'capital' ? (
            <div className="capital-play-layout">
              <div className="map-wrap capital-map">
                <FranceMap
                  departments={departments}
                  targetCode={currentQuestion.departmentCode}
                  reveal={phase === 'result'}
                />
                <div className="department-tag"><b>{currentDepartment!.properties.code}</b>{currentDepartment!.properties.name}</div>
              </div>
              <div className="capital-answer-column">
                <div className="turn-label">{currentQuestion.bonus ? 'BONUS · DOUBLE POINTS' : `QUESTION ${questionIndex + 1}`} · {currentPlayer!.name}'s turn</div>
                <h1>What is the chef-lieu of<br /><span>{currentDepartment!.properties.name}</span>?</h1>
                {phase === 'question' && <CapitalPicker key={currentQuestion.departmentCode} capitals={capitals} onChoose={chooseCapital} />}
              </div>
            </div>
          ) : (
            <>
              <div className="turn-label">{currentQuestion.bonus ? 'BONUS · DOUBLE POINTS' : `QUESTION ${questionIndex + 1}`} · {currentPlayer!.name}'s turn</div>
              <h1>Where is <span>{currentDepartment!.properties.name}</span>?</h1>
              <p className="map-instruction">Your first click is final.</p>
              <div className="map-wrap pick-map">
                <FranceMap
                  departments={departments}
                  interactive
                  targetCode={currentQuestion.departmentCode}
                  chosenCode={result?.chosenCode}
                  reveal={phase === 'result'}
                  onChoose={chooseDepartment}
                />
              </div>
            </>
          )}
        </section>

        {phase === 'result' && result && (
          <aside className={`result-card ${result.correct ? 'success' : 'failure'}`} role="dialog" aria-live="assertive">
            {result.correct && <Confetti amount={currentQuestion.bonus ? 90 : 45} golden={currentQuestion.bonus} />}
            <div className="result-icon">{result.correct ? '✓' : '×'}</div>
            <h2>{result.correct ? 'CORRECT!' : 'DRINK!'}</h2>
            <p className="points-earned">+{result.points} point{result.points !== 1 ? 's' : ''}</p>
            {!result.correct && <p className="drink-message">{drinkMessage}</p>}
            {mode === 'map' && (
              <div className="result-answer-map">
                <FranceMap
                  departments={departments}
                  interactive
                  targetCode={currentQuestion.departmentCode}
                  chosenCode={result.chosenCode}
                  reveal
                />
              </div>
            )}
            <dl>
              {mode === 'capital' && <><dt>Correct answer</dt><dd>{currentDepartment!.properties.capital}</dd>{result.chosenCapital && <><dt>Your answer</dt><dd>{result.chosenCapital}</dd></>}</>}
              {mode === 'map' && <><dt>Distance</dt><dd>{result.distanceKm} km{!result.correct && ` · ${distanceComment(result.distanceKm)}`}</dd></>}
            </dl>
            <div className="trivia-card"><b>Le saviez-vous?</b><span>{triviaFor(currentQuestion.departmentCode)}</span></div>
            {result.correct && activeStreakMessage && <div className="streak">{activeStreakMessage}</div>}
            <button className="primary" onClick={continueAfterResult}>Continue →</button>
          </aside>
        )}
      </div>
    </main>
  );
}
