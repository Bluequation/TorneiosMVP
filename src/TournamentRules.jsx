import React from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  PlayCircle,
  Target,
  Trophy,
  Wifi
} from "lucide-react";

const videos = {
  hanoi: {
    label: "Aula: Torre de Hanói — Portal da Matemática/OBMEP",
    url: "https://www.youtube.com/watch?v=Bn9h9k6eg0o"
  },
  cube: {
    label: "Como montar um cubo mágico — passo a passo",
    url: "https://www.youtube.com/watch?v=u1P5p3RY_eA"
  },
  checkers: {
    label: "Procurar videoaulas de damas brasileiras",
    url: "https://www.youtube.com/results?search_query=como+jogar+damas+brasileiras+regras"
  },
  chess: {
    label: "Como jogar xadrez — regras para iniciantes",
    url: "https://www.youtube.com/watch?v=Hssr3Bzigt4"
  }
};

const referenceLinks = {
  cube: {
    label: "Regulamento da WCA em português",
    url: "https://regulations.worldcubeassociation.org/translations/portuguese-brazilian/wca-regulamentos-e-orientacoes.pdf"
  },
  chess: {
    label: "Guia completo para jogar xadrez",
    url: "https://www.chess.com/pt-BR/como-jogar-xadrez"
  }
};

function RuleCard({ icon: Icon = CheckCircle2, title, children, accent = false }) {
  return (
    <section className={`rule-card${accent ? " rule-card-accent" : ""}`}>
      <div className="rule-card-icon" aria-hidden="true">
        <Icon size={21} />
      </div>
      <div>
        <h3>{title}</h3>
        {children}
      </div>
    </section>
  );
}

function StepList({ children }) {
  return <ol className="rule-steps">{children}</ol>;
}

function ResourceLinks({ tournament }) {
  const video = videos[tournament];
  const reference = referenceLinks[tournament];

  return (
    <section className="rules-resources">
      <div>
        <span className="rules-kicker">Para aprender vendo</span>
        <h2>Vídeo e material de apoio</h2>
        <p>As regras acima ficam disponíveis mesmo sem internet.</p>
      </div>
      <div className="resource-buttons">
        <a href={video.url} target="_blank" rel="noreferrer" className="resource-link">
          <PlayCircle size={21} />
          <span>{video.label}</span>
          <ExternalLink size={16} />
        </a>
        {reference && (
          <a href={reference.url} target="_blank" rel="noreferrer" className="resource-link secondary">
            <BookOpen size={21} />
            <span>{reference.label}</span>
            <ExternalLink size={16} />
          </a>
        )}
        <small className="online-note">
          <Wifi size={14} /> Os links externos precisam de internet.
        </small>
      </div>
    </section>
  );
}

function HanoiRules({ disks = 3 }) {
  const diskCount = Math.max(1, Number(disks) || 3);
  const isEven = diskCount % 2 === 0;
  const minimum = 2 ** diskCount - 1;
  const firstTarget = isEven ? "APOIO" : "DESTINO";
  const firstExplanation = isEven
    ? "o pino onde a torre não será formada"
    : "o pino onde a torre será formada";
  const smallestCycle = isEven
    ? "ORIGEM → APOIO → DESTINO → ORIGEM"
    : "ORIGEM → DESTINO → APOIO → ORIGEM";

  return (
    <>
      <div className="rules-grid hanoi-rules">
        <RuleCard icon={Target} title="Objetivo">
          <p>Leve a torre inteira da <strong>ORIGEM</strong> até o <strong>DESTINO</strong>.</p>
          <div className="hanoi-route" aria-label="Origem, apoio e destino">
            <span>ORIGEM</span><ArrowRight /><span>APOIO</span><ArrowRight /><span>DESTINO</span>
          </div>
        </RuleCard>

        <RuleCard icon={CheckCircle2} title="As 3 regras">
          <ul className="clean-list">
            <li>Mova <strong>um disco por vez</strong>.</li>
            <li>Pegue somente o disco que está <strong>por cima</strong>.</li>
            <li>Nunca coloque um disco <strong>maior sobre um menor</strong>.</li>
          </ul>
        </RuleCard>

        <RuleCard icon={Lightbulb} title={`${diskCount} discos: número ${isEven ? "par" : "ímpar"}`} accent>
          <p className="parity-callout">
            Comece levando o <strong>menor disco</strong> para o <strong>{firstTarget}</strong> — {firstExplanation}.
          </p>
          <div className="parity-memory">
            <span><b>PAR</b> → começa no apoio</span>
            <span><b>ÍMPAR</b> → começa no destino</span>
          </div>
          <div className="move-demo">
            <span>1º movimento</span>
            <strong>menor disco <ArrowRight size={17} /> {firstTarget}</strong>
          </div>
        </RuleCard>

        <RuleCard icon={ArrowRight} title="Depois, é só alternar">
          <StepList>
            <li><span>1</span><p>Mova o <strong>menor disco</strong> seguindo sempre este ciclo:<br /><b>{smallestCycle}</b>.</p></li>
            <li><span>2</span><p>Faça o <strong>único movimento permitido</strong> que não usa o menor disco.</p></li>
            <li><span>3</span><p>Repita os passos 1 e 2 até montar a torre no destino.</p></li>
          </StepList>
        </RuleCard>

        <RuleCard icon={Trophy} title="Qual é a pontuação ideal?">
          <p>O mínimo é <strong>2ⁿ − 1</strong> movimentos.</p>
          <div className="formula-result">
            <span>Com {diskCount} discos</span>
            <strong>2<sup>{diskCount}</sup> − 1 = {minimum} movimentos</strong>
          </div>
          <p className="hint">No ranking por movimentos, vence quem chegar mais perto desse mínimo. Em empate, o menor tempo decide.</p>
        </RuleCard>
      </div>
      <ResourceLinks tournament="hanoi" />
    </>
  );
}

function CubeRules() {
  return (
    <>
      <div className="rules-grid">
        <RuleCard icon={Target} title="Objetivo">
          <p>Deixe cada face do cubo com <strong>uma única cor</strong>. Os centros não mudam de posição: eles mostram a cor final de cada face.</p>
        </RuleCard>
        <RuleCard icon={BookOpen} title="Leia os movimentos">
          <div className="notation-grid">
            <span><b>R</b> direita</span><span><b>L</b> esquerda</span><span><b>U</b> cima</span>
            <span><b>D</b> baixo</span><span><b>F</b> frente</span><span><b>B</b> trás</span>
          </div>
          <p className="hint"><strong>R'</strong> gira ao contrário; <strong>R2</strong> gira duas vezes. Olhe diretamente para a face indicada.</p>
        </RuleCard>
        <RuleCard icon={Lightbulb} title="Método iniciante: pense em camadas" accent>
          <StepList>
            <li><span>1</span><p>Faça a <strong>cruz branca</strong> e alinhe as cores laterais.</p></li>
            <li><span>2</span><p>Complete os <strong>cantos brancos</strong>.</p></li>
            <li><span>3</span><p>Monte as <strong>arestas da camada do meio</strong>.</p></li>
            <li><span>4</span><p>Faça a cruz e depois a <strong>face amarela</strong>.</p></li>
            <li><span>5</span><p>Posicione cantos e arestas amarelas para finalizar.</p></li>
          </StepList>
        </RuleCard>
        <RuleCard icon={Trophy} title="Neste torneio">
          <ul className="clean-list">
            <li><strong>Sem penalidade:</strong> vale o tempo registrado.</li>
            <li><strong>+2:</strong> dois segundos são somados ao tempo.</li>
            <li><strong>DNF:</strong> tentativa não concluída; não conta como tempo válido.</li>
            <li>O ranking usa o <strong>melhor tempo</strong> ou a <strong>média</strong>, conforme a configuração.</li>
          </ul>
        </RuleCard>
      </div>
      <ResourceLinks tournament="cube" />
    </>
  );
}

function CheckersRules() {
  return (
    <>
      <div className="rules-grid">
        <RuleCard icon={Target} title="Objetivo">
          <p>Capture todas as peças adversárias ou deixe o oponente <strong>sem movimento possível</strong>.</p>
        </RuleCard>
        <RuleCard icon={BookOpen} title="Antes de começar">
          <ul className="clean-list">
            <li>Jogue somente nas <strong>casas escuras</strong>.</li>
            <li>Cada jogador começa com <strong>12 pedras</strong> nas três primeiras fileiras.</li>
            <li>A casa escura do canto deve ficar à <strong>esquerda</strong> de cada jogador.</li>
          </ul>
        </RuleCard>
        <RuleCard icon={ArrowRight} title="Como a pedra anda">
          <p>A pedra comum avança <strong>uma casa na diagonal</strong>. Para capturar, salta uma peça adversária e cai na casa vazia logo depois.</p>
          <p className="rule-alert">A captura é obrigatória e pode acontecer para frente ou para trás.</p>
        </RuleCard>
        <RuleCard icon={Trophy} title="Virou dama">
          <p>Quando a pedra chega à última fileira, vira <strong>dama</strong>. A dama anda para frente ou para trás pelas diagonais livres.</p>
        </RuleCard>
        <RuleCard icon={Lightbulb} title="Se houver mais de uma captura" accent>
          <p>Continue capturando com a mesma peça enquanto for possível. Se existirem caminhos diferentes, escolha o que captura o <strong>maior número de peças</strong> — a “lei da maioria”.</p>
        </RuleCard>
        <RuleCard icon={CheckCircle2} title="Fim da partida">
          <ul className="clean-list">
            <li><strong>Vitória:</strong> o adversário fica sem peças ou sem jogadas.</li>
            <li><strong>Empate:</strong> pode ser registrado quando a partida não progride ou conforme a decisão do professor/árbitro.</li>
          </ul>
        </RuleCard>
      </div>
      <ResourceLinks tournament="checkers" />
    </>
  );
}

function ChessRules() {
  return (
    <>
      <div className="rules-grid">
        <RuleCard icon={Target} title="Objetivo">
          <p>Dê <strong>xeque-mate</strong>: ataque o rei de modo que ele não consiga fugir, bloquear o ataque nem capturar a peça atacante.</p>
        </RuleCard>
        <RuleCard icon={BookOpen} title="Monte o tabuleiro">
          <ul className="clean-list">
            <li>Deixe uma <strong>casa clara à direita</strong> de cada jogador.</li>
            <li>A <strong>dama fica na casa da própria cor</strong>.</li>
            <li>As peças brancas fazem o primeiro lance.</li>
          </ul>
        </RuleCard>
        <RuleCard icon={ArrowRight} title="Como cada peça se move">
          <div className="piece-grid">
            <p><b>Rei</b><span>1 casa em qualquer direção</span></p>
            <p><b>Dama</b><span>retas e diagonais</span></p>
            <p><b>Torre</b><span>linhas e colunas</span></p>
            <p><b>Bispo</b><span>diagonais</span></p>
            <p><b>Cavalo</b><span>em “L”; pode saltar peças</span></p>
            <p><b>Peão</b><span>avança reto e captura na diagonal</span></p>
          </div>
        </RuleCard>
        <RuleCard icon={Lightbulb} title="Três lances especiais" accent>
          <ul className="clean-list">
            <li><strong>Roque:</strong> rei e torre se movem juntos, se as condições permitirem.</li>
            <li><strong>Promoção:</strong> o peão que chega ao fim vira dama, torre, bispo ou cavalo.</li>
            <li><strong>En passant:</strong> captura especial de peão, disponível somente no lance seguinte.</li>
          </ul>
        </RuleCard>
        <RuleCard icon={CheckCircle2} title="Xeque, mate e empate">
          <ul className="clean-list">
            <li>Em <strong>xeque</strong>, você precisa proteger o rei imediatamente.</li>
            <li>No <strong>xeque-mate</strong>, a partida termina.</li>
            <li>Pode haver empate por afogamento, acordo, repetição, regra dos 50 lances ou material insuficiente.</li>
          </ul>
        </RuleCard>
        <RuleCard icon={Trophy} title="Boa conduta no torneio">
          <p>Use apenas uma mão para mover e acionar o relógio. Peça tocada deve ser jogada quando houver lance legal. Em dúvida, pare o relógio e chame o professor/árbitro.</p>
        </RuleCard>
      </div>
      <ResourceLinks tournament="chess" />
    </>
  );
}

export default function TournamentRules({ tournament, disks }) {
  return (
    <main className="panel rules-guide">
      <header className="rules-header">
        <div className="rules-header-icon"><BookOpen /></div>
        <div>
          <span className="rules-kicker">Guia rápido</span>
          <h2>Como jogar</h2>
          <p>Leia o essencial, faça uma rodada de treino e volte aqui quando surgir uma dúvida.</p>
        </div>
      </header>

      {tournament === "hanoi" && <HanoiRules disks={disks} />}
      {tournament === "cube" && <CubeRules />}
      {tournament === "checkers" && <CheckersRules />}
      {tournament === "chess" && <ChessRules />}
    </main>
  );
}
