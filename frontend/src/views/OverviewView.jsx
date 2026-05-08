import { useEffect, useState } from "react";
import { FileText, MessageSquare, Clock, ShieldCheck, TrendingUp } from "lucide-react";
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
  }, []);

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
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
        <p className="mt-2 text-zinc-400">Here is what's happening with your documents today.</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, idx) => (
          <div 
            key={idx}
            className={`rounded-[24px] border ${card.border} ${card.bg} p-6 transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between">
              <card.icon className={card.color} size={24} />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Live</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">
                {isLoading ? "..." : card.value}
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-400">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Analytics Chart */}
      <div className="rounded-[32px] border border-white/8 bg-white/2 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-white">Chat Activity</h2>
            <p className="text-sm text-zinc-500 mt-1">Questions asked over the last 7 days</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <TrendingUp size={14} />
            Active
          </div>
        </div>

        <div className="h-[300px] w-full">
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
                tick={{ fill: '#a1a1aa', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a1a1aa', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#070707', 
                  border: '1px solid #ffffff14',
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  padding: '12px'
                }}
                labelStyle={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}
                itemStyle={{ color: '#a1a1aa', fontSize: '12px', padding: '0' }}
                cursor={{ stroke: '#8b5cf633', strokeWidth: 2 }}
              />
              <Area 
                type="monotone" 
                dataKey="messages" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorMessages)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default OverviewView;
