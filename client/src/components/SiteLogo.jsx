/** Эмблема «Культурный Навигатор» — компас + маркер события */
export default function SiteLogo({ size = 40, className = "" }) {
  const dimension = typeof size === "number" ? size : 40;
  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <rect width="48" height="48" rx="14" fill="#4f46e5" />
      <circle cx="24" cy="24" r="14" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      <path
        d="M24 10v4M24 34v4M10 24h4M34 24h4"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      <path
        d="M24 16c-3.5 0-6.5 2.8-6.5 6.5 0 4.5 6.5 11.5 6.5 11.5s6.5-7 6.5-11.5C30.5 18.8 27.5 16 24 16z"
        fill="white"
      />
      <circle cx="24" cy="22.5" r="2.2" fill="#4f46e5" />
    </svg>
  );
}
