import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#030303]">
      {/* Sidebar Navigation */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />

      {/* Main Content Area */}
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12 lg:py-16">
          {/* This is where OverviewView, DocumentsView, or ActivityView will render */}
          <Outlet />
        </div>
      </main>

      {/* Background Glows for Premium Feel */}
      <div className="fixed left-0 top-0 -z-10 h-full w-full overflow-hidden pointer-events-none">
        <div className="absolute -left-[10%] top-[10%] h-[40%] w-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute -right-[10%] bottom-[10%] h-[40%] w-[40%] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>
    </div>
  );
}

export default Dashboard;
