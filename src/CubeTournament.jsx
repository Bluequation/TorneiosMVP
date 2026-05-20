import React, { useEffect, useMemo, useState } from "react";
import CubeIcon from "./CubeIcon.jsx";
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
  Upload
} from "lucide-react";

const STORAGE_KEY = "cubomvp-v1";

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

const defaultState = {
  tournamentName: "CuboMVP",
  schoolName: "",
  cubeType: "3x3",
  attemptsPerPlayer: 5,
  rankingMode: "best", // best ou average

  players: [],
  solves: []
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

function parseTime(value) {
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

  return `${Number(time).toFixed(2)}s`;
}

function getPlayerSolves(playerId, solves) {
  return solves.filter((solve) => solve.playerId === playerId);
}

function getValidSolves(playerId, solves) {
  return getPlayerSolves(playerId, solves)
    .filter((solve) => solve.status === "valid")
    .map((solve) => solve.finalTime);
}

function getBestTime(playerId, solves) {
  const validTimes = getValidSolves(playerId, solves);

  if (validTimes.length === 0) return null;

  return Math.min(...validTimes);
}

function getAverageTime(playerId, solves) {
  const validTimes = getValidSolves(playerId, solves);

  if (validTimes.length === 0) return null;

  const total = validTimes.reduce((sum, time) => sum + time, 0);

  return total / validTimes.length;
}

function getCompletedAttempts(playerId, solves) {
  return getPlayerSolves(playerId, solves).length;
}

function CubeTournament({ onBack }) {
  const [state, setState] = useState(loadState);
  const [activeTab, setActiveTab] = useState("setup");
  const [namesText, setNamesText] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [penalty, setPenalty] = useState("none");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const selectedPlayer = state.players.find(
    (player) => player.id === selectedPlayerId
  );

  const selectedPlayerSolves = selectedPlayerId
    ? getPlayerSolves(selectedPlayerId, state.solves)
    : [];

  const nextAttempt = selectedPlayerSolves.length + 1;

  const totalAttempts = state.players.length * Number(state.attemptsPerPlayer || 0);

  const completedAttempts = state.solves.length;

  const tournamentFinished =
    state.players.length > 0 &&
    totalAttempts > 0 &&
    completedAttempts >= totalAttempts;

  const ranking = useMemo(() => {
    return [...state.players].sort((a, b) => {
      const bestA = getBestTime(a.id, state.solves);
      const bestB = getBestTime(b.id, state.solves);

      const averageA = getAverageTime(a.id, state.solves);
      const averageB = getAverageTime(b.id, state.solves);

      if (state.rankingMode === "average") {
        if (averageA === null && averageB !== null) return 1;
        if (averageA !== null && averageB === null) return -1;
        if (averageA !== null && averageB !== null && averageA !== averageB) {
          return averageA - averageB;
        }

        if (bestA === null && bestB !== null) return 1;
        if (bestA !== null && bestB === null) return -1;
        if (bestA !== null && bestB !== null && bestA !== bestB) {
          return bestA - bestB;
        }
      }

      if (bestA === null && bestB !== null) return 1;
      if (bestA !== null && bestB === null) return -1;
      if (bestA !== null && bestB !== null && bestA !== bestB) {
        return bestA - bestB;
      }

      if (averageA === null && averageB !== null) return 1;
      if (averageA !== null && averageB === null) return -1;
      if (averageA !== null && averageB !== null && averageA !== averageB) {
        return averageA - averageB;
      }

      return a.name.localeCompare(b.name);
    });
  }, [state.players, state.solves, state.rankingMode]);

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
      solves: []
    }));

    if (players.length > 0) {
      setSelectedPlayerId(players[0].id);
    }

    setActiveTab("attempts");
  }

  function registerSolve(statusType = "valid") {
    if (!selectedPlayerId) {
      alert("Selecione um aluno.");
      return;
    }

    if (nextAttempt > Number(state.attemptsPerPlayer)) {
      alert("Este aluno já concluiu todas as tentativas.");
      return;
    }

    let rawTime = parseTime(timeInput);

    if (statusType !== "dnf" && rawTime === null) {
      alert("Digite um tempo válido. Exemplo: 32.45");
      return;
    }

    let finalTime = rawTime;
    let finalPenalty = penalty;

    if (statusType === "dnf") {
      rawTime = null;
      finalTime = null;
      finalPenalty = "dnf";
    }

    if (statusType === "valid" && penalty === "plus2") {
      finalTime = rawTime + 2;
    }

    const newSolve = {
      id: uid("solve"),
      playerId: selectedPlayerId,
      attempt: nextAttempt,
      cubeType: state.cubeType,
      rawTime,
      finalTime,
      penalty: finalPenalty,
      status: statusType === "dnf" ? "dnf" : "valid",
      createdAt: new Date().toISOString()
    };

    updateState((previous) => ({
      ...previous,
      solves: [...previous.solves, newSolve]
    }));

    setTimeInput("");
    setPenalty("none");
  }

  function removeSolve(solveId) {
    const confirmRemove = confirm("Remover esta tentativa?");

    if (!confirmRemove) return;

    updateState((previous) => ({
      ...previous,
      solves: previous.solves.filter((solve) => solve.id !== solveId)
    }));
  }

  function resetTournament() {
    const confirmReset = confirm(
      "Tem certeza que deseja apagar o torneio de cubo mágico?"
    );

    if (!confirmReset) return;

    localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
    setNamesText("");
    setSelectedPlayerId("");
    setTimeInput("");
    setPenalty("none");
    setActiveTab("setup");
  }

  function exportTournament() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.tournamentName || "cubomvp"}-torneio.json`;
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
        alert("Arquivo inválido. Selecione um JSON exportado pelo CuboMVP.");
      }

      event.target.value = "";
    };

    reader.readAsText(file);
  }

  return (
    <div className="app cube-theme">
      <div className="bg-board"></div>

      <header className="hero">
        <div>
          <p className="eyebrow">Torneio escolar de cubo mágico</p>
          <h1 className="title-with-icon">
  <CubeIcon size={70} />
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
          <Clock />
          <span>Cubo</span>
          <strong>{state.cubeType}</strong>
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

            <label>Tipo de cubo</label>
            <select
              value={state.cubeType}
              onChange={(event) =>
                updateState({
                  ...state,
                  cubeType: event.target.value
                })
              }
            >
              <option value="2x2">2x2</option>
              <option value="3x3">3x3</option>
              <option value="4x4">4x4</option>
              <option value="5x5">5x5</option>
              <option value="Pyraminx">Pyraminx</option>
              <option value="Megaminx">Megaminx</option>
              <option value="Skewb">Skewb</option>
            </select>

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
              <option value="best">Melhor tempo</option>
              <option value="average">Média dos tempos válidos</option>
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
              <div className="empty">
                Nenhum aluno importado ainda.
              </div>
            ) : (
              <>
                <label>Aluno</label>
                <select
                  value={selectedPlayerId}
                  onChange={(event) => setSelectedPlayerId(event.target.value)}
                >
                  <option value="">Selecione um aluno</option>

                  {state.players.map((player) => {
                    const attempts = getCompletedAttempts(player.id, state.solves);

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
                      placeholder="Ex: 32.45"
                      disabled={nextAttempt > state.attemptsPerPlayer}
                    />

                    <label>Penalidade</label>
                    <select
                      value={penalty}
                      onChange={(event) => setPenalty(event.target.value)}
                      disabled={nextAttempt > state.attemptsPerPlayer}
                    >
                      <option value="none">Sem penalidade</option>
                      <option value="plus2">+2 segundos</option>
                    </select>

                    <div className="result-buttons">
                      <button
                        onClick={() => registerSolve("valid")}
                        disabled={nextAttempt > state.attemptsPerPlayer}
                      >
                        <Save size={18} />
                        Salvar tempo
                      </button>

                      <button
                        onClick={() => registerSolve("dnf")}
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
                    <span>{getCompletedAttempts(selectedPlayer.id, state.solves)}</span>
                    <small>tentativas</small>
                  </div>

                  <div className="rank-row">
                    <strong>Melhor</strong>
                    <span>{formatTime(getBestTime(selectedPlayer.id, state.solves))}</span>
                    <span>Média</span>
                    <small>{formatTime(getAverageTime(selectedPlayer.id, state.solves))}</small>
                  </div>
                </div>

                <h3 style={{ marginTop: 20 }}>Tentativas registradas</h3>

                {selectedPlayerSolves.length === 0 ? (
                  <div className="empty">
                    Nenhuma tentativa registrada.
                  </div>
                ) : (
                  <div className="table">
                    <div className="table-row head">
                      <span>Tent.</span>
                      <span>Bruto</span>
                      <span>Penal.</span>
                      <span>Final</span>
                      <span>Ação</span>
                    </div>

                    {selectedPlayerSolves.map((solve) => (
                      <div className="table-row" key={solve.id}>
                        <span>{solve.attempt}ª</span>
                        <span>
                          {solve.status === "dnf"
                            ? "DNF"
                            : formatTime(solve.rawTime)}
                        </span>
                        <span>
                          {solve.penalty === "plus2"
                            ? "+2"
                            : solve.penalty === "dnf"
                            ? "DNF"
                            : "-"}
                        </span>
                        <span>
                          {solve.status === "dnf"
                            ? "DNF"
                            : formatTime(solve.finalTime)}
                        </span>
                        <span>
                          <button
                            className="danger"
                            onClick={() => removeSolve(solve.id)}
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
            Ranking CuboMVP
          </h2>

          <p className="hint">
            Critério principal:{" "}
            {state.rankingMode === "best"
              ? "menor melhor tempo"
              : "menor média dos tempos válidos"}.
          </p>

          <div className="podium">
            {ranking.slice(0, 3).map((player, index) => (
              <div
                key={player.id}
                className={`podium-card pos-${index + 1}`}
              >
                <span>{index + 1}º</span>
                <strong>{player.name}</strong>
                <em>{formatTime(getBestTime(player.id, state.solves))}</em>
              </div>
            ))}
          </div>

          <div className="ranking-list">
            {ranking.map((player, index) => (
              <div key={player.id} className="rank-row">
                <strong>{index + 1}º</strong>
                <span>{player.name}</span>
                <span>{formatTime(getBestTime(player.id, state.solves))}</span>
                <small>
                  Média {formatTime(getAverageTime(player.id, state.solves))}
                  <br />
                  Tentativas {getCompletedAttempts(player.id, state.solves)}/
                  {state.attemptsPerPlayer}
                </small>
              </div>
            ))}
          </div>
        </main>
      )}

      {activeTab === "history" && (
        <main className="panel">
          <h2>Histórico de tentativas</h2>

          {state.solves.length === 0 ? (
            <div className="empty">
              Nenhuma tentativa registrada ainda.
            </div>
          ) : (
            <div className="table">
              <div className="table-row head">
                <span>Aluno</span>
                <span>Tent.</span>
                <span>Cubo</span>
                <span>Tempo</span>
                <span>Final</span>
              </div>

              {state.solves.map((solve) => {
                const player = state.players.find(
                  (item) => item.id === solve.playerId
                );

                return (
                  <div className="table-row" key={solve.id}>
                    <span>{player?.name || "Aluno removido"}</span>
                    <span>{solve.attempt}ª</span>
                    <span>{solve.cubeType}</span>
                    <span>
                      {solve.status === "dnf"
                        ? "DNF"
                        : formatTime(solve.rawTime)}
                    </span>
                    <span>
                      {solve.status === "dnf"
                        ? "DNF"
                        : formatTime(solve.finalTime)}
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

export default CubeTournament;