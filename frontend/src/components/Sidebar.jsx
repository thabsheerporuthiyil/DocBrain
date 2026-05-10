import { 
  LayoutDashboard, 
  FileText, 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Settings,
  ShieldCheck,
  Menu,
  X
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Sidebar({ isCollapsed, setIsCollapsed }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUsername(payload.username);
        setIsAdmin(payload.is_admin || false);
      } catch (err) {
        console.error("Token decoding failed", err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const NAV_ITEMS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
    { id: "documents", label: "Documents", icon: FileText, path: "/dashboard/documents" },
    { id: "activity", label: "Activity", icon: Activity, path: "/dashboard/activity" },
    { id: "admin", label: "Admin", icon: ShieldCheck, path: "/dashboard/admin", adminOnly: true },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-4 left-4 z-[60] lg:hidden">
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/10"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Floating Island Sidebar */}
      <aside 
        className={`fixed z-50 flex flex-col border border-white/10 bg-[#070707]/80 backdrop-blur-2xl transition-all duration-500 ease-in-out shadow-[0_0_50px_rgba(0,0,0,0.5)]
          ${isMobileOpen ? "left-4 top-4 right-4 translate-x-0 rounded-[32px] h-fit" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-20" : "lg:w-64"}
          lg:left-6 lg:top-1/2 lg:-translate-y-1/2 lg:rounded-[40px] lg:h-fit
          w-64
        `}
      >
      {/* Logo Section */}
      <div className="flex h-20 items-center px-6 mt-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
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
          if (item.adminOnly && !isAdmin) return null;
          
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 rounded-[24px] px-3 py-3 transition-all duration-300 ${
                isActive 
                  ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.15)] scale-105" 
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              }`}
            >
              <Icon size={20} className={isActive ? "text-black" : "text-inherit"} />
              <span className={`text-sm font-bold ${isCollapsed ? "lg:hidden" : "block"}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 space-y-3 mb-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-zinc-500 transition-all hover:bg-white/5 hover:text-zinc-300"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
        </button>

        <div className={`flex flex-col gap-3 rounded-[32px] bg-white/5 border border-white/5 p-3 ${isCollapsed ? "items-center" : ""}`}>
          <div className="flex items-center gap-3 w-full">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-black text-white border border-white/10 uppercase">
              {username?.[0] || "U"}
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-xs font-bold text-white">{username || "Explorer"}</p>
                <p className="truncate text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Pro</p>
              </div>
            )}
          </div>
          
          {!isCollapsed && (
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all border border-white/5"
              title="Logout"
            >
              <LogOut size={14} />
              Logout
            </button>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}

export default Sidebar;
