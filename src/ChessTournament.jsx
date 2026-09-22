import React, { useEffect, useMemo, useState } from "react";
import TournamentRules from "./TournamentRules.jsx";
import {
  Trophy,
  Shuffle,
  Users,
  Clock,
  Swords,
  RotateCcw,
  Crown,
  ArrowLeft,
  Download,
  Upload
} from "lucide-react";

const STORAGE_KEY = "chessmvp-v7-fixed-block-nav-sound";

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  return audioContext;
}

function playTone({ frequency = 440, duration = 0.08, type = "square", volume = 0.045 }) {
  try {
    const context = getAudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  } catch {
    // Alguns navegadores bloqueiam áudio antes do primeiro clique. Ignora silenciosamente.
  }
}

function playClickSound() {
  playTone({ frequency: 520, duration: 0.06, type: "square", volume: 0.035 });
}

function playTabSound() {
  playTone({ frequency: 360, duration: 0.055, type: "sine", volume: 0.04 });
  setTimeout(() => playTone({ frequency: 500, duration: 0.055, type: "sine", volume: 0.04 }), 55);
}

function playMenuSound() {
  playTone({ frequency: 420, duration: 0.07, type: "triangle", volume: 0.045 });
  setTimeout(() => playTone({ frequency: 620, duration: 0.09, type: "triangle", volume: 0.045 }), 70);
}

function playWinSound() {
  playTone({ frequency: 523, duration: 0.08, type: "square", volume: 0.055 });
  setTimeout(() => playTone({ frequency: 659, duration: 0.08, type: "square", volume: 0.055 }), 85);
  setTimeout(() => playTone({ frequency: 784, duration: 0.14, type: "square", volume: 0.055 }), 170);
}

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

  tournamentMode: "mixed", // points, knockout ou mixed
  phase: "knockout", // points, knockout ou finished
  mixedFinalists: 8,

  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  pointsBye: 2,
  allowDraw: true,

  players: [],
  matches: [],

  turns: [
    {
      id: uid("turn"),
      name: "Tarde",
      tables: 4,
      time: "13:10",
      blockDurationMinutes: 20
    }
  ]
};

function normalizeState(state) {
  const normalized = {
    ...defaultState,
    ...state
  };

  return {
    ...normalized,
    turns:
      normalized.turns && normalized.turns.length > 0
        ? normalized.turns.map((turn) => ({
            id: turn.id || uid("turn"),
            name: turn.name || "Tarde",
            tables: Number(turn.tables || 4),
            time: turn.time || "13:10",
            blockDurationMinutes: Number(turn.blockDurationMinutes || 20)
          }))
        : defaultState.turns,
    players: (normalized.players || []).map((player) => ({
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      tieBreakWins: 0,
      knockoutWins: 0,
      hadBye: false,
      eliminated: false,
      opponents: [],
      ...player
    })),
    matches: (normalized.matches || []).map((match) => ({
      stage: "points",
      block: 1,
      globalBlock: match.block || 1,
      ...match
    }))
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultState;
    }

    return normalizeState(JSON.parse(raw));
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

function addMinutesToTime(time, minutesToAdd) {
  if (!time) return "";

  const [hours, minutes] = String(time).split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0);
  date.setMinutes((minutes || 0) + Number(minutesToAdd || 0));
  date.setSeconds(0);

  return date.toTimeString().slice(0, 5);
}

function getScheduleConfig(turns) {
  const firstTurn =
    turns && turns.length > 0
      ? turns[0]
      : {
          id: uid("turn"),
          name: "Turno único",
          tables: 1,
          time: "08:00",
          blockDurationMinutes: 20
        };

  return {
    id: firstTurn.id || uid("turn"),
    name: firstTurn.name || "Turno único",
    tables: Math.max(Number(firstTurn.tables || 1), 1),
    time: firstTurn.time || "08:00",
    blockDurationMinutes: Math.max(Number(firstTurn.blockDurationMinutes || 20), 1)
  };
}

function getPreviousGlobalBlocksCount(existingMatches) {
  if (!existingMatches || existingMatches.length === 0) return 0;

  const maxGlobalBlock = Math.max(
    0,
    ...existingMatches.map((match) => Number(match.globalBlock || 0))
  );

  if (maxGlobalBlock > 0) return maxGlobalBlock;

  const roundBlocks = new Set(
    existingMatches.map((match) => `${match.round || 0}-${match.block || 1}`)
  );

  return roundBlocks.size;
}

function assignSlots(matches, turns, existingMatches = []) {
  const schedule = getScheduleConfig(turns);
  const previousGlobalBlocks = getPreviousGlobalBlocksCount(existingMatches);

  return matches.map((match, index) => {
    const localBlock = Math.floor(index / schedule.tables) + 1;
    const globalBlock = previousGlobalBlocks + localBlock;
    const table = (index % schedule.tables) + 1;
    const blockTime = addMinutesToTime(
      schedule.time,
      (globalBlock - 1) * schedule.blockDurationMinutes
    );

    return {
      ...match,
      table,
      turnName: schedule.name,
      time: blockTime,
      block: localBlock,
      globalBlock,
      blockDurationMinutes: schedule.blockDurationMinutes
    };
  });
}

function getActivePlayers(state) {
  if (state.tournamentMode === "points") {
    return state.players;
  }

  return state.players.filter((player) => !player.eliminated);
}

function isCurrentRoundDone(state) {
  const roundMatches = state.matches.filter(
    (match) => match.round === state.currentRound
  );

  if (roundMatches.length === 0) return true;

  return roundMatches.every((match) => match.status === "done");
}

function getTournamentFormatLabel(state) {
  if (state.phase === "finished") return "Finalizado";
  if (state.tournamentMode === "points") return "Pontos";
  if (state.tournamentMode === "knockout") return "Eliminação";
  if (state.tournamentMode === "mixed" && state.phase === "knockout") return "Misto: eliminação";
  if (state.tournamentMode === "mixed" && state.phase === "points") return "Misto: pontos";
  return "Torneio";
}

function getPhaseDetails(state) {
  if (state.phase === "finished") {
    return {
      title: "Torneio finalizado",
      description: "Todas as partidas previstas foram concluídas.",
      badge: "Finalizado"
    };
  }

  if (state.tournamentMode === "points") {
    return {
      title: "Formato: pontos corridos / rodadas",
      description: "Todos continuam no torneio. Vitória, empate e BYE somam pontos no ranking.",
      badge: "Pontos"
    };
  }

  if (state.tournamentMode === "knockout") {
    return {
      title: "Formato: eliminação",
      description: "Quem perde sai. Nessa fase não existe empate; escolha sempre um vencedor.",
      badge: "Eliminação"
    };
  }

  if (state.tournamentMode === "mixed" && state.phase === "knockout") {
    return {
      title: "Fase atual: eliminação",
      description: `O torneio está reduzindo participantes até sobrarem ${state.mixedFinalists} finalistas. Nessa fase não há empate.`,
      badge: "Misto • eliminação"
    };
  }

  if (state.tournamentMode === "mixed" && state.phase === "points") {
    return {
      title: "Fase atual: final por pontos",
      description: "Agora apenas os finalistas jogam por pontos. O empate volta a valer normalmente.",
      badge: "Misto • pontos"
    };
  }

  return {
    title: "Formato do torneio",
    description: "Configure o formato antes de iniciar.",
    badge: "Torneio"
  };
}

function createRound(state) {
  const roundNumber = state.currentRound + 1;

  let players =
    state.tournamentMode === "mixed" && state.phase === "points"
      ? state.players.filter((player) => !player.eliminated).map((player) => ({ ...player }))
      : state.players.map((player) => ({ ...player }));

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
    const eligible = [...players].reverse().find((player) => !player.hadBye) || players[players.length - 1];
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
      if (!byPoints.has(key)) byPoints.set(key, []);
      byPoints.get(key).push(player);
    }

    [...byPoints.keys()]
      .map(Number)
      .sort((a, b) => b - a)
      .forEach((points) => groups.push(shuffle(byPoints.get(String(points)))));
  }

  const pool = [];
  groups.forEach((group) => pool.push(...group));

  const pairings = [];

  while (pool.length > 1) {
    const playerA = pool.shift();
    let opponentIndex = pool.findIndex((player) => !hasPlayed(playerA, player, state.matches));
    if (opponentIndex === -1) opponentIndex = 0;
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
      isBye: false,
      stage: "points"
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
      isBye: true,
      stage: "points"
    });
  }

  return assignSlots(pairings, state.turns, state.matches);
}

function createKnockoutRound(state) {
  const roundNumber = state.currentRound + 1;
  let players = shuffle(getActivePlayers(state).map((player) => ({ ...player })));
  let byePlayer = null;

  if (players.length % 2 === 1) {
    byePlayer = players[players.length - 1];
    players = players.filter((player) => player.id !== byePlayer.id);
  }

  const pairings = [];

  while (players.length > 1) {
    const playerA = players.shift();
    const playerB = players.shift();

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
      stage: "knockout"
    });
  }

  if (byePlayer) {
    pairings.push({
      id: uid("match"),
      round: roundNumber,
      playerA: byePlayer.id,
      playerB: null,
      scoreA: 0,
      scoreB: 0,
      result: "bye",
      status: "done",
      isBye: true,
      stage: "knockout"
    });
  }

  return assignSlots(pairings, state.turns, state.matches);
}

function recalculatePlayers(players, matches, config) {
  const resetPlayers = players.map((player) => ({
    ...player,
    points: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    tieBreakWins: 0,
    knockoutWins: 0,
    hadBye: false,
    eliminated: false,
    opponents: []
  }));

  const map = new Map(resetPlayers.map((player) => [player.id, player]));

  matches.forEach((match) => {
    if (match.status !== "done") return;

    const playerA = map.get(match.playerA);
    const playerB = match.playerB ? map.get(match.playerB) : null;

    if (!playerA) return;

    if (match.stage === "knockout") {
      if (match.isBye || match.result === "bye") return;
      if (!playerB) return;

      playerA.opponents.push(playerB.id);
      playerB.opponents.push(playerA.id);

      if (match.scoreA > match.scoreB) {
        playerA.wins += 1;
        playerA.knockoutWins += 1;
        playerB.losses += 1;
        playerB.eliminated = true;
      } else if (match.scoreB > match.scoreA) {
        playerB.wins += 1;
        playerB.knockoutWins += 1;
        playerA.losses += 1;
        playerA.eliminated = true;
      }

      return;
    }

    if (match.isTieBreak) {
      if (!playerB) return;

      if (match.scoreA > match.scoreB) playerA.tieBreakWins += 1;
      else if (match.scoreB > match.scoreA) playerB.tieBreakWins += 1;

      return;
    }

    if (match.isBye || match.result === "bye") {
      playerA.points += Number(config.pointsBye || 0);
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
  if (!player) return <>BYE</>;
  return <>{player.name}</>;
}

function getOpponentStrength(player, allPlayers) {
  if (!player.opponents || player.opponents.length === 0) return 0;

  return player.opponents.reduce((total, opponentId) => {
    const opponent = allPlayers.find((item) => item.id === opponentId);
    return total + Number(opponent?.points || 0);
  }, 0);
}

function getTieKey(player, allPlayers) {
  const strength = getOpponentStrength(player, allPlayers);
  return [player.points, player.wins, strength, player.losses, player.tieBreakWins || 0].join("-");
}

function getTechnicalTieGroups(players) {
  const groups = new Map();

  players
    .filter((player) => !player.eliminated)
    .forEach((player) => {
      const key = getTieKey(player, players);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(player);
    });

  return [...groups.values()].filter((group) => group.length > 1);
}

function groupMatchesByBlock(matches) {
  const groups = new Map();

  matches.forEach((match) => {
    const key = Number(match.block || 1);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(match);
  });

  return [...groups.entries()]
    .sort(([blockA], [blockB]) => blockA - blockB)
    .map(([block, blockMatches]) => {
      const sortedMatches = [...blockMatches].sort((a, b) => {
        if (Number(a.table || 0) !== Number(b.table || 0)) {
          return Number(a.table || 0) - Number(b.table || 0);
        }
        return a.id.localeCompare(b.id);
      });

      const regularMatches = sortedMatches.filter((match) => !match.isBye);
      const byes = sortedMatches.filter((match) => match.isBye || match.result === "bye");
      const tablesUsed = [
        ...new Set(regularMatches.map((match) => Number(match.table || 0)))
      ]
        .filter(Boolean)
        .sort((a, b) => a - b);

      return {
        block,
        globalBlock: Number(sortedMatches[0]?.globalBlock || block),
        matches: sortedMatches,
        regularMatches,
        byes,
        tablesUsed,
        turnName: sortedMatches[0]?.turnName || "Turno",
        time: sortedMatches[0]?.time || "",
        done: sortedMatches.every((match) => match.status === "done")
      };
    });
}

function getTotalBlocksForMatches(totalMatches, tables) {
  if (!totalMatches || !tables) return 0;
  return Math.ceil(totalMatches / Math.max(Number(tables || 1), 1));
}

function getRoundLabel(state, roundMatches) {
  if (roundMatches.length === 0) {
    if (state.tournamentMode === "points") return "Rodada atual";
    if (state.tournamentMode === "mixed" && state.phase === "points") return "Final por pontos";
    return "Eliminatória";
  }

  const hasKnockout = roundMatches.some((match) => match.stage === "knockout");

  if (hasKnockout) return `Eliminatória ${state.currentRound}`;
  if (state.tournamentMode === "mixed" && state.phase === "points") {
    return `Final por pontos • Rodada ${state.currentRound}`;
  }

  return `Rodada ${state.currentRound}`;
}

function getRoundSummary(state, roundMatches, totalTables) {
  const regularMatches = roundMatches.filter((match) => !match.isBye);
  const byes = roundMatches.filter((match) => match.isBye || match.result === "bye");
  const blocks = getTotalBlocksForMatches(regularMatches.length, totalTables);
  const hasKnockout = roundMatches.some((match) => match.stage === "knockout");
  const stageLabel = hasKnockout ? "Eliminação" : "Pontos";

  if (roundMatches.length === 0) {
    return {
      stageLabel,
      regularMatches: 0,
      byes: 0,
      blocks: 0,
      description: "Nenhuma rodada foi sorteada ainda. Configure o torneio e clique no botão para iniciar."
    };
  }

  if (hasKnockout) {
    return {
      stageLabel,
      regularMatches: regularMatches.length,
      byes: byes.length,
      blocks,
      description: `Esta eliminatória tem ${regularMatches.length} partida${regularMatches.length === 1 ? "" : "s"}, organizada${regularMatches.length === 1 ? "" : "s"} em ${blocks} bloco${blocks === 1 ? "" : "s"} com até ${totalTables} mesa${totalTables === 1 ? "" : "s"} por bloco. Nessa fase não há empate.`
    };
  }

  return {
    stageLabel,
    regularMatches: regularMatches.length,
    byes: byes.length,
    blocks,
    description: `Esta rodada tem ${regularMatches.length} partida${regularMatches.length === 1 ? "" : "s"}, organizada${regularMatches.length === 1 ? "" : "s"} em ${blocks} bloco${blocks === 1 ? "" : "s"} com até ${totalTables} mesa${totalTables === 1 ? "" : "s"} por bloco.`
  };
}

function getMatchWinnerId(match) {
  if (match.status !== "done" || match.isBye) return null;
  if (Number(match.scoreA) > Number(match.scoreB)) return match.playerA;
  if (Number(match.scoreB) > Number(match.scoreA)) return match.playerB;
  return null;
}

function ChessTournament({ onBack }) {
  const [state, setState] = useState(loadState);
  const [namesText, setNamesText] = useState("");
  const [activeTab, setActiveTab] = useState("setup");
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(0);
  const [activeBlock, setActiveBlock] = useState(1);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    setActiveBlock(1);
  }, [state.currentRound]);

  const roundMatches = state.matches.filter((match) => match.round === state.currentRound);
  const doneRound = roundMatches.length > 0 && roundMatches.every((match) => match.status === "done");
  const activePlayers = getActivePlayers(state);
  const schedule = getScheduleConfig(state.turns);
  const totalTables = schedule.tables;

  const tournamentFinished =
    state.phase === "finished" ||
    (state.tournamentMode === "knockout" && state.currentRound > 0 && activePlayers.length <= 1 && doneRound) ||
    ((state.tournamentMode === "points" || (state.tournamentMode === "mixed" && state.phase === "points")) &&
      state.totalRounds > 0 &&
      state.currentRound >= state.totalRounds &&
      doneRound);

  const phaseDetails = getPhaseDetails(state);

  const ranking = useMemo(() => {
    return [...state.players].sort((a, b) => {
      if (state.tournamentMode !== "points") {
        if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
      }

      const strengthA = getOpponentStrength(a, state.players);
      const strengthB = getOpponentStrength(b, state.players);

      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if ((b.knockoutWins || 0) !== (a.knockoutWins || 0)) return (b.knockoutWins || 0) - (a.knockoutWins || 0);
      if (strengthB !== strengthA) return strengthB - strengthA;
      if ((b.tieBreakWins || 0) !== (a.tieBreakWins || 0)) return (b.tieBreakWins || 0) - (a.tieBreakWins || 0);
      if (a.losses !== b.losses) return a.losses - b.losses;
      return a.name.localeCompare(b.name);
    });
  }, [state.players, state.tournamentMode]);

  const technicalTieGroups = useMemo(() => {
    if (!tournamentFinished) return [];
    return getTechnicalTieGroups(state.players);
  }, [state.players, tournamentFinished]);

  const roundBlocks = useMemo(() => groupMatchesByBlock(roundMatches), [roundMatches]);
  const selectedBlock =
  roundBlocks[selectedBlockIndex] || roundBlocks[0] || null;

  useEffect(() => {
    if (roundBlocks.length > 0 && !roundBlocks.some((block) => block.block === activeBlock)) {
      setActiveBlock(roundBlocks[0].block);
    }
  }, [roundBlocks, activeBlock]);

  const roundSummary = useMemo(
    () => getRoundSummary(state, roundMatches, totalTables),
    [state, roundMatches, totalTables]
  );

  useEffect(() => {
  setSelectedBlockIndex(0);
}, [state.currentRound]);


  const currentRoundLabel = getRoundLabel(state, roundMatches);

  function updateState(next) {
    setState((previous) => {
      if (typeof next === "function") return next(previous);
      return next;
    });
  }

  function handleAppClick(event) {
    const clickedControl = event.target.closest("button, label.import-file-button");
    if (!clickedControl) return;
    if (clickedControl.dataset.soundHandled === "true") return;
    playClickSound();
  }

  function importPlayers() {
    const names = namesText.split("\n").map((name) => name.trim()).filter(Boolean);

    const players = names.map((name) => ({
      id: uid("player"),
      name,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      tieBreakWins: 0,
      knockoutWins: 0,
      hadBye: false,
      eliminated: false,
      opponents: []
    }));

    updateState((previous) => {
      const initialPhase = previous.tournamentMode === "points" ? "points" : "knockout";

      return {
        ...previous,
        players,
        matches: [],
        currentRound: 0,
        phase: initialPhase,
        totalRounds: previous.tournamentMode === "points" ? suggestedRounds(players.length) : 0
      };
    });

    setActiveTab("setup");
  }

  function generateNextRound() {
    playMenuSound();

    updateState((previous) => {
      if (previous.players.length < 2) return previous;
      if (!isCurrentRoundDone(previous)) return previous;

      const safeTurns = previous.turns.length > 0 ? previous.turns : defaultState.turns;
      let nextState = { ...previous, turns: safeTurns };
      const currentActivePlayers = getActivePlayers(nextState);

      if (nextState.tournamentMode === "points") {
        if (nextState.currentRound >= nextState.totalRounds) return { ...nextState, phase: "finished" };
        const newMatches = createRound(nextState);

        return {
          ...nextState,
          phase: "points",
          currentRound: previous.currentRound + 1,
          matches: [...previous.matches, ...newMatches]
        };
      }

      if (nextState.tournamentMode === "knockout") {
        if (currentActivePlayers.length <= 1) return { ...nextState, phase: "finished" };
        const newMatches = createKnockoutRound(nextState);

        return {
          ...nextState,
          phase: "knockout",
          currentRound: previous.currentRound + 1,
          matches: [...previous.matches, ...newMatches]
        };
      }

      if (nextState.tournamentMode === "mixed") {
        if (nextState.phase === "knockout") {
          if (currentActivePlayers.length <= Number(nextState.mixedFinalists)) {
            const extraRounds = suggestedRounds(currentActivePlayers.length);
            const stateForPoints = {
              ...nextState,
              phase: "points",
              totalRounds: previous.currentRound + extraRounds
            };

            if (extraRounds === 0) return { ...stateForPoints, phase: "finished" };
            const newMatches = createRound(stateForPoints);

            return {
              ...stateForPoints,
              currentRound: previous.currentRound + 1,
              matches: [...previous.matches, ...newMatches]
            };
          }

          const newMatches = createKnockoutRound(nextState);

          return {
            ...nextState,
            phase: "knockout",
            currentRound: previous.currentRound + 1,
            matches: [...previous.matches, ...newMatches]
          };
        }

        if (nextState.phase === "points") {
          if (nextState.currentRound >= nextState.totalRounds) return { ...nextState, phase: "finished" };
          const newMatches = createRound(nextState);

          return {
            ...nextState,
            currentRound: previous.currentRound + 1,
            matches: [...previous.matches, ...newMatches]
          };
        }
      }

      return nextState;
    });

    setActiveTab("round");
  }

  function setResult(matchId, type) {
    if (type === "A" || type === "B") playWinSound();
    else playTabSound();

    updateState((previous) => {
      const updatedMatches = previous.matches.map((match) => {
        if (match.id !== matchId) return match;
        if (match.stage === "knockout" && type === "draw") {
          alert("Em fase eliminatória não pode haver empate. Escolha um vencedor.");
          return match;
        }

        const winScore = match.stage === "knockout" ? 1 : previous.pointsWin;
        const lossScore = match.stage === "knockout" ? 0 : previous.pointsLoss;

        if (type === "A") {
          return {
            ...match,
            scoreA: winScore,
            scoreB: lossScore,
            result: "A",
            status: "done"
          };
        }

        if (type === "B") {
          return {
            ...match,
            scoreA: lossScore,
            scoreB: winScore,
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

      const updatedPlayers = recalculatePlayers(previous.players, updatedMatches, previous);

      return {
        ...previous,
        matches: updatedMatches,
        players: updatedPlayers
      };
    });
  }

  function resetTournament() {
    const confirmReset = confirm("Tem certeza que deseja apagar o torneio atual?");
    if (!confirmReset) return;

    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
    setNamesText("");
    setActiveTab("setup");
    setActiveBlock(1);
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

    const confirmImport = confirm("Importar este arquivo vai substituir o torneio atual. Deseja continuar?");

    if (!confirmImport) {
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const importedState = JSON.parse(reader.result);
        setState(normalizeState(importedState));
        setActiveTab("setup");
        setActiveBlock(1);
        alert("Torneio importado com sucesso!");
      } catch {
        alert("Arquivo inválido. Selecione um arquivo JSON exportado pelo ChessMVP.");
      }

      event.target.value = "";
    };

    reader.readAsText(file);
  }

  function resetCompetitiveDataForMode(mode) {
    return {
      tournamentMode: mode,
      phase: mode === "points" ? "points" : "knockout",
      matches: [],
      currentRound: 0,
      players: state.players.map((player) => ({
        ...player,
        points: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        tieBreakWins: 0,
        knockoutWins: 0,
        hadBye: false,
        eliminated: false,
        opponents: []
      })),
      totalRounds: mode === "points" ? suggestedRounds(state.players.length) : 0
    };
  }

  function generateTieBreakRound(tiedPlayers) {
    playMenuSound();

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
          isTieBreak: true,
          stage: "points"
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
          isTieBreak: true,
          stage: "points"
        });
      }

      const matchesWithSlots = assignSlots(pairings, previous.turns, previous.matches);

      return {
        ...previous,
        currentRound: roundNumber,
        totalRounds: roundNumber,
        matches: [...previous.matches, ...matchesWithSlots]
      };
    });

    setActiveTab("round");
  }

  const nextRoundButtonText = tournamentFinished
    ? "Torneio finalizado"
    : state.currentRound === 0
    ? state.tournamentMode === "points"
      ? "Sortear Rodada 1"
      : "Iniciar eliminação"
    : state.tournamentMode === "mixed" && state.phase === "knockout"
    ? "Gerar próxima eliminatória"
    : state.tournamentMode === "mixed" && state.phase === "points"
    ? "Gerar rodada da final"
    : state.tournamentMode === "knockout"
    ? "Gerar próxima eliminatória"
    : state.currentRound + 1 === state.totalRounds
    ? "Gerar última rodada"
    : "Gerar próxima rodada";

  const champion = ranking.find((player) => !player.eliminated) || ranking[0];
  const canGoPreviousBlock = selectedBlock && selectedBlock.block > 1;
  const canGoNextBlock = selectedBlock && selectedBlock.block < roundBlocks.length;

  return (
    <div className="app chess-theme" onClickCapture={handleAppClick}>
      <div className="bg-board"></div>

      <header className="hero">
        <div>
          <p className="eyebrow">Torneio escolar de xadrez</p>
          <h1 className="title-with-icon">
            <span className="title-emoji">♟</span>
            {state.tournamentName}
          </h1>
          <p className="subtitle">{state.schoolName || "Painel de controle do torneio"}</p>
        </div>

        <div className="hero-actions">
          <button
            className="ghost"
            data-sound-handled="true"
            onClick={() => {
              playMenuSound();
              onBack();
            }}
          >
            <ArrowLeft size={18} />
            Menu
          </button>

          <button className="ghost" onClick={resetTournament}>
            <RotateCcw size={18} />
            Reiniciar
          </button>

          <button className="ghost" onClick={exportTournament}>
            <Download size={18} />
            Exportar
          </button>

          <label className="ghost import-file-button">
            <Upload size={18} />
            Importar
            <input type="file" accept="application/json" onChange={importTournament} hidden />
          </label>

          <button
            className="primary"
            data-sound-handled="true"
            onClick={generateNextRound}
            disabled={state.players.length < 2 || !isCurrentRoundDone(state) || tournamentFinished}
          >
            <Shuffle size={18} />
            {nextRoundButtonText}
          </button>
        </div>
      </header>

      <section className="stats">
        <div className="stat">
          <Users />
          <span>Jogadores ativos</span>
          <strong>{activePlayers.length}</strong>
        </div>

        <div className="stat">
          <Swords />
          <span>{getTournamentFormatLabel(state)}</span>
          <strong>{state.currentRound}/{state.totalRounds || "-"}</strong>
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
            {state.matches.filter((match) => match.status === "done").length}/{state.matches.length}
          </strong>
        </div>
      </section>

      <section className="phase-panel">
        <div>
          <strong>{phaseDetails.title}</strong>
          <p>{phaseDetails.description}</p>
        </div>
        <span>{phaseDetails.badge}</span>
      </section>

      <nav className="tabs">
        {[
          ["setup", "Configuração"],
          ["round", "Rodada atual"],
          ["ranking", "Ranking"],
          ["history", "Histórico"],
          ["rules", "Regras"]
        ].map(([id, label]) => (
          <button
            key={id}
            data-sound-handled="true"
            className={activeTab === id ? "active" : ""}
            onClick={() => {
              playTabSound();
              setActiveTab(id);
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "rules" && <TournamentRules tournament="chess" />}

      {activeTab === "setup" && (
        <main className="grid two">
          <section className="panel">
            <h2>1. Dados do torneio</h2>

            <label>Nome do torneio</label>
            <input
              value={state.tournamentName}
              onChange={(event) => updateState({ ...state, tournamentName: event.target.value })}
            />

            <label>Escola</label>
            <input
              value={state.schoolName}
              onChange={(event) => updateState({ ...state, schoolName: event.target.value })}
              placeholder="Ex: Escola Municipal..."
            />

            <label>Formato do torneio</label>
            <select
              value={state.tournamentMode}
              onChange={(event) => {
                const mode = event.target.value;
                updateState({
                  ...state,
                  ...resetCompetitiveDataForMode(mode)
                });
              }}
            >
              <option value="points">Pontos corridos / rodadas</option>
              <option value="knockout">Eliminação</option>
              <option value="mixed">Misto: eliminação + pontos</option>
            </select>

            {state.tournamentMode === "mixed" && (
              <>
                <label>Quantidade de finalistas</label>
                <input
                  type="number"
                  min="2"
                  value={state.mixedFinalists}
                  onChange={(event) => updateState({ ...state, mixedFinalists: Number(event.target.value) })}
                />
                <p className="hint">Exemplo: eliminação até sobrarem 8 alunos. Depois esses finalistas jogam por pontos.</p>
              </>
            )}

            {state.tournamentMode === "points" && (
              <>
                <label>Rodadas</label>
                <input
                  type="number"
                  min="1"
                  value={state.totalRounds}
                  onChange={(event) => updateState({ ...state, totalRounds: Number(event.target.value) })}
                />
              </>
            )}

            <div className="score-grid">
              <div>
                <label>Vitória</label>
                <input
                  type="number"
                  step="0.5"
                  value={state.pointsWin}
                  onChange={(event) => updateState({ ...state, pointsWin: Number(event.target.value) })}
                />
              </div>

              <div>
                <label>Empate</label>
                <input
                  type="number"
                  step="0.5"
                  value={state.pointsDraw}
                  onChange={(event) => updateState({ ...state, pointsDraw: Number(event.target.value) })}
                />
              </div>

              <div>
                <label>BYE</label>
                <input
                  type="number"
                  step="0.5"
                  value={state.pointsBye}
                  onChange={(event) => updateState({ ...state, pointsBye: Number(event.target.value) })}
                />
              </div>
            </div>

            <p className="hint" style={{ marginTop: 12 }}>
              Sugestão atual: vitória = 3 pts, empate = 1 pt e BYE = 2 pts. Na eliminação, o BYE apenas avança o aluno.
            </p>
          </section>

          <section className="panel">
            <h2>2. Alunos</h2>

            <p className="hint">Digite um nome por linha e clique em importar.</p>

            <textarea
              value={namesText}
              onChange={(event) => setNamesText(event.target.value)}
              placeholder={"Ana Clara\nBruno Silva\nCarlos Eduardo\nDavi\nEduarda"}
              spellCheck="false"
              autoCorrect="off"
              autoCapitalize="words"
            />

            <div className="import-area">
              <button className="primary full" onClick={importPlayers}>Importar alunos</button>
              <p className="hint import-hint">
                Rodadas sugeridas, se for por pontos: {suggestedRounds(namesText.split("\n").filter(Boolean).length || state.players.length)}
              </p>
            </div>
          </section>

          <section className="panel wide">
            <h2>3. Organização automática dos blocos</h2>

            <p className="hint">
              Informe o turno, a quantidade de mesas, o horário inicial e a duração de cada bloco. O sistema divide as partidas automaticamente.
            </p>

            <div className="turn-row">
              <select
                value={state.turns[0]?.name || "Tarde"}
                onChange={(event) =>
                  updateState({
                    ...state,
                    turns: [
                      {
                        ...(state.turns[0] || {}),
                        id: state.turns[0]?.id || uid("turn"),
                        name: event.target.value
                      }
                    ]
                  })
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
                value={state.turns[0]?.tables || 4}
                onChange={(event) =>
                  updateState({
                    ...state,
                    turns: [
                      {
                        ...(state.turns[0] || {}),
                        id: state.turns[0]?.id || uid("turn"),
                        tables: Number(event.target.value)
                      }
                    ]
                  })
                }
                placeholder="Mesas"
              />

              <input
                type="time"
                value={state.turns[0]?.time || "13:10"}
                onChange={(event) =>
                  updateState({
                    ...state,
                    turns: [
                      {
                        ...(state.turns[0] || {}),
                        id: state.turns[0]?.id || uid("turn"),
                        time: event.target.value
                      }
                    ]
                  })
                }
              />

              <input
                type="number"
                min="1"
                value={state.turns[0]?.blockDurationMinutes || 20}
                onChange={(event) =>
                  updateState({
                    ...state,
                    turns: [
                      {
                        ...(state.turns[0] || {}),
                        id: state.turns[0]?.id || uid("turn"),
                        blockDurationMinutes: Number(event.target.value)
                      }
                    ]
                  })
                }
                placeholder="Minutos por bloco"
              />
            </div>

            <p className="hint import-hint">
              Com {totalTables} mesas, início às {schedule.time} e blocos de {schedule.blockDurationMinutes} min, o app calcula os horários em sequência para todas as eliminatórias e rodadas.
            </p>
          </section>
        </main>
      )}

      {activeTab === "round" && (
        <main className="panel">
          <div className="section-head">
            <div>
              <h2>
                {currentRoundLabel}
                <span className="last-round-badge">{phaseDetails.badge}</span>
              </h2>
              <p className="hint">{roundSummary.description}</p>
            </div>

            {doneRound && !tournamentFinished && roundMatches.length > 0 && (
              <button className="primary" data-sound-handled="true" onClick={generateNextRound}>
                {nextRoundButtonText}
              </button>
            )}

            {tournamentFinished && <div className="finished-badge">🏆 Torneio finalizado</div>}
          </div>

          {roundMatches.length === 0 ? (
            <div className="empty">Nenhuma rodada sorteada ainda.</div>
          ) : (
            <>
              <section className="stats" style={{ marginTop: 16 }}>
                <div className="stat" style={{ minHeight: 92 }}>
                  <Swords />
                  <span>Fase</span>
                  <strong>{roundSummary.stageLabel}</strong>
                </div>

                <div className="stat" style={{ minHeight: 92 }}>
                  <Trophy />
                  <span>Partidas</span>
                  <strong>{roundSummary.regularMatches}</strong>
                </div>

                <div className="stat" style={{ minHeight: 92 }}>
                  <Clock />
                  <span>Blocos</span>
                  <strong>{roundSummary.blocks}</strong>
                </div>

                <div className="stat" style={{ minHeight: 92 }}>
                  <Users />
                  <span>BYE</span>
                  <strong>{roundSummary.byes}</strong>
                </div>
              </section>

              <div className="block-stepper">
  <button
    className="block-arrow"
    onClick={() => {
      playTabSound();
      setSelectedBlockIndex((value) => Math.max(value - 1, 0));
    }}
    disabled={selectedBlockIndex === 0}
    title="Bloco anterior"
  >
    ‹
  </button>

  <div className="block-current">
    Bloco {roundBlocks[selectedBlockIndex]?.block || 1}
  </div>

  <button
    className="block-arrow"
    onClick={() => {
      playTabSound();
      setSelectedBlockIndex((value) =>
        Math.min(value + 1, roundBlocks.length - 1)
      );
    }}
    disabled={selectedBlockIndex === roundBlocks.length - 1}
    title="Próximo bloco"
  >
    ›
  </button>
</div>

              {selectedBlock && (
                <section className="round-block" style={{ marginTop: 20 }}>
                  <div className="block-head">
                    <div>
                      <h3>
                        Bloco {selectedBlock.block}
                        <span className={selectedBlock.done ? "block-done" : "block-active"}>
                          {selectedBlock.done ? "Concluído" : "Em andamento"}
                        </span>
                      </h3>

                      <p className="hint">
                        {selectedBlock.turnName || "Turno"} {selectedBlock.time && `• ${selectedBlock.time}`} • {selectedBlock.regularMatches.length} partida{selectedBlock.regularMatches.length === 1 ? "" : "s"}
                        {selectedBlock.byes.length ? ` • ${selectedBlock.byes.length} BYE` : ""} • Bloco geral {selectedBlock.globalBlock}
                      </p>
                    </div>

                    <div className="block-tables">
                      Mesas deste bloco: {selectedBlock.tablesUsed.length > 0 ? selectedBlock.tablesUsed.join(", ") : "BYE"}
                    </div>
                  </div>

                  <div className="matches">
                    {selectedBlock.matches.map((match) => {
                      const winnerId = getMatchWinnerId(match);
                      const winnerName = winnerId ? state.players.find((player) => player.id === winnerId)?.name : "";

                      return (
                        <article
                          key={match.id}
                          className={`match ${match.status === "done" ? "done" : ""} ${winnerId === match.playerA ? "winner-a" : ""} ${winnerId === match.playerB ? "winner-b" : ""}`}
                        >
                          <div className="match-top">
                            <span>
                              {match.isTieBreak
                                ? "Desempate"
                                : match.stage === "knockout"
                                ? `Eliminatória • Mesa ${match.table}`
                                : `Mesa ${match.table}`}
                            </span>

                            <small>
                              {match.turnName} {match.time && `• ${match.time}`} • Bloco {match.block}
                            </small>
                          </div>

                          {match.isBye ? (
                            <div className="bye">
                              <strong><PlayerName id={match.playerA} players={state.players} /></strong>{" "}
                              {match.stage === "knockout" ? "avançou automaticamente" : match.isTieBreak ? "aguarda próxima partida" : "recebeu BYE"}
                            </div>
                          ) : (
                            <>
                              <div className="versus">
                                <strong className={winnerId === match.playerA ? "winner-name" : ""}>
                                  <PlayerName id={match.playerA} players={state.players} />
                                </strong>

                                <span>VS</span>

                                <strong className={winnerId === match.playerB ? "winner-name" : ""}>
                                  <PlayerName id={match.playerB} players={state.players} />
                                </strong>
                              </div>

                              <div className="result-buttons">
                                <button
                                  data-sound-handled="true"
                                  className={match.status === "done" && winnerId === match.playerA ? "winner-button" : match.status === "done" ? "loser-button" : ""}
                                  onClick={() => setResult(match.id, "A")}
                                  disabled={match.status === "done"}
                                >
                                  Vitória <PlayerName id={match.playerA} players={state.players} />
                                </button>

                                {state.allowDraw && !match.isTieBreak && match.stage !== "knockout" && (
                                  <button
                                    data-sound-handled="true"
                                    className={match.status === "done" && match.result === "draw" ? "draw-button" : match.status === "done" ? "loser-button" : ""}
                                    onClick={() => setResult(match.id, "draw")}
                                    disabled={match.status === "done"}
                                  >
                                    Empate
                                  </button>
                                )}

                                <button
                                  data-sound-handled="true"
                                  className={match.status === "done" && winnerId === match.playerB ? "winner-button" : match.status === "done" ? "loser-button" : ""}
                                  onClick={() => setResult(match.id, "B")}
                                  disabled={match.status === "done"}
                                >
                                  Vitória <PlayerName id={match.playerB} players={state.players} />
                                </button>
                              </div>

                              {match.status === "done" && (
                                <p className="result">
                                  {winnerId ? `Vencedor: ${winnerName}` : "Empate"}
                                  {match.stage === "points" && ` • Resultado: ${match.scoreA} x ${match.scoreB}`}
                                  {match.stage === "knockout" && " • Eliminatória"}
                                </p>
                              )}
                            </>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      )}

      {activeTab === "ranking" && (
        <main className="panel">
          <h2><Crown size={24} /> Ranking ChessMVP</h2>

          {tournamentFinished && champion && (
            <div className="finished-badge" style={{ marginBottom: 18 }}>
              Campeão/1º colocado: {champion.name}
            </div>
          )}

          <div className="podium">
            {ranking.slice(0, 3).map((player, index) => (
              <div key={player.id} className={`podium-card pos-${index + 1}`}>
                <span>{index + 1}º</span>
                <strong>{player.name}</strong>
                <em>{player.points} pts</em>
              </div>
            ))}
          </div>

          {technicalTieGroups.length > 0 && (
            <div className="tie-break-panel">
              <h3>⚔️ Empate técnico detectado</h3>
              <p>Alguns jogadores continuam empatados nos critérios principais. Você pode criar uma partida extra para desempatar.</p>

              {technicalTieGroups.map((group, index) => (
                <div className="tie-group" key={index}>
                  <strong>Grupo empatado: {group.map((player) => player.name).join(", ")}</strong>
                  <button className="primary" data-sound-handled="true" onClick={() => generateTieBreakRound(group)}>
                    Criar partida extra de desempate
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="ranking-list">
            {ranking.map((player, index) => (
              <div key={player.id} className={`rank-row ${player.eliminated ? "eliminated-row" : "active-row"}`}>
                <strong>{index + 1}º</strong>
                <span>{player.name}</span>
                <span>{player.points} pts</span>
                <small>
                  {player.wins}V • {player.draws}E • {player.losses}D
                  <br />
                  {player.eliminated ? "Eliminado" : "Ativo"} • FA {getOpponentStrength(player, state.players)} • KO {player.knockoutWins || 0}
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
              <span>Bloco</span>
              <span>Mesa</span>
              <span>Partida</span>
              <span>Resultado</span>
            </div>

            {state.matches.map((match) => (
              <div className="table-row" key={match.id}>
                <span>{match.round}</span>
                <span>{match.block}</span>
                <span>{match.table || "-"}</span>
                <span>
                  <PlayerName id={match.playerA} players={state.players} />
                  {match.playerB ? " vs " : " "}
                  <PlayerName id={match.playerB} players={state.players} />
                </span>
                <span>{match.status === "done" ? `${match.scoreA} x ${match.scoreB}` : "Pendente"}</span>
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}

export default ChessTournament;
