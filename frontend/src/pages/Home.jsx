import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  MessageSquareText,
  Shield,
  Zap,
} from "lucide-react";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const capabilities = [
  {
    icon: Zap,
    title: "Smart Summaries",
    description:
      "Turn dense reports and lengthy PDFs into quick, readable overviews your team can act on.",
  },
  {
    icon: MessageSquareText,
    title: "Context-Aware Answers",
    description:
      "Ask questions in plain language and get responses shaped by the actual content of your documents.",
  },
  {
    icon: Shield,
    title: "Secure Workflows",
    description:
      "Work with sensitive files in a cleaner, more controlled environment designed for professional use.",
  },
];

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(localStorage.getItem("token")));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_26%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.06),transparent_22%)]" />

          <div className="relative mx-auto flex min-h-[68vh] w-full max-w-7xl items-center justify-center px-4 py-14 sm:min-h-[72vh] sm:px-6 md:py-24 lg:px-8">
            <div className="max-w-4xl text-center">
              <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-300 sm:gap-3 sm:text-xs sm:tracking-[0.28em]">
                <BrainCircuit size={14} />
                <span className="truncate sm:text-clip">
                  AI-powered PDF intelligence
                </span>
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold tracking-tighter text-white sm:text-6xl lg:text-7xl">
                Turn Complex PDFs
                <br />
                Into Clear Answers.
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-lg">
                DocBrain helps you read, search, summarize, and understand large
                documents faster with a focused AI workspace built for clarity.
              </p>

              <div className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
                {isLoggedIn ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex min-w-50 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                  >
                    Go to Dashboard
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex min-w-50 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                    >
                      Get Started
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex min-w-50 items-center justify-center rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                    >
                      Login
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto w-full max-w-7xl px-4 py-8 pb-14 sm:px-6 lg:px-8 lg:pb-20"
        >
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-[28px] border border-white/8 bg-[#040404] p-6 sm:rounded-[30px] sm:p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
                  <Icon size={18} />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-white sm:mt-6 sm:text-xl">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
