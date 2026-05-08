import { Link } from "react-router-dom";
import { Brain } from "lucide-react";

function Footer() {
  return (
    <footer className="border-t border-white/8 bg-black">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 text-center sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:text-left">
        <div className="flex flex-col items-center gap-3 sm:flex-row lg:items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
            <Brain size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-200">
              DocBrain
            </p>
            <p className="text-sm text-zinc-500">
              AI-powered document intelligence for focused workflows.
            </p>
          </div>
        </div>

        {/* <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <Link
            to="/login"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            Sign Up
          </Link>
          <a
            href="#features"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            Features
          </a>
        </div> */}
      </div>
    </footer>
  );
}

export default Footer;
