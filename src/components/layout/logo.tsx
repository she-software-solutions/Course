import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Brand logo that swaps between light / dark artwork. `invert` forces the dark-background version. */
export function Logo({ className, height = 44, invert = false }: { className?: string; height?: number; invert?: boolean }) {
  const width = Math.round(height * (628 / 323));
  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center", className)} aria-label="She Software Solutions — home">
      {invert ? (
        <Image src="/brand/logo-dark.png" alt="She Software Solutions" width={width} height={height} priority />
      ) : (
        <>
          <Image src="/brand/logo-light.png" alt="She Software Solutions" width={width} height={height} priority className="dark:hidden" />
          <Image
            src="/brand/logo-dark.png"
            alt="She Software Solutions"
            width={width}
            height={height}
            priority
            className="hidden dark:block"
          />
        </>
      )}
    </Link>
  );
}
