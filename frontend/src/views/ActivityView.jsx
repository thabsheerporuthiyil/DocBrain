import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight, Clock } from "lucide-react";
import { getRecentActivity } from "../api/chat";

function ActivityView() {
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const data = await getRecentActivity(20);
        setActivity(data);
      } catch (err) {
        console.error("Failed to fetch activity:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivity();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-white" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Recent Activity</h1>
        <p className="mt-2 text-zinc-400">Jump back into your most recent conversations.</p>
      </header>

      {activity.length === 0 ? (
        <div className="rounded-[32px] border border-white/8 bg-white/2 p-12 text-center">
          <MessageSquare className="mx-auto text-zinc-600" size={48} />
          <p className="mt-4 text-zinc-400">No activity yet. Start chatting with a document!</p>
        </div>
      ) : (
        <div className="relative space-y-4 before:absolute before:left-6 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-white/10">
          {activity.map((item) => (
            <div key={item.id} className="relative pl-14">
              {/* Timeline Marker */}
              <div className="absolute left-4 top-2 h-4 w-4 rounded-full border-2 border-[#070707] bg-white ring-4 ring-white/5" />
              
              <div className="group rounded-3xl border border-white/8 bg-white/2 p-5 transition-all hover:border-white/20 hover:bg-white/4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      <Clock size={12} />
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                    <p className="text-sm font-medium text-white line-clamp-1">
                      {item.role === 'user' ? "You asked:" : "DocBrain replied:"}
                    </p>
                  </div>
                  <Link
                    to={`/dashboard/chat/${item.document_id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 transition group-hover:border-white/20 group-hover:text-white"
                  >
                    View Chat <ArrowRight size={12} />
                  </Link>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400 line-clamp-2 italic">
                  "{item.content}"
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityView;
