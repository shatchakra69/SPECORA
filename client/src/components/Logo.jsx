// SPECORA wings, line-art style. Scales via the width prop, colors via currentColor.
export default function Logo({ width = 36, className = '' }) {
  return (
    <svg
      className={className}
      width={width}
      height={width * 0.46}
      viewBox="0 0 140 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SPECORA logo"
    >
      <path d="M72 50 C80 33 97 18 126 10 C107 25 96 34 88 45" />
      <path d="M74 53 C84 42 99 33 118 29 C103 40 94 47 88 52" />
      <path d="M76 56 C86 49 99 45 110 45 C99 51 92 55 86 57" />
      <path d="M68 50 C60 33 43 18 14 10 C33 25 44 34 52 45" />
      <path d="M66 53 C56 42 41 33 22 29 C37 40 46 47 52 52" />
      <path d="M64 56 C54 49 41 45 30 45 C41 51 48 55 54 57" />
    </svg>
  )
}
