import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  ShieldCheck,
  Search,
  RefreshCw,
  TrendingUp,
  HardDrive,
  UserPlus
} from 'lucide-react';

const AdminView = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
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
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
          <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" size={24} />
        </div>
        <p className="text-slate-400 font-medium animate-pulse">Accessing Secure Vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600/20 via-slate-900 to-slate-900 border border-white/5 p-8 md:p-12">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wider uppercase mb-4">
              <ShieldCheck size={14} /> Admin Control
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Intelligence</span>
            </h1>
            <p className="text-slate-400 mt-3 text-lg max-w-xl">
              Monitor user behavior, document throughput, and neural engine performance from a single interface.
            </p>
          </div>
          <button 
            onClick={fetchData}
            disabled={isRefreshing}
            className="group relative bg-white text-black font-bold px-6 py-3 rounded-2xl flex items-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            Sync Dashboard
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="text-blue-400" />} 
          label="Total Users" 
          value={stats?.users || 0} 
          trend="+12% this month"
          color="blue"
        />
        <StatCard 
          icon={<FileText className="text-emerald-400" />} 
          label="Knowledge Base" 
          value={stats?.documents || 0} 
          trend="840 MB used"
          color="emerald"
        />
        <StatCard 
          icon={<MessageSquare className="text-purple-400" />} 
          label="AI Inference" 
          value={stats?.messages || 0} 
          trend="Avg 1.2s latency"
          color="purple"
        />
        <StatCard 
          icon={<Activity className="text-amber-400" />} 
          label="System Load" 
          value="Optimal" 
          trend="All systems go"
          color="amber"
        />
      </div>

      {/* Main Interface */}
      <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between p-4 border-b border-white/5 bg-white/5">
          <div className="flex gap-2">
            <NavTab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Insight" icon={<TrendingUp size={16}/>} />
            <NavTab active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Users" icon={<UserPlus size={16}/>} />
            <NavTab active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} label="Vault" icon={<HardDrive size={16}/>} />
          </div>
          
          {(activeTab === 'users' || activeTab === 'documents') && (
            <div className="relative mt-4 md:mt-0 w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
          )}
        </div>

        {/* Tab Content Area */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="text-indigo-400" size={18} />
                    Processing Pipeline
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(stats?.status_distribution || {}).map(([status, count]) => (
                      <div key={status} className="bg-black/40 rounded-xl p-4 border border-white/5">
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{status}</p>
                        <p className="text-2xl font-bold text-white">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl border border-white/5 bg-slate-800/20">
                    <h4 className="text-white font-semibold mb-2">API Latency</h4>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[70%]"></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">70% optimal performance across all regions</p>
                  </div>
                  <div className="p-6 rounded-2xl border border-white/5 bg-slate-800/20">
                    <h4 className="text-white font-semibold mb-2">Vector Consistency</h4>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[95%]"></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">95% database integrity verified</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-b from-indigo-600/10 to-transparent border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <ActionButton icon={<RefreshCw size={16}/>} label="Re-index All Vaults" />
                  <ActionButton icon={<ShieldCheck size={16}/>} label="Security Audit" />
                  <ActionButton icon={<Users size={16}/>} label="Broadcast Message" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="overflow-hidden rounded-2xl border border-white/5">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Identity</th>
                    <th className="px-6 py-4">Privileges</th>
                    <th className="px-6 py-4 text-center">Assets</th>
                    <th className="px-6 py-4">Onboarded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                            {user.username[0].toUpperCase()}
                          </div>
                          <span className="font-semibold text-white group-hover:text-indigo-400 transition-colors">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {user.is_admin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/20">
                            <ShieldCheck size={12} /> Root Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-500/10 text-slate-400 rounded-lg text-xs font-bold border border-slate-500/20">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center font-mono">{user.document_count}</td>
                      <td className="px-6 py-5 text-sm text-slate-500">{new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="overflow-hidden rounded-2xl border border-white/5">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Resource Name</th>
                    <th className="px-6 py-4">Originator</th>
                    <th className="px-6 py-4">Integrity</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredDocs.map(doc => (
                    <tr key={doc.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-black/40 text-slate-400 group-hover:text-white transition-colors">
                            <FileText size={16} />
                          </div>
                          <span className="font-semibold text-white truncate max-w-xs">{doc.filename}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-400">{doc.owner}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          doc.status === 'indexed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          doc.status === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {doc.status === 'indexed' ? <CheckCircle size={12} /> : doc.status === 'failed' ? <AlertCircle size={12} /> : <Clock size={12} />}
                          {doc.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</td>
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

const StatCard = ({ icon, label, value, trend, color }) => (
  <div className="relative group bg-slate-900 border border-white/5 p-6 rounded-[2rem] overflow-hidden hover:border-indigo-500/50 transition-all duration-500">
    <div className={`absolute top-0 right-0 -mt-8 -mr-8 h-24 w-24 bg-${color}-500/5 rounded-full blur-2xl group-hover:bg-${color}-500/10 transition-colors`}></div>
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <div className={`p-3 bg-white/5 rounded-2xl text-${color}-400 border border-white/5`}>{icon}</div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{trend}</div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <p className="text-3xl font-black text-white mt-1">{value}</p>
      </div>
    </div>
  </div>
);

const NavTab = ({ active, onClick, label, icon }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-105' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
  >
    {icon}
    {label}
  </button>
);

const ActionButton = ({ icon, label }) => (
  <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-black/20 border border-white/5 text-slate-300 hover:bg-white/5 hover:text-white hover:border-indigo-500/30 transition-all group">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white/5 rounded-lg group-hover:text-indigo-400 transition-colors">{icon}</div>
      <span className="text-sm font-semibold">{label}</span>
    </div>
    <div className="h-1.5 w-1.5 rounded-full bg-slate-700 group-hover:bg-indigo-500 transition-colors"></div>
  </button>
);

export default AdminView;
