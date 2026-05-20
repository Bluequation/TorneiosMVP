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
        fill="#15151f"
      />

      <rect x="25" y="25" width="21" height="21" rx="5" fill="#e53935" />
      <rect x="49.5" y="25" width="21" height="21" rx="5" fill="#ffd54f" />
      <rect x="74" y="25" width="21" height="21" rx="5" fill="#1e88e5" />

      <rect x="25" y="49.5" width="21" height="21" rx="5" fill="#43a047" />
      <rect x="49.5" y="49.5" width="21" height="21" rx="5" fill="#ffffff" />
      <rect x="74" y="49.5" width="21" height="21" rx="5" fill="#f57c00" />

      <rect x="25" y="74" width="21" height="21" rx="5" fill="#1e88e5" />
      <rect x="49.5" y="74" width="21" height="21" rx="5" fill="#e53935" />
      <rect x="74" y="74" width="21" height="21" rx="5" fill="#ffd54f" />

      <path
        d="M28 21C22 23 18 28 17 35"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}