import React, { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Shuffle,
  Users,
  Clock,
  Swords,
  RotateCcw,
  Crown,
  ArrowLeft
} from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "chessmvp-v1";

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function suggestedRounds(totalPlayers) {
  if (totalPlayers <= 1) return 0;
  if (totalPlayers <= 8) return 3;
  if (totalPlayers <= 16) return 4;
  if (totalPlayers <= 32) return 5;
  if (totalPlayers <= 64) return 6;
  return 7;
}

const defaultState = {
  tournamentName: "ChessMVP",
  schoolName: "",
  totalRounds: 0,
  currentRound: 0,

  pointsWin: 1,
  pointsDraw: 0.5,
  pointsLoss: 0,
  pointsBye: 1,
  allowDraw: true,

  players: [],
  matches: [],

  turns: [
    {
      id: uid("turn"),
      name: "Manhã",
      tables: 5,
      time: "08:00"
    },
    {
      id: uid("turn"),
      name: "Tarde",
      tables: 5,
      time: "14:00"
    }
  ]
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultState;
    }

    return {
      ...defaultState,
      ...JSON.parse(raw)
    };
  } catch {
    return defaultState;
  }
}

function hasPlayed(playerA, playerB, allMatches) {
  return allMatches.some(
    (match) =>
      (match.playerA === playerA.id && match.playerB === playerB.id) ||
      (match.playerA === playerB.id && match.playerB === playerA.id)
  );
}

function assignSlots(matches, turns) {
  const slots = [];

  turns.forEach((turn) => {
    const amount = Number(turn.tables || 0);

    for (let i = 1; i <= amount; i++) {
      slots.push({
        turnName: turn.name,
        time: turn.time,
        table: i
      });
    }
  });

  return matches.map((match, index) => {
    const totalSlots = Math.max(slots.length, 1);

    const slot = slots[index % totalSlots] || {
      turnName: "Único",
      time: "",
      table: index + 1
    };

    const block = Math.floor(index / totalSlots) + 1;

    return {
      ...match,
      table: slot.table,
      turnName: slot.turnName,
      time: slot.time,
      block
    };
  });
}

function createRound(state) {
  const roundNumber = state.currentRound + 1;

  let players = state.players.map((player) => ({ ...player }));

  if (roundNumber === 1) {
    players = shuffle(players);
  } else {
    players = [...players].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.name.localeCompare(b.name);
    });
  }

  let byePlayer = null;

  if (players.length % 2 === 1) {
    const eligible =
      [...players].reverse().find((player) => !player.hadBye) ||
      players[players.length - 1];

    byePlayer = eligible;
    players = players.filter((player) => player.id !== eligible.id);
  }

  const groups = [];

  if (roundNumber === 1) {
    groups.push(shuffle(players));
  } else {
    const byPoints = new Map();

    for (const player of players) {
      const key = String(player.points);

      if (!byPoints.has(key)) {
        byPoints.set(key, []);
      }

      byPoints.get(key).push(player);
    }

    [...byPoints.keys()]
      .map(Number)
      .sort((a, b) => b - a)
      .forEach((points) => {
        groups.push(shuffle(byPoints.get(String(points))));
      });
  }

  const pool = [];

  groups.forEach((group) => {
    pool.push(...group);
  });

  const pairings = [];

  while (pool.length > 1) {
    const playerA = pool.shift();

    let opponentIndex = pool.findIndex(
      (player) => !hasPlayed(playerA, player, state.matches)
    );

    if (opponentIndex === -1) {
      opponentIndex = 0;
    }

    const [playerB] = pool.splice(opponentIndex, 1);

    pairings.push({
      id: uid("match"),
      round: roundNumber,
      playerA: playerA.id,
      playerB: playerB.id,
      scoreA: null,
      scoreB: null,
      result: null,
      status: "pending",
      isBye: false
    });
  }

  if (byePlayer) {
    pairings.push({
      id: uid("match"),
      round: roundNumber,
      playerA: byePlayer.id,
      playerB: null,
      scoreA: state.pointsBye,
      scoreB: 0,
      result: "bye",
      status: "done",
      isBye: true
    });
  }

  return assignSlots(pairings, state.turns);
}

function recalculatePlayers(players, matches, config) {
  const resetPlayers = players.map((player) => ({
  ...player,
  points: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  tieBreakWins: 0,
  hadBye: false,
  opponents: []
}));    

  const map = new Map(resetPlayers.map((player) => [player.id, player]));

  matches.forEach((match) => {
    if (match.status !== "done") return;

    const playerA = map.get(match.playerA);
    const playerB = match.playerB ? map.get(match.playerB) : null;

    if (!playerA) return;

if (match.isTieBreak) {
  if (!playerB) return;

  if (match.scoreA > match.scoreB) {
    playerA.tieBreakWins += 1;
  } else if (match.scoreB > match.scoreA) {
    playerB.tieBreakWins += 1;
  }

  return;
}

if (match.isBye || match.result === "bye") {
  playerA.points += config.pointsBye;
  playerA.wins += 1;
  playerA.hadBye = true;
  return;
}

    if (!playerB) return;

    playerA.opponents.push(playerB.id);
    playerB.opponents.push(playerA.id);

    playerA.points += Number(match.scoreA || 0);
    playerB.points += Number(match.scoreB || 0);

    if (match.scoreA > match.scoreB) {
      playerA.wins += 1;
      playerB.losses += 1;
    } else if (match.scoreB > match.scoreA) {
      playerB.wins += 1;
      playerA.losses += 1;
    } else {
      playerA.draws += 1;
      playerB.draws += 1;
    }
  });

  return [...map.values()];
}

function PlayerName({ id, players }) {
  const player = players.find((item) => item.id === id);

  if (!player) {
    return <>BYE</>;
  }

  return <>{player.name}</>;
}

function getOpponentStrength(player, allPlayers) {
  if (!player.opponents || player.opponents.length === 0) {
    return 0;
  }

  return player.opponents.reduce((total, opponentId) => {
    const opponent = allPlayers.find((item) => item.id === opponentId);
    return total + Number(opponent?.points || 0);
  }, 0);
}

function getTieKey(player, allPlayers) {
  const strength = getOpponentStrength(player, allPlayers);

  return [
    player.points,
    player.wins,
    strength,
    player.losses,
    player.tieBreakWins || 0
  ].join("-");
}

function getTechnicalTieGroups(players) {
  const groups = new Map();

  players.forEach((player) => {
    const key = getTieKey(player, players);

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(player);
  });

  return [...groups.values()].filter((group) => group.length > 1);
}


function ChessTournament({ onBack }) {
  const [state, setState] = useState(loadState);
  const [namesText, setNamesText] = useState("");
  const [activeTab, setActiveTab] = useState("setup");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const ranking = useMemo(() => {
  return [...state.players].sort((a, b) => {
    const strengthA = getOpponentStrength(a, state.players);
    const strengthB = getOpponentStrength(b, state.players);

    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (strengthB !== strengthA) return strengthB - strengthA;

    if ((b.tieBreakWins || 0) !== (a.tieBreakWins || 0)) {
      return (b.tieBreakWins || 0) - (a.tieBreakWins || 0);
    }

    if (a.losses !== b.losses) return a.losses - b.losses;

    return a.name.localeCompare(b.name);
  });
}, [state.players]);

  const roundMatches = state.matches.filter(
    (match) => match.round === state.currentRound
  );

  const doneRound =
    roundMatches.length > 0 &&
    roundMatches.every((match) => match.status === "done");

  const totalTables = state.turns.reduce(
    (sum, turn) => sum + Number(turn.tables || 0),
    0
  );


  const tournamentFinished =
  state.totalRounds > 0 &&
  state.currentRound >= state.totalRounds &&
  doneRound;

const technicalTieGroups = useMemo(() => {
  if (!tournamentFinished) {
    return [];
  }

  return getTechnicalTieGroups(state.players);
}, [state.players, tournamentFinished]);


  function updateState(next) {
    setState((previous) => {
      if (typeof next === "function") {
        return next(previous);
      }

      return next;
    });
  }

  function importPlayers() {
    const names = namesText
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean);

    const players = names.map((name) => ({
    id: uid("player"),
    name,
    points: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    tieBreakWins: 0,
    hadBye: false,
    opponents: []
    }));

    updateState((previous) => ({
      ...previous,
      players,
      matches: [],
      currentRound: 0,
      totalRounds: suggestedRounds(players.length)
    }));

    setActiveTab("setup");
  }

function generateNextRound() {
  updateState((previous) => {
    if (previous.currentRound >= previous.totalRounds) {
      return previous;
    }

    const safeTurns =
      previous.turns.length > 0
        ? previous.turns
        : [
            {
              id: uid("turn"),
              name: "Turno único",
              tables: 1,
              time: "08:00"
            }
          ];

    const stateWithSafeTurns = {
      ...previous,
      turns: safeTurns
    };

    const newMatches = createRound(stateWithSafeTurns);

    return {
      ...stateWithSafeTurns,
      currentRound: previous.currentRound + 1,
      matches: [...previous.matches, ...newMatches]
    };
  });

  setActiveTab("round");
}

  function setResult(matchId, type) {
    updateState((previous) => {
      const updatedMatches = previous.matches.map((match) => {
        if (match.id !== matchId) {
          return match;
        }

        if (type === "A") {
          return {
            ...match,
            scoreA: previous.pointsWin,
            scoreB: previous.pointsLoss,
            result: "A",
            status: "done"
          };
        }

        if (type === "B") {
          return {
            ...match,
            scoreA: previous.pointsLoss,
            scoreB: previous.pointsWin,
            result: "B",
            status: "done"
          };
        }

        return {
          ...match,
          scoreA: previous.pointsDraw,
          scoreB: previous.pointsDraw,
          result: "draw",
          status: "done"
        };
      });

      const updatedPlayers = recalculatePlayers(
        previous.players,
        updatedMatches,
        previous
      );

      return {
        ...previous,
        matches: updatedMatches,
        players: updatedPlayers
      };
    });
  }

  function resetTournament() {
    const confirmReset = confirm(
      "Tem certeza que deseja apagar o torneio atual?"
    );

    if (!confirmReset) return;

    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
    setNamesText("");
    setActiveTab("setup");
  }

  function updateTurn(index, field, value) {
    const turns = [...state.turns];

    turns[index] = {
      ...turns[index],
      [field]: value
    };

    updateState({
      ...state,
      turns
    });
  }

    function exportTournament() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.tournamentName || "chessmvp"}-torneio.json`;
  link.click();

  URL.revokeObjectURL(url);
}

function importTournament(event) {
  const file = event.target.files[0];

  if (!file) return;

  const confirmImport = confirm(
    "Importar este arquivo vai substituir o torneio atual. Deseja continuar?"
  );

  if (!confirmImport) {
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const importedState = JSON.parse(reader.result);

      setState({
        ...defaultState,
        ...importedState
      });

      setActiveTab("setup");
      alert("Torneio importado com sucesso!");
    } catch {
      alert("Arquivo inválido. Selecione um arquivo JSON exportado pelo ChessMVP.");
    }

    event.target.value = "";
  };

  reader.readAsText(file);
}

  function generateTieBreakRound(tiedPlayers) {
  updateState((previous) => {
    const roundNumber = previous.currentRound + 1;
    const shuffledPlayers = shuffle(tiedPlayers);
    const pairings = [];

    while (shuffledPlayers.length > 1) {
      const playerA = shuffledPlayers.shift();
      const playerB = shuffledPlayers.shift();

      pairings.push({
        id: uid("match"),
        round: roundNumber,
        playerA: playerA.id,
        playerB: playerB.id,
        scoreA: null,
        scoreB: null,
        result: null,
        status: "pending",
        isBye: false,
        isTieBreak: true
      });
    }

    if (shuffledPlayers.length === 1) {
      const waitingPlayer = shuffledPlayers.shift();

      pairings.push({
        id: uid("match"),
        round: roundNumber,
        playerA: waitingPlayer.id,
        playerB: null,
        scoreA: 0,
        scoreB: 0,
        result: "waiting",
        status: "done",
        isBye: true,
        isTieBreak: true
      });
    }

    const matchesWithSlots = assignSlots(pairings, previous.turns);

    return {
      ...previous,
      currentRound: roundNumber,
      totalRounds: roundNumber,
      matches: [...previous.matches, ...matchesWithSlots]
    };
  });

  setActiveTab("round");
}

  return (
    <div className="app">
      <div className="bg-board"></div>

      <header className="hero">
        <div>
          <p className="eyebrow">Torneio escolar de xadrez</p>
          <h1>♟ {state.tournamentName}</h1>
          <p className="subtitle">
            {state.schoolName || "Painel de controle do torneio"}
          </p>
        </div>


        <div className="hero-actions">
        
  <button className="ghost" onClick={onBack}>
    <ArrowLeft size={18} />
    Menu
  </button>

        <button className="ghost" onClick={resetTournament}>
            <RotateCcw size={18} />
                Reiniciar
            </button>

            <button className="ghost" onClick={exportTournament}>
    Exportar
  </button>

  <label className="ghost import-file-button">
    Importar
    <input
      type="file"
      accept="application/json"
      onChange={importTournament}
      hidden
    />
  </label>

          <button
            className="primary"
            onClick={generateNextRound}
            disabled={
                state.players.length < 2 ||
                state.currentRound >= state.totalRounds ||
                (roundMatches.length > 0 && !doneRound)
            }
            >
            <Shuffle size={18} />
            {state.currentRound >= state.totalRounds && state.totalRounds > 0
                ? "Torneio finalizado"
                : state.currentRound === 0
                ? "Sortear Rodada 1"
                : state.currentRound + 1 === state.totalRounds
                    ? "Gerar última rodada"
                    : "Gerar próxima rodada"}
            </button>
        </div>
      </header>

      <section className="stats">
        <div className="stat">
          <Users />
          <span>Jogadores</span>
          <strong>{state.players.length}</strong>
        </div>

        <div className="stat">
          <Swords />
          <span>Rodada</span>
          <strong>
            {state.currentRound}/{state.totalRounds}
          </strong>
        </div>

        <div className="stat">
          <Clock />
          <span>Mesas</span>
          <strong>{totalTables}</strong>
        </div>

        <div className="stat">
          <Trophy />
          <span>Partidas</span>
          <strong>
            {state.matches.filter((match) => match.status === "done").length}/
            {state.matches.length}
          </strong>
        </div>
      </section>

      <nav className="tabs">
        {[
          ["setup", "Configuração"],
          ["round", "Rodada atual"],
          ["ranking", "Ranking"],
          ["history", "Histórico"]
        ].map(([id, label]) => (
          <button
            key={id}
            className={activeTab === id ? "active" : ""}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "setup" && (
        <main className="grid two">
          <section className="panel">
            <h2>1. Dados do torneio</h2>

            <label>Nome do torneio</label>
            <input
              value={state.tournamentName}
              onChange={(event) =>
                updateState({
                  ...state,
                  tournamentName: event.target.value
                })
              }
            />

            <label>Escola</label>
            <input
              value={state.schoolName}
              onChange={(event) =>
                updateState({
                  ...state,
                  schoolName: event.target.value
                })
              }
              placeholder="Ex: Escola Municipal..."
            />

            <label>Rodadas</label>
            <input
              type="number"
              min="1"
              value={state.totalRounds}
              onChange={(event) =>
                updateState({
                  ...state,
                  totalRounds: Number(event.target.value)
                })
              }
            />

            <div className="score-grid">
              <div>
                <label>Vitória</label>
                <input
                  type="number"
                  step="0.5"
                  value={state.pointsWin}
                  onChange={(event) =>
                    updateState({
                      ...state,
                      pointsWin: Number(event.target.value)
                    })
                  }
                />
              </div>

              <div>
                <label>Empate</label>
                <input
                  type="number"
                  step="0.5"
                  value={state.pointsDraw}
                  onChange={(event) =>
                    updateState({
                      ...state,
                      pointsDraw: Number(event.target.value)
                    })
                  }
                />
              </div>

              <div>
                <label>BYE</label>
                <input
                  type="number"
                  step="0.5"
                  value={state.pointsBye}
                  onChange={(event) =>
                    updateState({
                      ...state,
                      pointsBye: Number(event.target.value)
                    })
                  }
                />
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>2. Alunos</h2>

            <p className="hint">
              Digite um nome por linha e clique em importar.
            </p>

            <textarea
  value={namesText}
  onChange={(event) => setNamesText(event.target.value)}
  placeholder={"Ana Clara\nBruno Silva\nCarlos Eduardo\nDavi\nEduarda"}
  spellCheck="false"
  autoCorrect="off"
  autoCapitalize="words"
/>

            <div className="import-area">
            <button className="primary full" onClick={importPlayers}>
                Importar alunos
            </button>

            <p className="hint import-hint">
                Rodadas sugeridas:{" "}
                {suggestedRounds(
                namesText.split("\n").filter(Boolean).length ||
                    state.players.length
                )}
            </p>
            </div>
          </section>

          <section className="panel wide">
  <h2>3. Mesas e turnos</h2>

  <p className="hint">
    Escolha o turno, a quantidade de mesas e o horário. Para segurança, sempre deve existir pelo menos um turno.
  </p>

  {state.turns.map((turn, index) => (
    <div className="turn-row" key={turn.id}>
      <select
        value={turn.name}
        onChange={(event) =>
          updateTurn(index, "name", event.target.value)
        }
      >
        <option value="Manhã">Manhã</option>
        <option value="Tarde">Tarde</option>
        <option value="Noite">Noite</option>
        <option value="Intervalo">Intervalo</option>
        <option value="Outro dia">Outro dia</option>
        <option value="Turno único">Turno único</option>
      </select>

      <input
        type="number"
        min="1"
        value={turn.tables}
        onChange={(event) =>
          updateTurn(index, "tables", Number(event.target.value))
        }
        placeholder="Mesas"
      />

      <input
        type="time"
        value={turn.time}
        onChange={(event) =>
          updateTurn(index, "time", event.target.value)
        }
      />

      <button
        className="danger"
        disabled={state.turns.length === 1}
        onClick={() =>
          updateState({
            ...state,
            turns: state.turns.filter((_, i) => i !== index)
          })
        }
      >
        Remover
      </button>
    </div>
  ))}

  <button
    className="ghost"
    onClick={() =>
      updateState({
        ...state,
        turns: [
          ...state.turns,
          {
            id: uid("turn"),
            name: "Turno único",
            tables: 1,
            time: "10:00"
          }
        ]
      })
    }
  >
    Adicionar turno
  </button>
</section>
        </main>
      )}

      {activeTab === "round" && (
        <main className="panel">
          <div className="section-head">
            <div>
              <h2>
  Rodada {state.currentRound || "-"} de {state.totalRounds || "-"}
  {state.currentRound === state.totalRounds && state.totalRounds > 0 && (
    <span className="last-round-badge">Última rodada</span>
  )}
</h2>

<p className="hint">Clique no vencedor ou marque empate.</p>
            </div>

            {doneRound && state.currentRound < state.totalRounds && (
  <button className="primary" onClick={generateNextRound}>
    {state.currentRound + 1 === state.totalRounds
      ? "Gerar última rodada"
      : `Gerar rodada ${state.currentRound + 1}`}
  </button>
)}

{doneRound && state.currentRound === state.totalRounds && (
  <div className="finished-badge">
    🏆 Torneio finalizado
  </div>
)}
          </div>

          {roundMatches.length === 0 ? (
            <div className="empty">Nenhuma rodada sorteada ainda.</div>
          ) : (
            <div className="matches">
              {roundMatches.map((match) => (
                <article
                  key={match.id}
                  className={`match ${match.status === "done" ? "done" : ""}`}
                >
                  <div className="match-top">
  <span>
    {match.isTieBreak ? "Desempate" : `Mesa ${match.table}`}
  </span>
                    <small>
                      {match.turnName} {match.time && `• ${match.time}`} •
                      Bloco {match.block}
                    </small>
                  </div>

                  {match.isBye ? (
                    <div className="bye">
                      <strong>
                        <PlayerName id={match.playerA} players={state.players} />
                      </strong>{" "}
                      {match.isTieBreak ? "aguarda próxima partida" : "recebeu BYE"}
                    </div>
                  ) : (
                    <>
                      <div className="versus">
                        <strong>
                          <PlayerName
                            id={match.playerA}
                            players={state.players}
                          />
                        </strong>

                        <span>VS</span>

                        <strong>
                          <PlayerName
                            id={match.playerB}
                            players={state.players}
                          />
                        </strong>
                      </div>

                      <div className="result-buttons">
                        <button
                          onClick={() => setResult(match.id, "A")}
                          disabled={match.status === "done"}
                        >
                          Vitória{" "}
                          <PlayerName
                            id={match.playerA}
                            players={state.players}
                          />
                        </button>

                        {state.allowDraw && !match.isTieBreak && (
  <button
    onClick={() => setResult(match.id, "draw")}
    disabled={match.status === "done"}
  >
    Empate
  </button>
)}

                        <button
                          onClick={() => setResult(match.id, "B")}
                          disabled={match.status === "done"}
                        >
                          Vitória{" "}
                          <PlayerName
                            id={match.playerB}
                            players={state.players}
                          />
                        </button>
                      </div>

                      {match.status === "done" && (
                        <p className="result">
                          Resultado: {match.scoreA} x {match.scoreB}
                        </p>
                      )}
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </main>
      )}

      {activeTab === "ranking" && (
        <main className="panel">
          <h2>
            <Crown size={24} />
            Ranking ChessMVP
          </h2>

          <div className="podium">
            {ranking.slice(0, 3).map((player, index) => (
              <div
                key={player.id}
                className={`podium-card pos-${index + 1}`}
              >
                <span>{index + 1}º</span>
                <strong>{player.name}</strong>
                <em>{player.points} pts</em>
              </div>
            ))}
          </div>

          {technicalTieGroups.length > 0 && (
  <div className="tie-break-panel">
    <h3>⚔️ Empate técnico detectado</h3>

    <p>
      Alguns jogadores continuam empatados nos critérios principais.
      Você pode criar uma partida extra para desempatar.
    </p>

    {technicalTieGroups.map((group, index) => (
      <div className="tie-group" key={index}>
        <strong>
          Grupo empatado: {group.map((player) => player.name).join(", ")}
        </strong>

        <button
          className="primary"
          onClick={() => generateTieBreakRound(group)}
        >
          Criar partida extra de desempate
        </button>
      </div>
    ))}
  </div>
)}

          <div className="ranking-list">
            {ranking.map((player, index) => (
              <div key={player.id} className="rank-row">
                <strong>{index + 1}º</strong>
                <span>{player.name}</span>
                <span>{player.points} pts</span>
                <small>
  {player.wins}V • {player.draws}E • {player.losses}D
  <br />
  FA {getOpponentStrength(player, state.players)} • Desempate {player.tieBreakWins || 0}
</small>
              </div>
            ))}
          </div>
        </main>
      )}

      {activeTab === "history" && (
        <main className="panel">
          <h2>Histórico por rodada</h2>

          <div className="table">
            <div className="table-row head">
              <span>Rodada</span>
              <span>Mesa</span>
              <span>Turno</span>
              <span>Partida</span>
              <span>Resultado</span>
            </div>

            {state.matches.map((match) => (
              <div className="table-row" key={match.id}>
                <span>{match.round}</span>
                <span>{match.table}</span>
                <span>{match.turnName}</span>
                <span>
                  <PlayerName id={match.playerA} players={state.players} />
                  {match.playerB ? " vs " : " "}
                  <PlayerName id={match.playerB} players={state.players} />
                </span>
                <span>
                  {match.status === "done"
                    ? `${match.scoreA} x ${match.scoreB}`
                    : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}

export default ChessTournament;