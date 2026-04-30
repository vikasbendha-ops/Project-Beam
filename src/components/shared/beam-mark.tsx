import { cn } from "@/lib/utils";

interface BeamMarkProps {
  className?: string;
  size?: number;
}

/**
 * Beam logo mark — indigo squircle with stylised beam-of-light glyph.
 */
export function BeamMark({ className, size = 48 }: BeamMarkProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label="Beam logo"
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="3.5" fill="currentColor" />
      </svg>
    </div>
  );
}

/**
 * Beam wordmark — Plus Jakarta Sans 700, indigo, tight tracking.
 */
export function BeamWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-sans text-2xl font-extrabold tracking-tight text-primary",
        className,
      )}
    >
      Beam
    </span>
  );
}
