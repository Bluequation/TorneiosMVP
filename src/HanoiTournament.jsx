import React, { useEffect, useMemo, useRef, useState } from "react";
import HanoiIcon from "./HanoiIcon.jsx";
import TournamentRules from "./TournamentRules.jsx";
import {
  Trophy,
  Users,
  Clock,
  RotateCcw,
  Crown,
  Timer,
  Save,
  ArrowLeft,
  Download,
  Upload,
  Layers,
  Play,
  Pause,
  Plus,
  Undo2,
  CheckCircle2
} from "lucide-react";

const STORAGE_KEY = "hanoimvp-v1";

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

const defaultState = {
  tournamentName: "HanoiMVP",
  schoolName: "",
  disks: 3,
  attemptsPerPlayer: 3,
  timeLimitSeconds: 300,
  rankingMode: "moves",

  players: [],
  attempts: []
};

function requireValid(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeTournamentState(value) {
  requireValid(
    value && typeof value === "object" && !Array.isArray(value),
    "Estrutura principal inválida."
  );

  const disks = Number(value.disks ?? defaultState.disks);
  const attemptsPerPlayer = Number(
    value.attemptsPerPlayer ?? defaultState.attemptsPerPlayer
  );
  const timeLimitSeconds = Number(
    value.timeLimitSeconds ?? defaultState.timeLimitSeconds
  );
  const rankingMode = value.rankingMode ?? defaultState.rankingMode;

  requireValid(
    Number.isInteger(disks) && disks >= 3 && disks <= 8,
    "O número de discos deve estar entre 3 e 8."
  );
  requireValid(
    Number.isInteger(attemptsPerPlayer) &&
      attemptsPerPlayer >= 1 &&
      attemptsPerPlayer <= 10,
    "A quantidade de tentativas por aluno é inválida."
  );
  requireValid(
    Number.isFinite(timeLimitSeconds) && timeLimitSeconds >= 0,
    "O tempo limite é inválido."
  );
  requireValid(
    rankingMode === "moves" || rankingMode === "time",
    "O critério de ranking é inválido."
  );
  requireValid(Array.isArray(value.players), "A lista de alunos é inválida.");
  requireValid(
    Array.isArray(value.attempts),
    "A lista de tentativas é inválida."
  );

  const playerIds = new Set();
  const players = value.players.map((player) => {
    requireValid(
      player && typeof player === "object" && !Array.isArray(player),
      "Há um aluno inválido no arquivo."
    );

    const id = String(player.id ?? "").trim();
    const name = String(player.name ?? "").trim();

    requireValid(id && name, "Há um aluno sem identificação ou nome.");
    requireValid(!playerIds.has(id), "Há alunos com identificação duplicada.");
    playerIds.add(id);

    return { id, name };
  });

  const attemptIds = new Set();
  const attemptNumbers = new Map();
  const attempts = value.attempts.map((attempt) => {
    requireValid(
      attempt && typeof attempt === "object" && !Array.isArray(attempt),
      "Há uma tentativa inválida no arquivo."
    );

    const id = String(attempt.id ?? "").trim();
    const playerId = String(attempt.playerId ?? "").trim();
    const attemptNumber = Number(attempt.attempt);
    const attemptDisks = Number(attempt.disks);
    const status = attempt.status;

    requireValid(id && !attemptIds.has(id), "Há tentativas duplicadas.");
    requireValid(playerIds.has(playerId), "Há uma tentativa sem aluno válido.");
    requireValid(
      Number.isInteger(attemptNumber) &&
        attemptNumber >= 1 &&
        attemptNumber <= attemptsPerPlayer,
      "Há uma numeração de tentativa inválida."
    );
    requireValid(
      Number.isInteger(attemptDisks) && attemptDisks >= 3 && attemptDisks <= 8,
      "Há uma tentativa com número de discos inválido."
    );
    requireValid(
      status === "valid" || status === "dnf",
      "Há uma tentativa com status inválido."
    );

    const numbersForPlayer = attemptNumbers.get(playerId) ?? new Set();
    requireValid(
      !numbersForPlayer.has(attemptNumber),
      "Há numeração de tentativa repetida para o mesmo aluno."
    );
    numbersForPlayer.add(attemptNumber);
    attemptNumbers.set(playerId, numbersForPlayer);
    attemptIds.add(id);

    let time = null;
    let moves = null;

    if (status === "valid") {
      time = Number(attempt.time);
      const hasMoves =
        attempt.moves !== null &&
        attempt.moves !== undefined &&
        String(attempt.moves).trim() !== "";
      moves = hasMoves ? Number(attempt.moves) : null;

      requireValid(
        Number.isFinite(time) && time > 0,
        "Há uma tentativa com tempo inválido."
      );
      requireValid(
        moves === null ||
          (Number.isInteger(moves) && moves >= minimumMoves(attemptDisks)),
        "Há uma tentativa com movimentos abaixo do mínimo possível."
      );
    }

    const createdAt = String(attempt.createdAt ?? "");
    requireValid(
      createdAt && !Number.isNaN(Date.parse(createdAt)),
      "Há uma tentativa sem data válida."
    );

    return {
      id,
      playerId,
      attempt: attemptNumber,
      disks: attemptDisks,
      minimumMoves: minimumMoves(attemptDisks),
      time,
      moves,
      status,
      timeLimitExceeded:
        status === "valid" &&
        timeLimitSeconds > 0 &&
        time > timeLimitSeconds,
      createdAt
    };
  });

  return {
    tournamentName: String(
      value.tournamentName ?? defaultState.tournamentName
    ).trim() || defaultState.tournamentName,
    schoolName: String(value.schoolName ?? defaultState.schoolName).trim(),
    disks,
    attemptsPerPlayer,
    timeLimitSeconds,
    rankingMode,
    players,
    attempts
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultState;
    }

    return normalizeTournamentState(JSON.parse(raw));
  } catch {
    return defaultState;
  }
}

function parseNumber(value) {
  if (!value) return null;

  const normalized = String(value).replace(",", ".").trim();
  const number = Number(normalized);

  if (Number.isNaN(number) || number < 0) {
    return null;
  }

  return number;
}

function formatTime(time) {
  if (time === null || time === undefined) return "-";

  const totalSeconds = Number(time);

  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(2)}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}min ${seconds.toFixed(2)}s`;
}

function minimumMoves(disks) {
  return Math.pow(2, Number(disks || 0)) - 1;
}

function getPlayerAttempts(playerId, attempts) {
  return attempts
    .filter((attempt) => attempt.playerId === playerId)
    .sort((a, b) => a.attempt - b.attempt);
}

function formatMoves(moves) {
  return Number.isInteger(moves) ? `${moves} mov.` : "Não informado";
}

function formatStopwatch(milliseconds) {
  const safeMilliseconds = Math.max(0, Number(milliseconds) || 0);
  const totalCentiseconds = Math.floor(safeMilliseconds / 10);
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centiseconds = totalCentiseconds % 100;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}.${String(centiseconds).padStart(2, "0")}`;
}

function getValidAttempts(playerId, attempts) {
  return getPlayerAttempts(playerId, attempts).filter(
    (attempt) => attempt.status === "valid"
  );
}

function getBestAttempt(playerId, attempts, rankingMode) {
  const validAttempts = getValidAttempts(playerId, attempts);

  if (validAttempts.length === 0) return null;

  return [...validAttempts].sort((a, b) => {
    if (rankingMode === "time") {
      if (a.time !== b.time) return a.time - b.time;
      const movesA = Number.isInteger(a.moves) ? a.moves : Infinity;
      const movesB = Number.isInteger(b.moves) ? b.moves : Infinity;
      if (movesA !== movesB) return movesA - movesB;
      return b.disks - a.disks;
    }

    const movesA = Number.isInteger(a.moves) ? a.moves : Infinity;
    const movesB = Number.isInteger(b.moves) ? b.moves : Infinity;
    if (movesA !== movesB) return movesA - movesB;
    if (a.time !== b.time) return a.time - b.time;
    return b.disks - a.disks;
  })[0];
}

function getCompletedAttempts(playerId, attempts) {
  return getPlayerAttempts(playerId, attempts).length;
}

function getNextAttemptNumber(playerId, attempts, limit) {
  const usedNumbers = new Set(
    getPlayerAttempts(playerId, attempts).map((attempt) => attempt.attempt)
  );

  for (let number = 1; number <= Number(limit); number += 1) {
    if (!usedNumbers.has(number)) {
      return number;
    }
  }

  return Number(limit) + 1;
}

function HanoiTournament({ onBack }) {
  const [state, setState] = useState(loadState);
  const [activeTab, setActiveTab] = useState("setup");
  const [namesText, setNamesText] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [minutesInput, setMinutesInput] = useState("");
  const [secondsInput, setSecondsInput] = useState("");
  const [movesInput, setMovesInput] = useState("");
  const [stopwatchMilliseconds, setStopwatchMilliseconds] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const stopwatchBaseRef = useRef(0);
  const stopwatchStartedAtRef = useRef(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!stopwatchRunning) return undefined;

    stopwatchStartedAtRef.current = Date.now();
    const interval = window.setInterval(() => {
      setStopwatchMilliseconds(
        stopwatchBaseRef.current +
          (Date.now() - stopwatchStartedAtRef.current)
      );
    }, 30);

    return () => window.clearInterval(interval);
  }, [stopwatchRunning]);

  const selectedPlayer = state.players.find(
    (player) => player.id === selectedPlayerId
  );

  const selectedPlayerAttempts = selectedPlayerId
    ? getPlayerAttempts(selectedPlayerId, state.attempts)
    : [];

  const nextAttempt = selectedPlayerId
    ? getNextAttemptNumber(
        selectedPlayerId,
        state.attempts,
        state.attemptsPerPlayer
      )
    : 1;

  const totalAttempts =
    state.players.length * Number(state.attemptsPerPlayer || 0);

  const completedAttempts = state.attempts.length;

  const activePlayers = state.players.filter(
    (player) =>
      getCompletedAttempts(player.id, state.attempts) <
      Number(state.attemptsPerPlayer)
  );

  const completedPlayers = state.players.filter(
    (player) =>
      getCompletedAttempts(player.id, state.attempts) >=
      Number(state.attemptsPerPlayer)
  );

  const tournamentFinished =
    state.players.length > 0 &&
    totalAttempts > 0 &&
    completedAttempts >= totalAttempts;

  const ranking = useMemo(() => {
    return [...state.players].sort((a, b) => {
      const bestA = getBestAttempt(a.id, state.attempts, state.rankingMode);
      const bestB = getBestAttempt(b.id, state.attempts, state.rankingMode);

      if (!bestA && bestB) return 1;
      if (bestA && !bestB) return -1;
      if (!bestA && !bestB) return a.name.localeCompare(b.name);

      if (state.rankingMode === "time") {
        if (bestA.time !== bestB.time) return bestA.time - bestB.time;
        const movesA = Number.isInteger(bestA.moves) ? bestA.moves : Infinity;
        const movesB = Number.isInteger(bestB.moves) ? bestB.moves : Infinity;
        if (movesA !== movesB) return movesA - movesB;
        if (bestA.disks !== bestB.disks) return bestB.disks - bestA.disks;
      } else {
        const movesA = Number.isInteger(bestA.moves) ? bestA.moves : Infinity;
        const movesB = Number.isInteger(bestB.moves) ? bestB.moves : Infinity;
        if (movesA !== movesB) return movesA - movesB;
        if (bestA.time !== bestB.time) return bestA.time - bestB.time;
        if (bestA.disks !== bestB.disks) return bestB.disks - bestA.disks;
      }

      return a.name.localeCompare(b.name);
    });
  }, [state.players, state.attempts, state.rankingMode]);

  const podiumRanking = ranking.filter((player) =>
    getBestAttempt(player.id, state.attempts, state.rankingMode)
  );

  function updateState(next) {
    setState((previous) => {
      if (typeof next === "function") {
        return next(previous);
      }

      return next;
    });
  }

  function updateTimeLimitPart(part, rawValue) {
    const value = Math.max(0, Number(rawValue) || 0);
    const currentMinutes = Math.floor(Number(state.timeLimitSeconds || 0) / 60);
    const currentSeconds = Number(state.timeLimitSeconds || 0) % 60;
    const nextMinutes = part === "minutes" ? Math.floor(value) : currentMinutes;
    const nextSeconds =
      part === "seconds" ? Math.min(value, 59) : currentSeconds;

    updateState({
      ...state,
      timeLimitSeconds: nextMinutes * 60 + nextSeconds
    });
  }

  function getNamesFromInput() {
    return namesText
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean);
  }

  function addPlayers() {
    const names = getNamesFromInput();

    if (names.length === 0) {
      alert("Digite pelo menos um nome antes de adicionar os participantes.");
      return;
    }

    const existingNames = new Set(
      state.players.map((player) => player.name.trim().toLocaleLowerCase("pt-BR"))
    );
    const namesToAdd = [];
    const namesInNewList = new Set();

    names.forEach((name) => {
      const normalizedName = name.toLocaleLowerCase("pt-BR");
      if (existingNames.has(normalizedName) || namesInNewList.has(normalizedName)) {
        return;
      }
      namesInNewList.add(normalizedName);
      namesToAdd.push(name);
    });

    if (namesToAdd.length === 0) {
      alert("Todos os nomes digitados já estão na lista atual.");
      return;
    }

    const newPlayers = namesToAdd.map((name) => ({
      id: uid("player"),
      name
    }));

    updateState((previous) => ({
      ...previous,
      players: [...previous.players, ...newPlayers]
    }));

    setNamesText("");
    setSelectedPlayerId(newPlayers[0].id);
    setActiveTab("attempts");

    const skipped = names.length - namesToAdd.length;
    if (skipped > 0) {
      alert(
        `${namesToAdd.length} participante(s) adicionado(s). ${skipped} nome(s) repetido(s) foram ignorados.`
      );
    }
  }

  function replacePlayers() {
    const names = getNamesFromInput();

    if (names.length === 0) {
      alert("Digite pelo menos um nome antes de criar a nova lista.");
      return;
    }

    if (state.players.length > 0 || state.attempts.length > 0) {
      const confirmReplace = confirm(
        "Criar uma nova lista apagará os participantes e todas as tentativas atuais. Deseja continuar?"
      );

      if (!confirmReplace) return;
    }

    const players = names.map((name) => ({
      id: uid("player"),
      name
    }));

    updateState((previous) => ({
      ...previous,
      players,
      attempts: []
    }));

    if (players.length > 0) {
      setSelectedPlayerId(players[0].id);
    }

    setNamesText("");
    setActiveTab("attempts");
  }

  function startStopwatch() {
    if (stopwatchRunning) return;
    stopwatchBaseRef.current = stopwatchMilliseconds;
    setStopwatchRunning(true);
  }

  function pauseStopwatch() {
    if (!stopwatchRunning) return;
    const currentMilliseconds =
      stopwatchBaseRef.current +
      (Date.now() - stopwatchStartedAtRef.current);
    const totalSeconds = currentMilliseconds / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds - minutes * 60;

    stopwatchBaseRef.current = currentMilliseconds;
    setStopwatchMilliseconds(currentMilliseconds);
    setStopwatchRunning(false);
    setMinutesInput(String(minutes));
    setSecondsInput(seconds.toFixed(2));
  }

  function resetStopwatch() {
    stopwatchBaseRef.current = 0;
    stopwatchStartedAtRef.current = 0;
    setStopwatchRunning(false);
    setStopwatchMilliseconds(0);
  }

  function useStopwatchTime() {
    const currentMilliseconds = stopwatchRunning
      ? stopwatchBaseRef.current +
        (Date.now() - stopwatchStartedAtRef.current)
      : stopwatchMilliseconds;
    const totalSeconds = currentMilliseconds / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds - minutes * 60;

    stopwatchBaseRef.current = currentMilliseconds;
    setStopwatchMilliseconds(currentMilliseconds);
    setStopwatchRunning(false);
    setMinutesInput(String(minutes));
    setSecondsInput(seconds.toFixed(2));
  }

  function registerAttempt(statusType = "valid") {
    if (!selectedPlayerId) {
      alert("Selecione um aluno.");
      return;
    }

    if (nextAttempt > Number(state.attemptsPerPlayer)) {
      alert("Este aluno já concluiu todas as tentativas.");
      return;
    }

    const minutes = minutesInput.trim() === "" ? 0 : parseNumber(minutesInput);
    const seconds = secondsInput.trim() === "" ? 0 : parseNumber(secondsInput);
    let time =
      minutes === null || seconds === null ? null : minutes * 60 + seconds;
    let moves = movesInput.trim() === "" ? null : parseNumber(movesInput);

    if (statusType !== "dnf") {
      if (
        time === null ||
        time <= 0 ||
        !Number.isInteger(minutes) ||
        seconds >= 60
      ) {
        alert("Digite um tempo válido em minutos e segundos. Os segundos devem ser menores que 60.");
        return;
      }

      if (moves !== null && !Number.isInteger(moves)) {
        alert("Se informar os movimentos, digite uma quantidade inteira.");
        return;
      }

      const theoreticalMinimum = minimumMoves(state.disks);

      if (moves !== null && moves < theoreticalMinimum) {
        alert(
          `Com ${state.disks} discos, o mínimo possível é ${theoreticalMinimum} movimentos.`
        );
        return;
      }
    }

    if (statusType === "dnf") {
      time = null;
      moves = null;
    }

    const timeLimitExceeded =
      statusType !== "dnf" &&
      Number(state.timeLimitSeconds || 0) > 0 &&
      time > Number(state.timeLimitSeconds);

    const newAttempt = {
      id: uid("attempt"),
      playerId: selectedPlayerId,
      attempt: nextAttempt,
      disks: Number(state.disks),
      minimumMoves: minimumMoves(state.disks),
      time,
      moves,
      status: statusType === "dnf" ? "dnf" : "valid",
      timeLimitExceeded,
      createdAt: new Date().toISOString()
    };

    updateState((previous) => ({
      ...previous,
      attempts: [...previous.attempts, newAttempt]
    }));

    setMinutesInput("");
    setSecondsInput("");
    setMovesInput("");
    resetStopwatch();

    if (nextAttempt >= Number(state.attemptsPerPlayer)) {
      const nextPlayer = activePlayers.find(
        (player) => player.id !== selectedPlayerId
      );
      if (nextPlayer) setSelectedPlayerId(nextPlayer.id);
    }
  }

  function restoreAttempt(attemptId) {
    const confirmRemove = confirm(
      "Restituir esta tentativa? O registro será apagado e o participante poderá refazê-la."
    );

    if (!confirmRemove) return;

    updateState((previous) => ({
      ...previous,
      attempts: previous.attempts.filter((attempt) => attempt.id !== attemptId)
    }));
  }

  function resetTournament() {
    const confirmReset = confirm(
      "Tem certeza que deseja apagar o torneio de Torre de Hanoi?"
    );

    if (!confirmReset) return;

    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
    setNamesText("");
    setSelectedPlayerId("");
    setMinutesInput("");
    setSecondsInput("");
    setMovesInput("");
    resetStopwatch();
    setActiveTab("setup");
  }

  function exportTournament() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.tournamentName || "hanoimvp"}-torneio.json`;
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
        const importedState = normalizeTournamentState(
          JSON.parse(reader.result)
        );

        setState(importedState);

        if (importedState.players?.length > 0) {
          setSelectedPlayerId(importedState.players[0].id);
        }

        setActiveTab("setup");
        alert("Torneio importado com sucesso!");
      } catch (error) {
        alert(
          `Arquivo inválido. ${
            error instanceof Error
              ? error.message
              : "Selecione um JSON exportado pelo HanoiMVP."
          }`
        );
      }

      event.target.value = "";
    };

    reader.readAsText(file);
  }

  return (
    <div className="app hanoi-theme">
      <div className="bg-board"></div>

      <header className="hero">
        <div>
          <p className="eyebrow">Torneio escolar de raciocínio lógico</p>
          <h1 className="title-with-icon">
  <HanoiIcon size={70} />
  {state.tournamentName}
</h1>
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
            <Download size={18} />
            Exportar
          </button>

          <label className="ghost import-file-button">
            <Upload size={18} />
            Importar
            <input
              type="file"
              accept="application/json"
              onChange={importTournament}
              hidden
            />
          </label>
        </div>
      </header>

      <section className="stats">
        <div className="stat">
          <Users />
          <span>Participantes</span>
          <strong>{state.players.length}</strong>
        </div>

        <div className="stat">
          <Timer />
          <span>Tentativas</span>
          <strong>
            {completedAttempts}/{totalAttempts || 0}
          </strong>
        </div>

        <div className="stat">
          <Layers />
          <span>Discos</span>
          <strong>{state.disks}</strong>
        </div>

        <div className="stat">
          <Trophy />
          <span>Status</span>
          <strong>{tournamentFinished ? "Fim" : "Ativo"}</strong>
        </div>
      </section>

      <nav className="tabs">
        {[
          ["setup", "Configuração"],
          ["attempts", "Tentativas"],
          ["ranking", "Ranking"],
          ["history", "Histórico"],
          ["rules", "Regras"]
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

      {activeTab === "rules" && (
        <TournamentRules tournament="hanoi" disks={state.disks} />
      )}

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
              placeholder="Ex: EEMTI..."
            />

            <label>Número de discos</label>
            <input
              type="number"
              min="3"
              max="8"
              value={state.disks}
              disabled={state.attempts.length > 0}
              title={
                state.attempts.length > 0
                  ? "Reinicie o torneio para alterar o número de discos."
                  : undefined
              }
              onChange={(event) =>
                updateState({
                  ...state,
                  disks: Number(event.target.value)
                })
              }
            />

            <p className="hint">
              Mínimo ideal de movimentos: {minimumMoves(state.disks)}.
              {state.attempts.length > 0 && (
                <>
                  {" "}O número de discos fica bloqueado após a primeira
                  tentativa.
                </>
              )}
            </p>

            <label>Tentativas por aluno</label>
            <input
              type="number"
              min="1"
              max="10"
              value={state.attemptsPerPlayer}
              onChange={(event) =>
                updateState({
                  ...state,
                  attemptsPerPlayer: Number(event.target.value)
                })
              }
            />

            <label>Tempo de referência por tentativa</label>
            <div className="time-inputs">
              <div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={Math.floor(Number(state.timeLimitSeconds || 0) / 60)}
                  onChange={(event) =>
                    updateTimeLimitPart("minutes", event.target.value)
                  }
                />
                <small>minutos</small>
              </div>
              <span>:</span>
              <div>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  value={Number(state.timeLimitSeconds || 0) % 60}
                  onChange={(event) =>
                    updateTimeLimitPart("seconds", event.target.value)
                  }
                />
                <small>segundos</small>
              </div>
            </div>

            <p className="hint">
              É apenas uma referência. Se o participante ultrapassar esse
              tempo, a tentativa continuará válida e entrará no ranking.
            </p>

            <label>Critério principal de ranking</label>
            <select
              value={state.rankingMode}
              onChange={(event) =>
                updateState({
                  ...state,
                  rankingMode: event.target.value
                })
              }
            >
              <option value="moves">Menor número de movimentos</option>
              <option value="time">Menor tempo</option>
            </select>
          </section>

          <section className="panel">
            <h2>2. Participantes</h2>

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
              <div className="participant-import-actions">
                <button className="primary" onClick={addPlayers}>
                  <Plus size={18} />
                  Adicionar à lista atual
                </button>
                <button className="ghost" onClick={replacePlayers}>
                  Criar nova lista
                </button>
              </div>

              <p className="hint import-hint">
                Lista atual: {state.players.length} participante(s) •{" "}
                {completedPlayers.length} concluinte(s)
              </p>
            </div>
          </section>
        </main>
      )}

      {activeTab === "attempts" && (
        <main className="grid two">
          <section className="panel">
            <h2>
              <Timer size={24} />
              Registrar tentativa
            </h2>

            {state.players.length === 0 ? (
              <div className="empty">Nenhum aluno importado ainda.</div>
            ) : (
              <>
                <label>Aluno</label>
                <select
                  value={selectedPlayerId}
                  onChange={(event) => setSelectedPlayerId(event.target.value)}
                >
                  <option value="">Selecione um aluno</option>

                  {activePlayers.length > 0 && (
                    <optgroup label="Em andamento">
                      {activePlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} — {getCompletedAttempts(
                            player.id,
                            state.attempts
                          )}/{state.attemptsPerPlayer}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {completedPlayers.length > 0 && (
                    <optgroup label="Concluintes">
                      {completedPlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} — concluído
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {selectedPlayer && (
                  <>
                    <p className="hint" style={{ marginTop: 14 }}>
                      Próxima tentativa de {selectedPlayer.name}:{" "}
                      <strong>
                        {nextAttempt > state.attemptsPerPlayer
                          ? "concluído"
                          : `${nextAttempt}ª tentativa`}
                      </strong>
                    </p>

                    <div className={`stopwatch-card${
                      stopwatchRunning ? " running" : ""
                    }`}>
                      <span>Cronômetro</span>
                      <strong>{formatStopwatch(stopwatchMilliseconds)}</strong>
                      <div className="stopwatch-actions">
                        {!stopwatchRunning ? (
                          <button
                            type="button"
                            onClick={startStopwatch}
                            disabled={nextAttempt > state.attemptsPerPlayer}
                          >
                            <Play size={17} />
                            Iniciar
                          </button>
                        ) : (
                          <button type="button" onClick={pauseStopwatch}>
                            <Pause size={17} />
                            Pausar
                          </button>
                        )}
                        <button type="button" onClick={resetStopwatch}>
                          <RotateCcw size={17} />
                          Zerar
                        </button>
                        <button
                          type="button"
                          onClick={useStopwatchTime}
                          disabled={
                            stopwatchMilliseconds <= 0 && !stopwatchRunning
                          }
                        >
                          Usar tempo
                        </button>
                      </div>
                      {Number(state.timeLimitSeconds || 0) > 0 &&
                        stopwatchMilliseconds / 1000 >
                          Number(state.timeLimitSeconds) && (
                          <small className="time-limit-warning">
                            Tempo de referência ultrapassado — a tentativa
                            continua válida.
                          </small>
                        )}
                    </div>

                    <label>Tempo da tentativa</label>
                    <div className="time-inputs attempt-time-inputs">
                      <div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={minutesInput}
                          onChange={(event) =>
                            setMinutesInput(event.target.value)
                          }
                          placeholder="0"
                          disabled={nextAttempt > state.attemptsPerPlayer}
                        />
                        <small>minutos</small>
                      </div>
                      <span>:</span>
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="59.99"
                          step="0.01"
                          value={secondsInput}
                          onChange={(event) =>
                            setSecondsInput(event.target.value)
                          }
                          placeholder="00.00"
                          disabled={nextAttempt > state.attemptsPerPlayer}
                        />
                        <small>segundos</small>
                      </div>
                    </div>

                    <label>Número de movimentos — opcional</label>
                    <input
                      type="number"
                      min={minimumMoves(state.disks)}
                      step="1"
                      value={movesInput}
                      onChange={(event) => setMovesInput(event.target.value)}
                      placeholder={`Mínimo ideal: ${minimumMoves(state.disks)}`}
                      disabled={nextAttempt > state.attemptsPerPlayer}
                    />

                    <div className="result-buttons">
                      <button
                        onClick={() => registerAttempt("valid")}
                        disabled={nextAttempt > state.attemptsPerPlayer}
                      >
                        <Save size={18} />
                        Salvar tentativa
                      </button>

                      <button
                        onClick={() => registerAttempt("dnf")}
                        disabled={nextAttempt > state.attemptsPerPlayer}
                      >
                        Não concluiu (DNF)
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </section>

          <section className="panel">
            <h2>Resumo do aluno</h2>

            {!selectedPlayer ? (
              <div className="empty">
                Selecione um aluno para ver o resumo.
              </div>
            ) : (
              <>
                <div className="ranking-list">
                  <div className="rank-row">
                    <strong>Aluno</strong>
                    <span>{selectedPlayer.name}</span>
                    <span>
                      {getCompletedAttempts(selectedPlayer.id, state.attempts)}
                    </span>
                    <small>tentativas</small>
                  </div>

                  <div className="rank-row">
                    <strong>Melhor</strong>
                    <span>
                      {(() => {
                        const best = getBestAttempt(
                          selectedPlayer.id,
                          state.attempts,
                          state.rankingMode
                        );

                        return best ? formatMoves(best.moves) : "-";
                      })()}
                    </span>
                    <span>Tempo</span>
                    <small>
                      {(() => {
                        const best = getBestAttempt(
                          selectedPlayer.id,
                          state.attempts,
                          state.rankingMode
                        );

                        return best ? formatTime(best.time) : "-";
                      })()}
                    </small>
                  </div>
                </div>

                <h3 style={{ marginTop: 20 }}>Tentativas registradas</h3>

                {selectedPlayerAttempts.length === 0 ? (
                  <div className="empty">Nenhuma tentativa registrada.</div>
                ) : (
                  <div className="table">
                    <div className="table-row head">
                      <span>Tent.</span>
                      <span>Discos</span>
                      <span>Tempo</span>
                      <span>Mov.</span>
                      <span>Ação</span>
                    </div>

                    {selectedPlayerAttempts.map((attempt) => (
                      <div className="table-row" key={attempt.id}>
                        <span>{attempt.attempt}ª</span>
                        <span>{attempt.disks}</span>
                        <span>
                          {attempt.status === "dnf"
                            ? "DNF"
                            : (
                              <>
                                {formatTime(attempt.time)}
                                {attempt.timeLimitExceeded && (
                                  <small className="attempt-warning">
                                    Tempo excedido
                                  </small>
                                )}
                              </>
                            )}
                        </span>
                        <span>
                          {attempt.status === "dnf"
                            ? "DNF"
                            : formatMoves(attempt.moves)}
                        </span>
                        <span>
                          <button
                            className="danger"
                            onClick={() => restoreAttempt(attempt.id)}
                          >
                            <Undo2 size={15} />
                            Restituir
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="panel completed-participants-panel">
            <div className="completed-participants-head">
              <div>
                <h2>
                  <CheckCircle2 size={23} />
                  Participantes concluintes
                </h2>
                <p className="hint">
                  Esta lista é atualizada automaticamente após a última
                  tentativa de cada participante.
                </p>
              </div>
              <strong>{completedPlayers.length}</strong>
            </div>

            {completedPlayers.length === 0 ? (
              <div className="empty">Nenhum participante concluiu ainda.</div>
            ) : (
              <div className="completed-participants-list">
                {completedPlayers.map((player) => (
                  <button
                    type="button"
                    key={player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                  >
                    <CheckCircle2 size={17} />
                    <span>{player.name}</span>
                    <small>{state.attemptsPerPlayer} tentativas</small>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {activeTab === "ranking" && (
        <main className="panel">
          <h2>
            <Crown size={24} />
            Ranking HanoiMVP
          </h2>

          <p className="hint">
            Critério principal:{" "}
            {state.rankingMode === "moves"
              ? "menor número de movimentos"
              : "menor tempo"}.
            {state.rankingMode === "moves" && (
              <>
                {" "}Tentativas sem movimentos informados continuam salvas,
                mas aparecem depois das tentativas com movimentos registrados.
              </>
            )}
          </p>

          <div className="podium">
            {podiumRanking.length === 0 ? (
              <div className="empty">
                O pódio aparecerá depois da primeira tentativa válida.
              </div>
            ) : podiumRanking.slice(0, 3).map((player, index) => {
              const best = getBestAttempt(
                player.id,
                state.attempts,
                state.rankingMode
              );

              return (
                <div
                  key={player.id}
                  className={`podium-card pos-${index + 1}`}
                >
                  <span>{index + 1}º</span>
                  <strong>{player.name}</strong>
                  <em>
                    {best
                      ? `${formatMoves(best.moves)} • ${formatTime(best.time)}`
                      : "-"}
                  </em>
                </div>
              );
            })}
          </div>

          <div className="ranking-list">
            {ranking.map((player, index) => {
              const best = getBestAttempt(
                player.id,
                state.attempts,
                state.rankingMode
              );

              return (
                <div key={player.id} className="rank-row">
                  <strong>{best ? `${index + 1}º` : "—"}</strong>
                  <span>{player.name}</span>
                  <span>{best ? formatMoves(best.moves) : "-"}</span>
                  <small>
                    Tempo {best ? formatTime(best.time) : "-"}
                    {best?.timeLimitExceeded ? " • excedido" : ""}
                    <br />
                    Discos {best ? best.disks : state.disks} • Tentativas{" "}
                    {getCompletedAttempts(player.id, state.attempts)}/
                    {state.attemptsPerPlayer}
                  </small>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {activeTab === "history" && (
        <main className="panel">
          <h2>Histórico de tentativas</h2>

          {state.attempts.length === 0 ? (
            <div className="empty">Nenhuma tentativa registrada ainda.</div>
          ) : (
            <div className="table">
              <div className="table-row head">
                <span>Aluno</span>
                <span>Tent.</span>
                <span>Discos</span>
                <span>Tempo</span>
                <span>Mov.</span>
              </div>

              {state.attempts.map((attempt) => {
                const player = state.players.find(
                  (item) => item.id === attempt.playerId
                );

                return (
                  <div className="table-row" key={attempt.id}>
                    <span>{player?.name || "Aluno removido"}</span>
                    <span>{attempt.attempt}ª</span>
                    <span>{attempt.disks}</span>
                    <span>
                      {attempt.status === "dnf"
                        ? "DNF"
                        : `${formatTime(attempt.time)}${
                            attempt.timeLimitExceeded ? " • excedido" : ""
                          }`}
                    </span>
                    <span>
                      {attempt.status === "dnf"
                        ? "DNF"
                        : formatMoves(attempt.moves)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default HanoiTournament;
