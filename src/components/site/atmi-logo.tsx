import Image from "next/image";

export function AtmiLogo({
  variant = "dark",
  className,
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const textMain = variant === "dark" ? "text-atmi-navy" : "text-white";
  const textSub = variant === "dark" ? "text-muted-foreground" : "text-white/70";
  // Versi "light" dipakai di footer (latar navy gelap), jadi logonya putih.
  const logoSrc = variant === "dark" ? "/logo-atmi.png" : "/logo-atmi-putih.png";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <Image
        src={logoSrc}
        alt=""
        width={40}
        height={40}
        aria-hidden="true"
        className="h-10 w-10 shrink-0 object-contain"
      />
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
