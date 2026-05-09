import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  ShieldCheck,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Cpu,
  Zap,
  BarChart3
} from 'lucide-react';

const AdminView = () => {
  const [stats, setStats] = useState(null);
  const [usage, setUsage] = useState(null);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const [statsRes, usersRes, docsRes, usageRes] = await Promise.all([
        axios.get('/admin/stats'),
        axios.get('/admin/users'),
        axios.get('/admin/documents'),
        axios.get('/admin/usage')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setDocuments(docsRes.data.documents);
      setUsage(usageRes.data);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/admin/users/${userId}/role`, null, { params: { role: newRole } });
      // Refresh user list
      const usersRes = await axios.get('/admin/users');
      setUsers(usersRes.data.users);
    } catch (err) {
      alert("Failed to update role");
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDocs = documents.filter(d => 
    d.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="h-12 w-12 rounded-full border-2 border-white/10 border-t-white animate-spin"></div>
        <p className="text-zinc-500 text-sm font-medium">Loading control center...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.users || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Documents", value: stats?.documents || 0, icon: FileText, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "AI Messages", value: stats?.messages || 0, icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { label: "Tokens Used", value: (usage?.total_tokens || 0).toLocaleString(), icon: Zap, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Admin Control</h1>
          <p className="mt-2 text-zinc-400">Manage roles, monitor LLM costs, and audit platform activity.</p>
        </div>
        <button 
          onClick={fetchData}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, idx) => (
          <div key={idx} className={`rounded-[24px] border ${card.border} ${card.bg} p-6`}>
            <div className="flex items-center justify-between">
              <card.icon className={card.color} size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Live Metrics</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="mt-1 text-sm font-medium text-zinc-400">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="rounded-[32px] border border-white/8 bg-white/2 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-white/8">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-8 py-4 text-sm font-bold transition-all relative ${activeTab === 'users' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            User Roles
            {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('usage')}
            className={`px-8 py-4 text-sm font-bold transition-all relative ${activeTab === 'usage' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            LLM Performance
            {activeTab === 'usage' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('documents')}
            className={`px-8 py-4 text-sm font-bold transition-all relative ${activeTab === 'documents' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Vault Audit
            {activeTab === 'documents' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>}
          </button>
        </div>

        <div className="p-8 space-y-6">
          {(activeTab !== 'usage') && (
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="text" 
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#070707] border border-white/8 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
          )}

          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <tr>
                    <th className="px-4 py-4">User</th>
                    <th className="px-4 py-4">Role / Permission</th>
                    <th className="px-4 py-4">Assets</th>
                    <th className="px-4 py-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-4 font-semibold text-white">{user.username}</td>
                      <td className="px-4 py-4">
                        <select 
                          value={user.role || 'user'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="bg-[#070707] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold uppercase text-white focus:outline-none focus:border-white/30"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 font-mono text-zinc-500">{user.document_count} docs</td>
                      <td className="px-4 py-4 text-zinc-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-white/5 bg-white/2 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="text-indigo-400" size={20} />
                    <h3 className="text-sm font-bold text-white">Efficiency</h3>
                  </div>
                  <p className="text-3xl font-black text-white">{usage?.avg_latency}s</p>
                  <p className="text-xs text-zinc-500">Average LLM response time</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/2 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Cpu className="text-rose-400" size={20} />
                    <h3 className="text-sm font-bold text-white">Consumption</h3>
                  </div>
                  <p className="text-3xl font-black text-white">{usage?.total_tokens.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500">Cumulative tokens processed</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/5">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-xs font-bold uppercase tracking-widest text-zinc-500">
                    <tr>
                      <th className="px-4 py-4">Identity</th>
                      <th className="px-4 py-4">Tokens</th>
                      <th className="px-4 py-4">Latency</th>
                      <th className="px-4 py-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                    {usage?.logs.map(log => (
                      <tr key={log.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-4 py-4 font-semibold text-white">{log.username}</td>
                        <td className="px-4 py-4">{log.tokens.toLocaleString()}</td>
                        <td className="px-4 py-4 text-rose-400 font-bold">{log.latency}s</td>
                        <td className="px-4 py-4 text-zinc-500">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <tr>
                    <th className="px-4 py-4">Filename</th>
                    <th className="px-4 py-4">Owner</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                  {filteredDocs.map(doc => (
                    <tr key={doc.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-4 font-semibold text-white truncate max-w-xs">{doc.filename}</td>
                      <td className="px-4 py-4 text-zinc-500">{doc.owner}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          doc.status === 'indexed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          doc.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {doc.status === 'indexed' ? <CheckCircle size={10} /> : doc.status === 'failed' ? <AlertCircle size={10} /> : <Clock size={10} />}
                          {doc.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-zinc-500">{new Date(doc.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminView;
