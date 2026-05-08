import { Link, useNavigate, useLocation } from "react-router-dom";
import { FileUp } from "lucide-react";
import { useEffect, useState } from "react";

const getUsernameFromStorage = () => {
  const savedUsername = localStorage.getItem("username");

  if (savedUsername) {
    return savedUsername;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username ?? null;
  } catch {
    return null;
  }
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState(null);

  useEffect(() => {
    setUsername(getUsernameFromStorage());
  }, [location.pathname]);

  useEffect(() => {
    const syncUsername = () => {
      setUsername(getUsernameFromStorage());
    };

    window.addEventListener("storage", syncUsername);

    return () => {
      window.removeEventListener("storage", syncUsername);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername(null);
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="text-xl font-bold text-white">DocBrain</span>
        </Link>

        <div className="flex items-center gap-4">
          {username ? (
            <>
              <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300">
                {username}
              </span>

              <button
                onClick={handleLogout}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-white">
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
