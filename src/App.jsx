import { useState } from "react";
import HomeScreen from "./HomeScreen.jsx";
import ChessTournament from "./ChessTournament.jsx";
import CubeTournament from "./CubeTournament.jsx";
import HanoiTournament from "./HanoiTournament.jsx";
import CheckersTournament from "./CheckersTournament.jsx";


export default function App() {
  const [mode, setMode] = useState(null);

  if (!mode) {
    return <HomeScreen onSelectMode={setMode} />;
  }

  if (mode === "chess") {
    return <ChessTournament onBack={() => setMode(null)} />;
  }

  if (mode === "cube") {
    return <CubeTournament onBack={() => setMode(null)} />;
  }

  if (mode === "hanoi") {
    return <HanoiTournament onBack={() => setMode(null)} />;
  }

  if (mode === "checkers") {
  return <CheckersTournament onBack={() => setMode(null)} />;
}
  return null;
}