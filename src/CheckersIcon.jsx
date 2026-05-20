export default function CheckersIcon({ size = 42 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="checkers-flat-icon"
    >
      <rect x="16" y="16" width="88" height="88" rx="18" fill="#2A1E3F" />

      <rect x="25" y="25" width="17" height="17" fill="#FFF4DF" />
      <rect x="42" y="25" width="17" height="17" fill="#2A1E3F" />
      <rect x="59" y="25" width="17" height="17" fill="#FFF4DF" />
      <rect x="76" y="25" width="17" height="17" fill="#2A1E3F" />

      <rect x="25" y="42" width="17" height="17" fill="#2A1E3F" />
      <rect x="42" y="42" width="17" height="17" fill="#FFF4DF" />
      <rect x="59" y="42" width="17" height="17" fill="#2A1E3F" />
      <rect x="76" y="42" width="17" height="17" fill="#FFF4DF" />

      <rect x="25" y="59" width="17" height="17" fill="#FFF4DF" />
      <rect x="42" y="59" width="17" height="17" fill="#2A1E3F" />
      <rect x="59" y="59" width="17" height="17" fill="#FFF4DF" />
      <rect x="76" y="59" width="17" height="17" fill="#2A1E3F" />

      <rect x="25" y="76" width="17" height="17" fill="#2A1E3F" />
      <rect x="42" y="76" width="17" height="17" fill="#FFF4DF" />
      <rect x="59" y="76" width="17" height="17" fill="#2A1E3F" />
      <rect x="76" y="76" width="17" height="17" fill="#FFF4DF" />

      <circle cx="34" cy="34" r="8" fill="#E53935" stroke="#15151F" strokeWidth="3" />
      <circle cx="68" cy="34" r="8" fill="#E53935" stroke="#15151F" strokeWidth="3" />
      <circle cx="51" cy="68" r="8" fill="#FFD166" stroke="#15151F" strokeWidth="3" />
      <circle cx="85" cy="68" r="8" fill="#FFD166" stroke="#15151F" strokeWidth="3" />
    </svg>
  );
}