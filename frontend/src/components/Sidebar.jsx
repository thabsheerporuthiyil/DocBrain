import { 
  LayoutDashboard, 
  FileText, 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Search,
  Plus
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { id: "documents", label: "Documents", icon: FileText, path: "/dashboard/documents" },
      { id: "activity", label: "Recent Activity", icon: Activity, path: "/dashboard/activity" },
    ]
  },
  {
    label: "Management",
    items: [
      { id: "admin", label: "Admin Panel", icon: ShieldCheck, path: "/dashboard/admin", adminOnly: true },
    ]
  }
];

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

      <aside 
        className={`fixed left-0 top-0 z-50 flex h-full flex-col border-r border-white/5 bg-[#080808] transition-all duration-300 ease-in-out 
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "lg:w-[72px]" : "lg:w-64"}
          w-64
        `}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center px-5 mb-2">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-black transition-transform group-hover:scale-105">
              <span className="font-black text-sm">D</span>
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-tight text-white">DocBrain</span>
            )}
          </Link>
        </div>

        {/* Quick Search & Actions */}
        <div className="px-3 mb-4 space-y-2">
          {!isCollapsed && (
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors group-focus-within:text-zinc-400" size={14} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-400 focus:outline-none focus:border-white/10 transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] text-zinc-600">
                ⌘K
              </div>
            </div>
          )}
          
          <Link 
            to="/dashboard/documents"
            className={`flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-black transition-all hover:bg-zinc-200 ${isCollapsed ? "w-10 h-10 p-0" : "w-full"}`}
          >
            <Plus size={16} />
            {!isCollapsed && <span>New Document</span>}
          </Link>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 space-y-6 custom-scrollbar">
          {NAV_GROUPS.map((group, gIdx) => {
            const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {!isCollapsed && (
                  <h3 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-2">
                    {group.label}
                  </h3>
                )}
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                        isActive 
                          ? "bg-white/[0.06] text-white" 
                          : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300"
                      }`}
                    >
                      <Icon size={18} className={isActive ? "text-white" : "text-inherit"} />
                      {!isCollapsed && <span className="text-xs font-bold">{item.label}</span>}
                      
                      {isActive && (
                        <div className="absolute left-0 h-4 w-1 rounded-r-full bg-white shadow-[0_0_10px_#fff]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Profile Section */}
        <div className="p-3">
          <div className={`flex flex-col gap-2 rounded-2xl bg-white/[0.03] border border-white/5 p-2 ${isCollapsed ? "items-center" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 text-[10px] font-black text-white border border-white/10 uppercase shadow-lg">
                {username?.[0] || "U"}
              </div>
              {!isCollapsed && (
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-xs font-bold text-white">{username || "Explorer"}</p>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Pro Member</p>
                </div>
              )}
            </div>
            
            {!isCollapsed && (
              <div className="flex items-center gap-1 pt-1 border-t border-white/5 mt-1">
                <button 
                  onClick={handleLogout}
                  className="flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] font-bold text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                >
                  <LogOut size={12} />
                  Logout
                </button>
                <button 
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 text-zinc-600 hover:text-white transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            )}

            {isCollapsed && (
               <button 
                onClick={() => setIsCollapsed(false)}
                className="mt-1 p-1 text-zinc-600 hover:text-white transition-colors"
               >
                 <ChevronRight size={14} />
               </button>
            )}
          </div>
        </div>
      </aside>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </>
  );
}

export default Sidebar;
