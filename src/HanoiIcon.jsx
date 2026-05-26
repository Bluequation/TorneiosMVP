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
      <rect x="18" y="94" width="84" height="10" rx="5" fill="#2A1E3F" />

      {/* hastes */}
      <rect x="28" y="30" width="8" height="64" rx="4" fill="#2A1E3F" />
      <rect x="56" y="18" width="8" height="76" rx="4" fill="#2A1E3F" />
      <rect x="84" y="42" width="8" height="52" rx="4" fill="#2A1E3F" />

      {/* discos na haste central */}
      <rect x="30" y="74" width="60" height="12" rx="6" fill="#FF8A65" />
      <rect x="38" y="60" width="44" height="11" rx="5.5" fill="#FFD166" />
      <rect x="45" y="47" width="30" height="10" rx="5" fill="#7E57C2" />
      <rect x="51" y="35" width="18" height="9" rx="4.5" fill="#4FC3F7" />

      {/* brilho sutil */}
      <path
        d="M34 75H84"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}