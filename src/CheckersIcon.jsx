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
      <rect x="16" y="16" width="88" height="88" rx="18" fill="#1C1C1E" />

      <rect x="25" y="25" width="17" height="17" fill="#F5F5F7" />
      <rect x="42" y="25" width="17" height="17" fill="#1C1C1E" />
      <rect x="59" y="25" width="17" height="17" fill="#F5F5F7" />
      <rect x="76" y="25" width="17" height="17" fill="#1C1C1E" />

      <rect x="25" y="42" width="17" height="17" fill="#1C1C1E" />
      <rect x="42" y="42" width="17" height="17" fill="#F5F5F7" />
      <rect x="59" y="42" width="17" height="17" fill="#1C1C1E" />
      <rect x="76" y="42" width="17" height="17" fill="#F5F5F7" />

      <rect x="25" y="59" width="17" height="17" fill="#F5F5F7" />
      <rect x="42" y="59" width="17" height="17" fill="#1C1C1E" />
      <rect x="59" y="59" width="17" height="17" fill="#F5F5F7" />
      <rect x="76" y="59" width="17" height="17" fill="#1C1C1E" />

      <rect x="25" y="76" width="17" height="17" fill="#1C1C1E" />
      <rect x="42" y="76" width="17" height="17" fill="#F5F5F7" />
      <rect x="59" y="76" width="17" height="17" fill="#1C1C1E" />
      <rect x="76" y="76" width="17" height="17" fill="#F5F5F7" />

      <circle cx="34" cy="34" r="8" fill="#FF453A" stroke="#1C1C1E" strokeWidth="3" />
      <circle cx="68" cy="34" r="8" fill="#FF453A" stroke="#1C1C1E" strokeWidth="3" />
      <circle cx="51" cy="68" r="8" fill="#FFCC00" stroke="#1C1C1E" strokeWidth="3" />
      <circle cx="85" cy="68" r="8" fill="#FFCC00" stroke="#1C1C1E" strokeWidth="3" />
    </svg>
  );
}
