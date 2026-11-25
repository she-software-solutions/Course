import Image from "next/image";
import { Award, CircleCheck, Users } from "lucide-react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
      <div className="bg-hero relative hidden flex-col justify-between p-12 text-white lg:flex">
        <div>
          <p className="font-display text-sm tracking-[0.25em] text-brand">SHE LEARN</p>
          <h2 className="mt-4 max-w-md text-4xl font-extrabold leading-tight">Skills that get you hired. Mentors who care.</h2>
          <ul className="mt-8 space-y-4 text-white/80">
            {[
              { icon: CircleCheck, t: "Project-based video courses" },
              { icon: Users, t: "Doubt clearing with real tutors" },
              { icon: Award, t: "Verifiable certificates & internships" },
            ].map((x) => (
              <li key={x.t} className="flex items-center gap-3">
                <span className="rounded-lg bg-white/10 p-2">
                  <x.icon className="h-5 w-5 text-brand" />
                </span>
                {x.t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-6">
          <Image src="/brand/logo-light.png" alt="She Software Solutions" width={628} height={323} className="h-auto w-56" />
          <p className="mt-3 text-sm text-ink/70">Innovating Ideas, Delivering Solutions</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8 space-y-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
