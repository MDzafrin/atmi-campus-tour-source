export function AtmiLogo({
  variant = "dark",
  className,
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const textMain = variant === "dark" ? "text-atmi-navy" : "text-white";
  const textSub = variant === "dark" ? "text-muted-foreground" : "text-white/70";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="48" height="48" rx="10" fill="#CE2029" />
        <path
          d="M24 9l3.2 6.5 7.2 1-5.2 5 1.2 7.1L24 25.2l-6.4 3.4 1.2-7.1-5.2-5 7.2-1L24 9z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <path
          d="M15 34.5c2.5-2.4 5.6-3.6 9-3.6s6.5 1.2 9 3.6"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="leading-tight">
        <span className={`block text-[10px] font-semibold tracking-[0.18em] uppercase ${textSub}`}>
          Politeknik Industri
        </span>
        <span className={`block text-lg font-extrabold tracking-tight ${textMain}`}>
          ATMI Cikarang
        </span>
      </span>
    </span>
  );
}
