import type { MouseEvent } from "react";

type BrandProps = {
  className?: string;
  href?: string;
  label?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function Brand({ className = "", href = "#overview", label = "Morrow, a better tomorrow", onClick }: BrandProps) {
  return (
    <a className={`brand ${className}`.trim()} href={href} aria-label={label} onClick={onClick}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false"><path d="M4 17h16M6 17a6 6 0 0 1 12 0M12 3v3M4.9 7.9 7 10M19.1 7.9 17 10" /></svg>
      </span>
      <span className="brand-copy">
        <span className="brand-name">morrow<span className="brand-period">.</span></span>
        <span className="brand-tagline">A better tomorrow</span>
      </span>
    </a>
  );
}