import { playTabSound, playWinSound, playMenuSound } from "./sounds.js";
export default function HanoiIcon({ size = 42 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="hanoi-flat-icon"
    >
      {/* base */}
      <rect x="18" y="94" width="84" height="10" rx="5" fill="#2C2C2E" />

      {/* hastes */}
      <rect x="28" y="30" width="8" height="64" rx="4" fill="#2C2C2E" />
      <rect x="56" y="18" width="8" height="76" rx="4" fill="#2C2C2E" />
      <rect x="84" y="42" width="8" height="52" rx="4" fill="#2C2C2E" />

      {/* discos na haste central */}
      <rect x="30" y="74" width="60" height="12" rx="6" fill="#FF9F0A" />
      <rect x="38" y="60" width="44" height="11" rx="5.5" fill="#FFD60A" />
      <rect x="45" y="47" width="30" height="10" rx="5" fill="#AF52DE" />
      <rect x="51" y="35" width="18" height="9" rx="4.5" fill="#64D2FF" />
    </svg>
  );
}
