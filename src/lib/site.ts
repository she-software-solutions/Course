export const site = {
  name: "She Software Solutions",
  shortName: "She Learn",
  tagline: "Innovating Ideas, Delivering Solutions",
  description:
    "Industry-ready online video courses, internships and workshops by She Software Solutions — a women-led technology company empowering students, freshers and professionals.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  website: "https://www.shesoftwaresolutions.com",
  emails: ["contact@shesoftwaresolutions.com", "shesoftwaresolutions@gmail.com"],
  phones: ["+91-7010375308", "+91-9677695308"],
  whatsapp: "917010375308",
  locations: ["Salem, Tamil Nadu, India", "Chennai, Tamil Nadu, India"],
  responseTime: "Within 24 hours",
  social: {
    instagram: "https://www.instagram.com/she_software_solutions/",
    linkedin: "https://www.linkedin.com/company/she-software-solutions/",
  },
} as const;
