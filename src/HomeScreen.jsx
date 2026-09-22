import React from "react";
import CubeIcon from "./CubeIcon.jsx";
import HanoiIcon from "./HanoiIcon.jsx";
import CheckersIcon from "./CheckersIcon.jsx";
import InstallPWAButton from "./InstallPWAButton.jsx";
import { playMenuSound } from "./sounds.js";

export default function HomeScreen({ onSelectMode }) {
  return (
    <div className="app home-theme">
      <div className="bg-board"></div>

      <header className="hero">
        <div>
          <p className="eyebrow">Sistema de torneios escolares</p>
          <h1>Escolha o torneio</h1>
          <p className="subtitle">
            Selecione a modalidade que deseja organizar.
          </p>
        </div>

        <div className="hero-actions">
          <InstallPWAButton />
        </div>
      </header>

      <main className="home-tournament-grid" style={{ marginTop: 24 }}>
        <section className="panel home-card">
          <h2>
            <span className="home-chess-icon">♟</span>
            Torneio de Xadrez
          </h2>

          <p className="hint">
            Organize rodadas, mesas, turnos, resultados, ranking e desempates.
          </p>

          <button
            className="primary full"
            onClick={() => {
             playMenuSound();
            onSelectMode("chess");}}
          >
            Abrir torneio de xadrez
          </button>
        </section>

        <section className="panel home-card">
          <h2>
            <CubeIcon size={38} />
            Torneio de Cubo Mágico
          </h2>

          <p className="hint">
            Registre tentativas, tempos, penalidades, melhor tempo, média e
            ranking final.
          </p>

          <button
            className="primary full"
            onClick={() => {
  playMenuSound();
  onSelectMode("cube");
}}
          >
            Abrir torneio de cubo mágico
          </button>
        </section>

        <section className="panel home-card">
          <h2>
            <HanoiIcon size={38} />
            Torre de Hanoi
          </h2>

          <p className="hint">
            Controle desafios por tempo, número de discos, tentativas e menor
            quantidade de movimentos.
          </p>

          <button
            className="primary full"
            onClick={() => {
  playMenuSound();
  onSelectMode("hanoi");
}}
          >
            Abrir torneio de Hanoi
          </button>
        </section>

        <section className="panel home-card">
          <h2>
            <CheckersIcon size={38} />
            Torneio de Dama
          </h2>

          <p className="hint">
            Organize partidas, rodadas, resultados, ranking e classificação dos
            jogadores.
          </p>

          <button
            className="primary full"
            onClick={() => {
  playMenuSound();
  onSelectMode("checkers");
}}
          >
            Abrir torneio de dama
          </button>
        </section>
      </main>
    </div>
  );
}
