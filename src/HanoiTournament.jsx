import React, { useEffect, useMemo, useState } from "react";
import HanoiIcon from "./HanoiIcon.jsx";
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
  Layers
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
  return attempts.filter((attempt) => attempt.playerId === playerId);
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
      if (a.moves !== b.moves) return a.moves - b.moves;
      return b.disks - a.disks;
    }

    if (a.moves !== b.moves) return a.moves - b.moves;
    if (a.time !== b.time) return a.time - b.time;
    return b.disks - a.disks;
  })[0];
}

function getCompletedAttempts(playerId, attempts) {
  return getPlayerAttempts(playerId, attempts).length;
}

function HanoiTournament({ onBack }) {
  const [state, setState] = useState(loadState);
  const [activeTab, setActiveTab] = useState("setup");
  const [namesText, setNamesText] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [movesInput, setMovesInput] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const selectedPlayer = state.players.find(
    (player) => player.id === selectedPlayerId
  );

  const selectedPlayerAttempts = selectedPlayerId
    ? getPlayerAttempts(selectedPlayerId, state.attempts)
    : [];

  const nextAttempt = selectedPlayerAttempts.length + 1;

  const totalAttempts =
    state.players.length * Number(state.attemptsPerPlayer || 0);

  const completedAttempts = state.attempts.length;

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
        if (bestA.moves !== bestB.moves) return bestA.moves - bestB.moves;
        if (bestA.disks !== bestB.disks) return bestB.disks - bestA.disks;
      } else {
        if (bestA.moves !== bestB.moves) return bestA.moves - bestB.moves;
        if (bestA.time !== bestB.time) return bestA.time - bestB.time;
        if (bestA.disks !== bestB.disks) return bestB.disks - bestA.disks;
      }

      return a.name.localeCompare(b.name);
    });
  }, [state.players, state.attempts, state.rankingMode]);

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

    setActiveTab("attempts");
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

    let time = parseNumber(timeInput);
    let moves = parseNumber(movesInput);

    if (statusType !== "dnf") {
      if (time === null) {
        alert("Digite um tempo válido em segundos. Exemplo: 45.32");
        return;
      }

      if (moves === null || moves <= 0) {
        alert("Digite uma quantidade válida de movimentos.");
        return;
      }
    }

    if (
      statusType !== "dnf" &&
      Number(state.timeLimitSeconds || 0) > 0 &&
      time > Number(state.timeLimitSeconds)
    ) {
      statusType = "dnf";
      time = null;
      moves = null;
    }

    const newAttempt = {
      id: uid("attempt"),
      playerId: selectedPlayerId,
      attempt: nextAttempt,
      disks: Number(state.disks),
      minimumMoves: minimumMoves(state.disks),
      time,
      moves,
      status: statusType === "dnf" ? "dnf" : "valid",
      createdAt: new Date().toISOString()
    };

    updateState((previous) => ({
      ...previous,
      attempts: [...previous.attempts, newAttempt]
    }));

    setTimeInput("");
    setMovesInput("");
  }

  function removeAttempt(attemptId) {
    const confirmRemove = confirm("Remover esta tentativa?");

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
    setTimeInput("");
    setMovesInput("");
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
        const importedState = JSON.parse(reader.result);

        setState({
          ...defaultState,
          ...importedState
        });

        if (importedState.players?.length > 0) {
          setSelectedPlayerId(importedState.players[0].id);
        }

        setActiveTab("setup");
        alert("Torneio importado com sucesso!");
      } catch {
        alert("Arquivo inválido. Selecione um JSON exportado pelo HanoiMVP.");
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
              placeholder="Ex: EEMTI..."
            />

            <label>Número de discos</label>
            <input
              type="number"
              min="3"
              max="8"
              value={state.disks}
              onChange={(event) =>
                updateState({
                  ...state,
                  disks: Number(event.target.value)
                })
              }
            />

            <p className="hint">
              Mínimo ideal de movimentos: {minimumMoves(state.disks)}.
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

            <label>Tempo limite por tentativa, em segundos</label>
            <input
              type="number"
              min="1"
              value={state.timeLimitSeconds}
              onChange={(event) =>
                updateState({
                  ...state,
                  timeLimitSeconds: Number(event.target.value)
                })
              }
            />

            <p className="hint">
              Exemplo: 300 segundos = 5 minutos. Acima disso, vira DNF.
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
              <button className="primary full" onClick={importPlayers}>
                Importar alunos
              </button>

              <p className="hint import-hint">
                Total previsto de tentativas:{" "}
                {(namesText.split("\n").filter(Boolean).length ||
                  state.players.length) * Number(state.attemptsPerPlayer || 0)}
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

                  {state.players.map((player) => {
                    const attempts = getCompletedAttempts(
                      player.id,
                      state.attempts
                    );

                    return (
                      <option key={player.id} value={player.id}>
                        {player.name} — {attempts}/{state.attemptsPerPlayer}
                      </option>
                    );
                  })}
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

                    <label>Tempo em segundos</label>
                    <input
                      value={timeInput}
                      onChange={(event) => setTimeInput(event.target.value)}
                      placeholder="Ex: 45.32"
                      disabled={nextAttempt > state.attemptsPerPlayer}
                    />

                    <label>Número de movimentos</label>
                    <input
                      type="number"
                      min="1"
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
                        DNF
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

                        return best ? `${best.moves} mov.` : "-";
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
                            : formatTime(attempt.time)}
                        </span>
                        <span>
                          {attempt.status === "dnf"
                            ? "DNF"
                            : `${attempt.moves} mov.`}
                        </span>
                        <span>
                          <button
                            className="danger"
                            onClick={() => removeAttempt(attempt.id)}
                          >
                            Remover
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
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
          </p>

          <div className="podium">
            {ranking.slice(0, 3).map((player, index) => {
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
                    {best ? `${best.moves} mov. • ${formatTime(best.time)}` : "-"}
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
                  <strong>{index + 1}º</strong>
                  <span>{player.name}</span>
                  <span>{best ? `${best.moves} mov.` : "-"}</span>
                  <small>
                    Tempo {best ? formatTime(best.time) : "-"}
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
                        : formatTime(attempt.time)}
                    </span>
                    <span>
                      {attempt.status === "dnf"
                        ? "DNF"
                        : `${attempt.moves} mov.`}
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