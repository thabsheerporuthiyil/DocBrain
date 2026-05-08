import { Link } from "react-router-dom";
import { Brain } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await registerUser({
        username: form.username,
        password: form.password,
      });

      alert("Registered successfully");
      navigate("/login");
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020202] px-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_16%_76%,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(145,145,145,0.1),transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(150deg,rgba(255,255,255,0.02),transparent_42%,transparent_60%,rgba(255,255,255,0.03))]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center py-10">
        <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/4 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.72)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
            <Brain size={34} />
          </div>

          <div className="mb-10 text-center">
            <span className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-300">
              DocBrain
            </span>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Create an account
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400 sm:text-base">
              Set up your profile and start analyzing your PDFs.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-200">
                Username
              </label>
              <input
                type="text"
                name="username"
                placeholder="username"
                onChange={handleChange}
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-white/20 focus:bg-white/7.5"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-200">
                Password
              </label>
              <input
                type="password"
                name="password"
                onChange={handleChange}
                placeholder="********"
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-white/20 focus:bg-white/7.5"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-200">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                onChange={handleChange}
                placeholder="********"
                className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-white/20 focus:bg-white/7.5"
              />
            </div>

            <button className="h-14 w-full rounded-2xl bg-white text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-zinc-200">
              Get Started
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-white transition hover:text-zinc-300"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
