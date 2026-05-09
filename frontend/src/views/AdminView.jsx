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
  Clock
} from 'lucide-react';

const AdminView = () => {
  const [stats, setStats] = useState(null);
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
      const [statsRes, usersRes, docsRes] = await Promise.all([
        axios.get('/admin/stats'),
        axios.get('/admin/users'),
        axios.get('/admin/documents')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setDocuments(docsRes.data.documents);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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
    { label: "System Status", value: "Healthy", icon: ShieldCheck, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Admin Control</h1>
          <p className="mt-2 text-zinc-400">Manage users and monitor global system activity.</p>
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Global</span>
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
            User Management
            {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('documents')}
            className={`px-8 py-4 text-sm font-bold transition-all relative ${activeTab === 'documents' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Global Documents
            {activeTab === 'documents' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>}
          </button>
        </div>

        <div className="p-8 space-y-6">
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

          {activeTab === 'users' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <tr>
                    <th className="px-4 py-4">Username</th>
                    <th className="px-4 py-4">Role</th>
                    <th className="px-4 py-4">Docs</th>
                    <th className="px-4 py-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-4 font-semibold text-white">{user.username}</td>
                      <td className="px-4 py-4">
                        {user.is_admin ? (
                          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/20">ADMIN</span>
                        ) : (
                          <span className="text-zinc-500 text-[10px] font-bold">USER</span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono">{user.document_count}</td>
                      <td className="px-4 py-4 text-zinc-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
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
