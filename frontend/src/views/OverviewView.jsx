import { useEffect, useState } from "react";
import { FileText, MessageSquare, Clock, ShieldCheck, TrendingUp, Sparkles } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { getUsageStats } from "../api/chat";

function OverviewView() {
  const [stats, setStats] = useState({
    total_documents: 0,
    total_messages: 0,
    processing_documents: 0,
    chart_data: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getUsageStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();

    // Get username from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUsername(payload.username);
      } catch (err) {
        console.error("Token decoding failed", err);
      }
    }
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const statCards = [
    {
      label: "Total Documents",
      value: stats.total_documents,
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Total Messages",
      value: stats.total_messages,
      icon: MessageSquare,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      label: "Processing",
      value: stats.processing_documents,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Security",
      value: "Encrypted",
      icon: ShieldCheck,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-zinc-900/50 to-black p-8 sm:p-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">{getGreeting()}</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">{username || "Explorer"}</span>
            </h1>
            <p className="max-w-md text-sm font-medium text-zinc-500 leading-relaxed">
              Your personal AI research assistant is ready. Everything is looking great with your documents today.
            </p>
          </div>
          
          <div className="flex shrink-0 items-center gap-3">
             <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                  <span className="text-xs font-bold text-white uppercase tracking-tighter">Pro Member</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, idx) => (
          <div 
            key={idx}
            className={`rounded-[28px] border ${card.border} ${card.bg} p-6 transition-all hover:scale-[1.02] hover:bg-white/[0.04]`}
          >
            <div className="flex items-center justify-between">
              <card.icon className={card.color} size={24} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Live</span>
            </div>
            <div className="mt-6">
              <p className="text-3xl font-black text-white">
                {isLoading ? "..." : card.value}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-zinc-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Analytics Chart */}
      <div className="rounded-[36px] border border-white/8 bg-white/2 p-6 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Intelligence Activity</h2>
            <p className="text-xs text-zinc-500 mt-1 uppercase font-bold tracking-widest">Questions processed over 7 days</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            <TrendingUp size={14} />
            Growth +12%
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chart_data}>
              <defs>
                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                dy={15}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#070707', 
                  border: '1px solid #ffffff14',
                  borderRadius: '20px',
                  boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                  padding: '16px'
                }}
                labelStyle={{ color: '#ffffff', fontWeight: '900', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                itemStyle={{ color: '#8b5cf6', fontSize: '12px', fontWeight: 'bold', padding: '0' }}
                cursor={{ stroke: '#8b5cf633', strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="messages" 
                stroke="#8b5cf6" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorMessages)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default OverviewView;
