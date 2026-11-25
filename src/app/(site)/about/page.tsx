import type { Metadata } from "next";
import Image from "next/image";
import { HeartHandshake, Lightbulb, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About us", description: "She Software Solutions is a women-led technology company empowering learners and businesses." };

const values = [
  { icon: Lightbulb, t: "Innovation", d: "Pushing boundaries with creative solutions and cutting-edge technology." },
  { icon: Zap, t: "Quality", d: "Delivering excellence in every project with attention to detail." },
  { icon: HeartHandshake, t: "Trust", d: "Building lasting relationships through transparency and reliability." },
  { icon: TrendingUp, t: "Growth", d: "Empowering learners and businesses to reach their full potential." },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-hero text-white">
        <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-2">
          <div>
            <p className="font-display tracking-[0.25em] text-brand">ABOUT US</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{site.tagline}</h1>
            <p className="mt-5 text-lg text-white/75">
              We are a women-led technology company empowering students, freshers, startups and businesses through accessible, ethical and impactful digital solutions.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm rounded-[2rem] bg-white p-8">
            <Image src="/brand/logo-round-light.png" alt={site.name} width={806} height={764} className="h-auto w-full" />
          </div>
        </div>
      </section>

      <section className="container-page grid gap-6 py-16 md:grid-cols-2">
        <div className="rounded-3xl border bg-card p-8">
          <Sparkles className="h-8 w-8 text-primary" />
          <h2 className="mt-4 text-2xl font-bold">Our mission</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            To deliver high-quality, affordable IT services and learning while creating opportunities for learning, innovation and professional growth. She Learn brings that mission online — so
            anyone, anywhere can learn industry-ready skills from practising mentors.
          </p>
        </div>
        <div className="rounded-3xl border bg-card p-8">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h2 className="mt-4 text-2xl font-bold">Our vision</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            A future where talent is recognised by skill and effort, technology is affordable and meaningful, and education and industry work together to build inclusive growth.
          </p>
        </div>
      </section>

      <section className="bg-muted/60 py-16">
        <div className="container-page">
          <h2 className="text-center text-3xl font-bold">Our values</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.t} className="rounded-2xl border bg-card p-6 text-center">
                <div className="mx-auto inline-flex rounded-xl bg-accent p-3 text-accent-foreground">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold">{v.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">More than courses</h2>
            <p className="mt-3 text-muted-foreground">
              Beyond She Learn, our team builds websites, mobile apps and AI/ML solutions for businesses, guides student projects, runs workshops and hackathons, and helps new entrepreneurs set up their
              startups.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href={site.website} target="_blank">
                Explore our IT services
              </LinkButton>
              <LinkButton href="/contact" variant="outline">
                Talk to us
              </LinkButton>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {["Web & app development", "Student projects & internships", "Technical documentation & reports", "Startup setup & consulting", "Workshops & hackathons", "Poster, logo & brochure design"].map((s) => (
              <li key={s} className="rounded-xl border bg-card px-4 py-3 text-sm font-medium">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
