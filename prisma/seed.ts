/**
 * Seed script.
 *   npm run db:seed                 → admin + categories + demo content
 *   SEED_DEMO=false npm run db:seed → admin + categories only (use for production)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const demo = process.env.SEED_DEMO !== "false";

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;
// Placeholder lesson videos (public freeCodeCamp tutorials). Tutors replace these with their own links.
const V = {
  js: yt("PkZNo7MFNFg"),
  python: yt("rfscVS0vtbw"),
  react: yt("bMknfKXIFA8"),
  html: yt("pQN-pnXPaVg"),
  ml: yt("i_LwzRVP7bg"),
  sql: yt("HXV3zeQKqGY"),
  git: yt("RGOj5yH7evk"),
  flutter: yt("VPvVD8t02U8"),
};

const categories = [
  { name: "Web Development", slug: "web-development", icon: "code", description: "Front-end, back-end and full-stack engineering." },
  { name: "Programming", slug: "programming", icon: "terminal", description: "Core programming languages and problem solving." },
  { name: "Data Science & AI", slug: "data-science-ai", icon: "brain", description: "Machine learning, analytics and artificial intelligence." },
  { name: "Mobile Development", slug: "mobile-development", icon: "smartphone", description: "Android, iOS and cross-platform apps." },
  { name: "UI/UX Design", slug: "ui-ux-design", icon: "palette", description: "Design thinking, prototyping and interfaces." },
  { name: "Databases", slug: "databases", icon: "database", description: "SQL, data modelling and database design." },
  { name: "Career & Interview Prep", slug: "career", icon: "briefcase", description: "Portfolios, resumes and interview readiness." },
  { name: "Tools & DevOps", slug: "tools-devops", icon: "git", description: "Git, CI/CD and modern developer workflows." },
];

type L = { t: string; v: string; d: number; p?: boolean; desc?: string };
type Q = { prompt: string; options: string[]; correct: number; explanation?: string };
type S = { title: string; lessons: L[]; quiz?: { title: string; questions: Q[] }; assignment?: { title: string; instructions: string } };
type C = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  tutor: "priya" | "kavya" | "anitha";
  price: number;
  mrp?: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  featured?: boolean;
  outcomes: string[];
  requirements: string[];
  sections: S[];
};

const courses: C[] = [
  {
    slug: "full-stack-web-development-react-nextjs",
    title: "Full-Stack Web Development with React & Next.js",
    subtitle: "Build and deploy production-grade web apps from scratch — the way real teams do it.",
    description:
      "A complete, project-driven path from HTML and CSS fundamentals to building full-stack applications with React and Next.js. You will learn component design, state management, routing, APIs, authentication and deployment while building a portfolio-ready capstone project reviewed by mentors.",
    category: "web-development",
    tutor: "priya",
    price: 299900,
    mrp: 799900,
    level: "BEGINNER",
    featured: true,
    outcomes: [
      "Build responsive layouts with semantic HTML and modern CSS",
      "Write clean, modern JavaScript (ES2023+)",
      "Create reusable React components with hooks",
      "Build full-stack apps with Next.js App Router and server actions",
      "Connect to databases and implement authentication",
      "Deploy your app and present it in your portfolio",
    ],
    requirements: ["A laptop with internet access", "No prior coding experience needed", "Curiosity and consistency"],
    sections: [
      {
        title: "Getting Started with the Web",
        lessons: [
          { t: "Welcome & how this course works", v: V.html, d: 6, p: true, desc: "Course roadmap, mentorship and how to get your certificate." },
          { t: "How the web works", v: V.html, d: 14, p: true },
          { t: "HTML essentials", v: V.html, d: 28 },
          { t: "Modern CSS & Flexbox", v: V.html, d: 32 },
        ],
        quiz: {
          title: "Web fundamentals check",
          questions: [
            { prompt: "Which HTML element is most appropriate for the main navigation?", options: ["<div>", "<nav>", "<section>", "<header>"], correct: 1 },
            { prompt: "Which CSS property makes a container a flexbox?", options: ["display: block", "position: flex", "display: flex", "flex: 1"], correct: 2 },
            { prompt: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "High Transfer Text Process", "Hyperlink Text Transport Protocol", "Host Transfer Type Protocol"], correct: 0 },
          ],
        },
      },
      {
        title: "JavaScript for Developers",
        lessons: [
          { t: "Variables, types and functions", v: V.js, d: 25 },
          { t: "Arrays, objects and iteration", v: V.js, d: 30 },
          { t: "Async JavaScript & fetch", v: V.js, d: 27 },
        ],
      },
      {
        title: "React Fundamentals",
        lessons: [
          { t: "Thinking in components", v: V.react, d: 22 },
          { t: "State & events with hooks", v: V.react, d: 31 },
          { t: "Lists, forms and effects", v: V.react, d: 29 },
        ],
        assignment: {
          title: "Build a personal portfolio page in React",
          instructions:
            "Create a responsive single-page portfolio using React with at least: a hero section, a projects grid driven by an array of data, and a contact form with validation. Push it to GitHub and share the repository link (and live link if deployed).",
        },
      },
      {
        title: "Full-Stack with Next.js",
        lessons: [
          { t: "App Router, layouts and routing", v: V.react, d: 26 },
          { t: "Server components & server actions", v: V.react, d: 34 },
          { t: "Databases, auth and deployment", v: V.react, d: 38 },
        ],
      },
    ],
  },
  {
    slug: "python-programming-for-beginners",
    title: "Python Programming for Beginners",
    subtitle: "Start coding with the world's most beginner-friendly language.",
    description:
      "Learn Python from zero: variables, control flow, functions, data structures and file handling, with hands-on exercises after every lesson. Ideal for students and freshers starting their programming journey.",
    category: "programming",
    tutor: "kavya",
    price: 0,
    level: "BEGINNER",
    outcomes: ["Write Python programs confidently", "Use lists, dictionaries and sets", "Write reusable functions", "Read and write files", "Solve beginner coding problems"],
    requirements: ["No programming experience required"],
    sections: [
      {
        title: "Python Basics",
        lessons: [
          { t: "Installing Python & your first program", v: V.python, d: 12, p: true },
          { t: "Variables and data types", v: V.python, d: 18 },
          { t: "Conditions and loops", v: V.python, d: 24 },
        ],
        quiz: {
          title: "Python basics quiz",
          questions: [
            { prompt: "Which keyword defines a function in Python?", options: ["func", "def", "function", "lambda"], correct: 1 },
            { prompt: "What is the output of len([1, 2, 3])?", options: ["2", "3", "4", "Error"], correct: 1 },
            { prompt: "Which type is immutable?", options: ["list", "dict", "tuple", "set"], correct: 2 },
          ],
        },
      },
      {
        title: "Working with Data",
        lessons: [
          { t: "Lists and tuples", v: V.python, d: 20 },
          { t: "Dictionaries and sets", v: V.python, d: 19 },
          { t: "Functions and modules", v: V.python, d: 26 },
        ],
        assignment: {
          title: "Student marks analyser",
          instructions: "Write a Python program that reads student names and marks, then prints the class average, topper and a grade for each student. Share a GitHub or Google Drive link to your code.",
        },
      },
    ],
  },
  {
    slug: "machine-learning-foundations-python",
    title: "Machine Learning Foundations with Python",
    subtitle: "Understand and build ML models — from regression to neural networks.",
    description:
      "A practical introduction to machine learning using Python, NumPy, pandas and scikit-learn. Covers supervised and unsupervised learning, model evaluation and a final project you can add to your resume.",
    category: "data-science-ai",
    tutor: "anitha",
    price: 349900,
    mrp: 899900,
    level: "INTERMEDIATE",
    featured: true,
    outcomes: ["Prepare and explore datasets with pandas", "Train regression and classification models", "Evaluate models with the right metrics", "Understand neural network basics", "Ship an end-to-end ML project"],
    requirements: ["Basic Python knowledge", "High-school mathematics"],
    sections: [
      {
        title: "Introduction to Machine Learning",
        lessons: [
          { t: "What is machine learning?", v: V.ml, d: 15, p: true },
          { t: "Data preparation with pandas", v: V.ml, d: 28 },
          { t: "Your first model: linear regression", v: V.ml, d: 30 },
        ],
        quiz: {
          title: "ML concepts quiz",
          questions: [
            { prompt: "Predicting house prices is an example of…", options: ["Classification", "Regression", "Clustering", "Reinforcement learning"], correct: 1 },
            { prompt: "Which split is used to measure performance on unseen data?", options: ["Training set", "Test set", "Feature set", "Label set"], correct: 1 },
            { prompt: "K-Means is a … algorithm.", options: ["Supervised", "Unsupervised", "Reinforcement", "Rule-based"], correct: 1 },
          ],
        },
      },
      {
        title: "Classification & Evaluation",
        lessons: [
          { t: "Logistic regression & decision trees", v: V.ml, d: 33 },
          { t: "Precision, recall and the confusion matrix", v: V.ml, d: 21 },
          { t: "Neural networks: an intuition", v: V.ml, d: 27 },
        ],
        assignment: {
          title: "Predict student placement outcomes",
          instructions: "Using any public placement dataset, build a classification model, report accuracy, precision and recall, and explain your feature choices. Submit a Colab/GitHub notebook link.",
        },
      },
    ],
  },
  {
    slug: "flutter-app-development",
    title: "Flutter App Development: Android & iOS",
    subtitle: "Ship beautiful cross-platform mobile apps from a single codebase.",
    description: "Learn Dart and Flutter to build fast, beautiful apps for Android and iOS. Covers widgets, layouts, navigation, state management, REST APIs and publishing to the stores.",
    category: "mobile-development",
    tutor: "priya",
    price: 249900,
    mrp: 599900,
    level: "BEGINNER",
    outcomes: ["Write Dart confidently", "Compose UIs with Flutter widgets", "Manage state and navigation", "Consume REST APIs", "Prepare apps for Play Store and App Store"],
    requirements: ["Basic programming knowledge", "A computer that can run Android Studio"],
    sections: [
      {
        title: "Dart & Flutter Basics",
        lessons: [
          { t: "Setting up Flutter", v: V.flutter, d: 16, p: true },
          { t: "Dart language essentials", v: V.flutter, d: 29 },
          { t: "Widgets and layouts", v: V.flutter, d: 31 },
        ],
        quiz: {
          title: "Flutter fundamentals quiz",
          questions: [
            { prompt: "Which language is used to write Flutter apps?", options: ["Kotlin", "Swift", "Dart", "JavaScript"], correct: 2 },
            { prompt: "Which widget has mutable state?", options: ["StatelessWidget", "StatefulWidget", "Container", "Text"], correct: 1 },
          ],
        },
      },
      {
        title: "Building Real Apps",
        lessons: [
          { t: "Navigation and routing", v: V.flutter, d: 22 },
          { t: "State management", v: V.flutter, d: 34 },
          { t: "Working with REST APIs", v: V.flutter, d: 28 },
        ],
      },
    ],
  },
  {
    slug: "ui-ux-design-essentials",
    title: "UI/UX Design Essentials",
    subtitle: "Design intuitive, accessible interfaces users love.",
    description: "Master the fundamentals of user experience and interface design: research, wireframing, visual hierarchy, typography, colour, accessibility and prototyping — with a case study for your portfolio.",
    category: "ui-ux-design",
    tutor: "kavya",
    price: 199900,
    mrp: 499900,
    level: "ALL_LEVELS",
    outcomes: ["Apply the design thinking process", "Create wireframes and prototypes", "Use typography, colour and spacing well", "Design for accessibility", "Present a UX case study"],
    requirements: ["No design experience needed", "A free Figma account"],
    sections: [
      {
        title: "Foundations of UX",
        lessons: [
          { t: "What is UX design?", v: V.html, d: 12, p: true },
          { t: "User research & personas", v: V.html, d: 20 },
          { t: "Information architecture & wireframes", v: V.html, d: 24 },
        ],
      },
      {
        title: "Visual & Interaction Design",
        lessons: [
          { t: "Typography, colour and spacing", v: V.html, d: 26 },
          { t: "Accessibility essentials", v: V.html, d: 18 },
          { t: "Prototyping and usability testing", v: V.html, d: 23 },
        ],
        assignment: { title: "Redesign a college website homepage", instructions: "Pick any college website, identify 3 usability problems and design an improved homepage in Figma. Share the Figma link with a short explanation of your decisions." },
      },
    ],
  },
  {
    slug: "git-and-github-for-teams",
    title: "Git & GitHub for Teams",
    subtitle: "Version control and collaboration workflows every developer needs.",
    description: "Learn Git from the ground up and collaborate like a professional: branching, merging, pull requests, code reviews and resolving conflicts.",
    category: "tools-devops",
    tutor: "anitha",
    price: 0,
    level: "BEGINNER",
    outcomes: ["Track changes with Git", "Branch, merge and resolve conflicts", "Collaborate through pull requests", "Follow team Git workflows"],
    requirements: ["Basic computer skills"],
    sections: [
      {
        title: "Git Essentials",
        lessons: [
          { t: "Why version control?", v: V.git, d: 8, p: true },
          { t: "Commits, branches and merges", v: V.git, d: 22 },
          { t: "GitHub, pull requests and reviews", v: V.git, d: 20 },
        ],
        quiz: {
          title: "Git quiz",
          questions: [
            { prompt: "Which command creates a new branch and switches to it?", options: ["git branch -d", "git switch -c", "git merge", "git push -u"], correct: 1 },
            { prompt: "A pull request is used to…", options: ["Delete a repo", "Propose and review changes", "Clone a repo", "Revert a commit"], correct: 1 },
          ],
        },
      },
    ],
  },
  {
    slug: "sql-and-database-design",
    title: "SQL & Database Design",
    subtitle: "Query, model and optimise relational databases.",
    description: "From SELECT statements to normalised schema design: learn SQL hands-on with PostgreSQL and MySQL, including joins, aggregations, indexes and transactions.",
    category: "databases",
    tutor: "anitha",
    price: 149900,
    mrp: 399900,
    level: "BEGINNER",
    outcomes: ["Write SELECT, JOIN and GROUP BY queries", "Design normalised schemas", "Use indexes and transactions", "Model real-world applications"],
    requirements: ["No prior database knowledge"],
    sections: [
      {
        title: "Querying Data",
        lessons: [
          { t: "Relational databases explained", v: V.sql, d: 14, p: true },
          { t: "SELECT, WHERE and ORDER BY", v: V.sql, d: 21 },
          { t: "Joins and aggregations", v: V.sql, d: 29 },
        ],
      },
      {
        title: "Designing Databases",
        lessons: [
          { t: "Entity relationships & normalisation", v: V.sql, d: 25 },
          { t: "Indexes, constraints and transactions", v: V.sql, d: 23 },
        ],
      },
    ],
  },
  {
    slug: "interview-preparation-portfolio-building",
    title: "Interview Preparation & Portfolio Building",
    subtitle: "Stand out to recruiters and crack technical interviews with confidence.",
    description: "Based on our popular workshops: craft a strong resume and portfolio, master technical fundamentals, practise HR and technical rounds and learn how interviewers think.",
    category: "career",
    tutor: "kavya",
    price: 99900,
    mrp: 249900,
    level: "ALL_LEVELS",
    featured: true,
    outcomes: ["Build a professional portfolio and resume", "Answer HR questions with structure", "Approach technical rounds methodically", "Understand the interviewer's perspective"],
    requirements: ["Final-year students, freshers or job switchers"],
    sections: [
      {
        title: "Your Professional Profile",
        lessons: [
          { t: "What recruiters look for", v: V.git, d: 10, p: true },
          { t: "Building a portfolio that gets noticed", v: V.html, d: 18 },
          { t: "Resume and LinkedIn makeover", v: V.html, d: 16 },
        ],
      },
      {
        title: "Cracking the Interview",
        lessons: [
          { t: "Technical fundamentals revision", v: V.js, d: 24 },
          { t: "Mock HR interview walkthrough", v: V.js, d: 18 },
        ],
        assignment: { title: "Submit your portfolio for review", instructions: "Share your portfolio website (or PDF) and resume link. Your mentor will review and send personalised feedback." },
      },
    ],
  },
];

async function main() {
  console.log(`Seeding (demo content: ${demo ? "yes" : "no"})…`);
  const hash = (p: string) => bcrypt.hash(p, 10);

  const admin = await db.user.upsert({
    where: { email: "admin@shesoftwaresolutions.com" },
    update: {},
    create: { name: "She Admin", email: "admin@shesoftwaresolutions.com", passwordHash: await hash("Admin@12345"), role: "ADMIN", headline: "Platform administrator" },
  });

  for (const c of categories) {
    await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  if (!demo) {
    console.log("Done. Admin:", admin.email);
    return;
  }

  const tutorPw = await hash("Tutor@12345");
  const tutors = {
    priya: await db.user.upsert({
      where: { email: "priya.tutor@example.com" },
      update: {},
      create: { name: "Priya Raman", email: "priya.tutor@example.com", passwordHash: tutorPw, role: "TUTOR", headline: "Senior Full-Stack Engineer", bio: "Full-stack developer and mentor with years of experience building web and mobile products for startups." },
    }),
    kavya: await db.user.upsert({
      where: { email: "kavya.tutor@example.com" },
      update: {},
      create: { name: "Kavya Sundar", email: "kavya.tutor@example.com", passwordHash: tutorPw, role: "TUTOR", headline: "Product Designer & Career Coach", bio: "Designer and career mentor who has guided hundreds of students through portfolios and interviews." },
    }),
    anitha: await db.user.upsert({
      where: { email: "anitha.tutor@example.com" },
      update: {},
      create: { name: "Anitha Krishnan", email: "anitha.tutor@example.com", passwordHash: tutorPw, role: "TUTOR", headline: "Data Scientist", bio: "Data scientist specialising in machine learning, databases and analytics education." },
    }),
  };

  const learnerPw = await hash("Learner@12345");
  const learners = [];
  for (const [name, email] of [
    ["Demo Learner", "learner@example.com"],
    ["Meera Nair", "meera@example.com"],
    ["Divya Prakash", "divya@example.com"],
    ["Arjun Kumar", "arjun@example.com"],
  ] as const) {
    learners.push(await db.user.upsert({ where: { email }, update: {}, create: { name, email, passwordHash: learnerPw, role: "LEARNER" } }));
  }

  const catIds = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));

  for (const c of courses) {
    const exists = await db.course.findUnique({ where: { slug: c.slug } });
    if (exists) continue;
    await db.course.create({
      data: {
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        price: c.price,
        mrp: c.mrp,
        level: c.level,
        isFeatured: c.featured ?? false,
        outcomes: c.outcomes,
        requirements: c.requirements,
        status: "PUBLISHED",
        publishedAt: new Date(),
        promoVideoUrl: c.sections[0]?.lessons[0]?.v,
        tutorId: tutors[c.tutor].id,
        categoryId: catIds[c.category],
        sections: {
          create: c.sections.map((s, si) => ({
            title: s.title,
            position: si,
            lessons: { create: s.lessons.map((l, li) => ({ title: l.t, videoUrl: l.v, durationMin: l.d, isPreview: l.p ?? false, description: l.desc, position: li })) },
            quizzes: s.quiz
              ? { create: [{ title: s.quiz.title, questions: { create: s.quiz.questions.map((q, qi) => ({ prompt: q.prompt, options: q.options, correctIndex: q.correct, explanation: q.explanation, position: qi })) } }] }
              : undefined,
            assignments: s.assignment ? { create: [{ title: s.assignment.title, instructions: s.assignment.instructions }] } : undefined,
          })),
        },
      },
    });
  }

  // A draft course awaiting admin review
  if (!(await db.course.findUnique({ where: { slug: "javascript-dsa-interview-patterns" } }))) {
    await db.course.create({
      data: {
        slug: "javascript-dsa-interview-patterns",
        title: "JavaScript DSA: Interview Patterns",
        subtitle: "Arrays, hashing, two pointers, recursion and more.",
        description: "Practise the most common data-structure and algorithm patterns asked in product-company interviews, in JavaScript.",
        price: 149900,
        level: "INTERMEDIATE",
        outcomes: ["Recognise common DSA patterns", "Analyse time and space complexity"],
        requirements: ["Comfortable with JavaScript basics"],
        status: "PENDING_REVIEW",
        tutorId: tutors.priya.id,
        categoryId: catIds["programming"],
        sections: { create: [{ title: "Arrays & Hashing", position: 0, lessons: { create: [{ title: "Big-O in 10 minutes", videoUrl: V.js, durationMin: 10, position: 0, isPreview: true }] } }] },
      },
    });
  }

  // Enrollments, progress, payments and reviews for demo learners
  const all = await db.course.findMany({ where: { status: "PUBLISHED" }, include: { sections: { include: { lessons: true } } } });
  const reviewText = [
    "Clear explanations and very practical projects. The mentor support made a big difference.",
    "Step-by-step guidance that is easy to follow. I finally understand the concepts.",
    "Hands-on sessions and real-world examples make it highly effective and engaging.",
    "Great structure and helpful assignments. Would recommend to my friends.",
  ];
  for (const [i, learner] of learners.entries()) {
    for (const [j, course] of all.entries()) {
      if ((i + j) % 2 === 1 && i !== 0) continue;
      if (i === 0 && j > 3) continue;
      await db.enrollment.upsert({ where: { userId_courseId: { userId: learner.id, courseId: course.id } }, update: {}, create: { userId: learner.id, courseId: course.id } });
      if (course.price > 0) {
        const existing = await db.payment.findFirst({ where: { userId: learner.id, courseId: course.id, status: "PAID" } });
        if (!existing)
          await db.payment.create({ data: { userId: learner.id, courseId: course.id, amount: course.price, status: "PAID", provider: "seed", razorpayOrderId: `seed_order_${learner.id}_${course.id}`, razorpayPaymentId: `seed_pay_${learner.id}_${course.id}` } });
      }
      const lessons = course.sections.flatMap((s) => s.lessons);
      for (const lesson of lessons.slice(0, Math.ceil(lessons.length * (0.25 + ((i + j) % 3) * 0.25)))) {
        await db.lessonProgress.upsert({ where: { userId_lessonId: { userId: learner.id, lessonId: lesson.id } }, update: {}, create: { userId: learner.id, lessonId: lesson.id } });
      }
      if (i > 0) {
        await db.review.upsert({
          where: { userId_courseId: { userId: learner.id, courseId: course.id } },
          update: {},
          create: { userId: learner.id, courseId: course.id, rating: (i + j) % 4 === 0 ? 4 : 5, comment: reviewText[(i + j) % reviewText.length] },
        });
      }
    }
  }

  const internships = [
    { title: "Full-Stack Web Development Intern", domain: "Web Development", skills: ["HTML/CSS", "JavaScript", "React", "Node.js"], duration: "8 weeks" },
    { title: "Mobile App Development Intern", domain: "Mobile Development", skills: ["Flutter", "Dart", "REST APIs"], duration: "8 weeks" },
    { title: "AI / ML Intern", domain: "Data Science & AI", skills: ["Python", "pandas", "scikit-learn"], duration: "12 weeks" },
    { title: "UI/UX Design Intern", domain: "Design", skills: ["Figma", "Wireframing", "User research"], duration: "6 weeks" },
  ];
  if ((await db.internship.count()) === 0) {
    for (const it of internships) {
      await db.internship.create({
        data: {
          ...it,
          description: `Work on real production projects with direct mentorship from the She Software Solutions team. You will follow professional practices — code reviews, Git workflows and agile sprints — and receive a verified completion certificate.`,
          mode: "ONLINE",
          stipend: "Non-stipendiary",
          openings: 10,
          deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
        },
      });
    }
  }

  if ((await db.event.count()) === 0) {
    const day = 1000 * 60 * 60 * 24;
    await db.event.createMany({
      data: [
        { title: "Portfolio Building Workshop", slug: "portfolio-building-workshop", kind: "Workshop", description: "Learn how to create a professional portfolio that showcases your skills and projects to recruiters.", startsAt: new Date(Date.now() + 10 * day), mode: "ONLINE", meetingUrl: "https://meet.google.com/", capacity: 200 },
        { title: "Interview Preparation Seminar", slug: "interview-preparation-seminar", kind: "Seminar", description: "Understand the interviewer's perspective, strengthen your fundamentals and practise presenting your knowledge clearly.", startsAt: new Date(Date.now() + 18 * day), mode: "HYBRID", location: "Salem, Tamil Nadu", capacity: 150 },
        { title: "She Hack 2027 — Student Hackathon", slug: "she-hack-2027", kind: "Hackathon", description: "A 24-hour hackathon for college students to build solutions for real community problems, with mentors from industry.", startsAt: new Date(Date.now() + 40 * day), mode: "OFFLINE", location: "Chennai, Tamil Nadu", capacity: 300 },
      ],
    });
  }

  console.log("Done.");
  console.log("  Admin   → admin@shesoftwaresolutions.com / Admin@12345");
  console.log("  Tutor   → priya.tutor@example.com / Tutor@12345");
  console.log("  Learner → learner@example.com / Learner@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
