import Link from "next/link";
import { BeamMark } from "@/components/shared/beam-mark";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  showLogo?: boolean;
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  className,
  showLogo = true,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-[440px] flex-col gap-7 rounded-[14px] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_4px_12px_rgba(28,25,23,0.05)] sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-5 text-center">
        {showLogo ? (
          <Link href="/" aria-label="Beam home">
            <BeamMark size={48} />
          </Link>
        ) : null}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[28px] sm:leading-[1.3]">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {children}
      {footer ? (
        <div className="text-center text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
