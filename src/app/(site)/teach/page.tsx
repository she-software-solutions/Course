import type { Metadata } from "next";
import { BadgeIndianRupee, Clapperboard, HeartHandshake, Users } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { Card } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Teach with us", description: "Become a tutor on She Learn and share your expertise with thousands of learners." };

export default function TeachPage() {
  return (
    <>
      <section className="bg-hero text-white">
        <div className="container-page py-16">
          <p className="font-display tracking-[0.25em] text-brand">BECOME A TUTOR</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">Share your knowledge. Shape careers.</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">Publish video courses on She Learn, mentor learners through Q&amp;A and assignments, and earn from every enrollment.</p>
        </div>
      </section>
      <section className="container-page grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Clapperboard, t: "Simple course builder", d: "Organise sections, lessons, quizzes and assignments — just paste your YouTube or Vimeo links." },
          { icon: Users, t: "Engaged learners", d: "Students, freshers and professionals eager to build real skills." },
          { icon: BadgeIndianRupee, t: "Earn on every sale", d: "Track enrollments and revenue in your tutor studio." },
          { icon: HeartHandshake, t: "Supportive team", d: "Our team reviews quality and helps you launch successfully." },
        ].map((x) => (
          <Card key={x.t} className="p-6">
            <x.icon className="h-7 w-7 text-primary" />
            <h3 className="mt-3 font-semibold">{x.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{x.d}</p>
          </Card>
        ))}
      </section>
      <section className="container-page grid gap-8 pb-16 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="text-2xl font-bold">How it works</h2>
          <ol className="mt-5 space-y-4">
            {[
              "Create a free She Learn account.",
              "Tell us about yourself and what you'd like to teach using this form.",
              "Our team reviews your profile and upgrades your account to Tutor.",
              "Build your course in the Tutor studio and submit it for review.",
              "Once approved, your course goes live in the catalog.",
            ].map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
                <span className="pt-0.5 text-sm">{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <Card className="p-6 sm:p-8">
          <h2 className="text-xl font-bold">Apply to teach</h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Use the same email as your She Learn account. Include your expertise, experience and course idea.</p>
          <ContactForm defaultSubject="Tutor application" />
        </Card>
      </section>
    </>
  );
}
