export default function CubeIcon({ size = 42 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="cube-flat-icon"
    >
      <rect
        x="16"
        y="16"
        width="88"
        height="88"
        rx="18"
        fill="#1C1C1E"
      />

      <rect x="25" y="25" width="21" height="21" rx="5" fill="#FF453A" />
      <rect x="49.5" y="25" width="21" height="21" rx="5" fill="#FFD60A" />
      <rect x="74" y="25" width="21" height="21" rx="5" fill="#0A84FF" />

      <rect x="25" y="49.5" width="21" height="21" rx="5" fill="#30D158" />
      <rect x="49.5" y="49.5" width="21" height="21" rx="5" fill="#FFFFFF" />
      <rect x="74" y="49.5" width="21" height="21" rx="5" fill="#FF9F0A" />

      <rect x="25" y="74" width="21" height="21" rx="5" fill="#0A84FF" />
      <rect x="49.5" y="74" width="21" height="21" rx="5" fill="#FF453A" />
      <rect x="74" y="74" width="21" height="21" rx="5" fill="#FFD60A" />
    </svg>
  );
}
