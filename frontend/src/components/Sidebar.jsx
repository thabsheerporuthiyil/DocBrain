import { 
  LayoutDashboard, 
  FileText, 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Settings
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const getUsernameFromStorage = () => {
  const savedUsername = localStorage.getItem("username");
  if (savedUsername) return savedUsername;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username ?? null;
  } catch {
    return null;
  }
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
  { id: "documents", label: "Documents", icon: FileText, path: "/dashboard/documents" },
  { id: "activity", label: "Activity", icon: Activity, path: "/dashboard/activity" },
];

function Sidebar({ isCollapsed, setIsCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState(null);

  useEffect(() => {
    setUsername(getUsernameFromStorage());
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <aside 
      className={`fixed left-0 top-0 z-50 flex h-full flex-col border-r border-white/8 bg-[#070707] transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo Section */}
      <div className="flex h-20 items-center px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black">
            <span className="text-xl font-bold">D</span>
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tight text-white">DocBrain</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 py-6">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 ${
                isActive 
                  ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              }`}
            >
              <Icon size={20} className={isActive ? "text-white" : "text-inherit"} />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isActive && !isCollapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_#fff]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-white/8 p-3 space-y-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-zinc-500 transition-all hover:bg-white/5 hover:text-zinc-300"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
        </button>

        <div className={`mt-4 flex items-center gap-3 rounded-3xl bg-white/5 p-2 ${isCollapsed ? "justify-center" : ""}`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-bold text-white border border-white/10 uppercase">
            {username?.[0] || "U"}
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-semibold text-white">{username || "User"}</p>
              <p className="truncate text-[10px] text-zinc-500 uppercase tracking-tighter">Pro Member</p>
            </div>
          )}
          {!isCollapsed && (
            <button 
              onClick={handleLogout}
              className="p-2 text-zinc-500 hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
