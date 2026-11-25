import type { Metadata } from "next";
import { Clock, Globe, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { InstagramIcon, LinkedinIcon, WhatsappIcon } from "@/components/ui/brand-icons";
import { Card } from "@/components/ui/misc";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact us", description: "Get in touch with She Software Solutions." };

export default function ContactPage() {
  return (
    <>
      <section className="bg-hero text-white">
        <div className="container-page py-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Contact us</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/75">Questions about a course, payments, internships or partnering with us? We&apos;d love to hear from you.</p>
        </div>
      </section>
      <section className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <Card className="space-y-5 p-6">
            <Info icon={<Mail />} title="Email">
              {site.emails.map((e) => (
                <a key={e} href={`mailto:${e}`} className="block break-all hover:text-primary">
                  {e}
                </a>
              ))}
            </Info>
            <Info icon={<Phone />} title="Phone / WhatsApp">
              {site.phones.map((p) => (
                <a key={p} href={`tel:${p.replace(/-/g, "")}`} className="block hover:text-primary">
                  {p}
                </a>
              ))}
            </Info>
            <Info icon={<MapPin />} title="Locations">
              {site.locations.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </Info>
            <Info icon={<Globe />} title="Website">
              <a href={site.website} target="_blank" rel="noreferrer" className="hover:text-primary">
                www.shesoftwaresolutions.com
              </a>
            </Info>
            <Info icon={<Clock />} title="Response time">
              {site.responseTime}
            </Info>
          </Card>
          <div className="flex gap-2">
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
              <WhatsappIcon className="h-5 w-5" /> Chat on WhatsApp
            </a>
            <a href={site.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-xl border bg-card p-3 hover:text-primary">
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a href={site.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="rounded-xl border bg-card p-3 hover:text-primary">
              <LinkedinIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
        <Card className="p-6 sm:p-8">
          <h2 className="text-xl font-bold">Send us a message</h2>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">We usually reply within 24 hours.</p>
          <ContactForm subjects={["Course enquiry", "Payment or refund", "Internships", "Corporate / college training", "Partnership", "Other"]} defaultSubject="Course enquiry" />
        </Card>
      </section>
    </>
  );
}

function Info({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="h-fit rounded-xl bg-accent p-2.5 text-accent-foreground [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      <div className="text-sm">
        <p className="font-semibold">{title}</p>
        <div className="mt-0.5 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
