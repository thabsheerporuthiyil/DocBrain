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
  Search
} from 'lucide-react';

const AdminView = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="text-indigo-400 w-8 h-8" />
            Admin Control Center
          </h1>
          <p className="text-slate-400 mt-1">Platform-wide oversight and monitoring</p>
        </div>
        <button 
          onClick={fetchData}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Activity size={18} />
          Refresh Data
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="text-blue-400" />} 
          label="Total Users" 
          value={stats?.users || 0} 
          color="blue"
        />
        <StatCard 
          icon={<FileText className="text-emerald-400" />} 
          label="Documents" 
          value={stats?.documents || 0} 
          color="emerald"
        />
        <StatCard 
          icon={<MessageSquare className="text-purple-400" />} 
          label="AI Messages" 
          value={stats?.messages || 0} 
          color="purple"
        />
        <StatCard 
          icon={<AlertCircle className="text-amber-400" />} 
          label="System Health" 
          value="Healthy" 
          color="amber"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" />
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="User Management" />
        <TabButton active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} label="Global Documents" />
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Document Pipeline</h2>
              <div className="space-y-4">
                {Object.entries(stats?.status_distribution || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="capitalize text-slate-300 flex items-center gap-2">
                      {status === 'indexed' ? <CheckCircle size={16} className="text-emerald-400" /> : <Clock size={16} className="text-amber-400" />}
                      {status}
                    </span>
                    <span className="font-mono text-white bg-slate-700 px-3 py-1 rounded-full">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'users' || activeTab === 'documents') && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {activeTab === 'users' && (
              <div className="overflow-x-auto rounded-xl border border-slate-700">
                <table className="w-full text-left bg-slate-800/30 backdrop-blur-xl">
                  <thead className="bg-slate-700/50 text-slate-300 text-sm uppercase">
                    <tr>
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Documents</th>
                      <th className="px-6 py-4">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 text-slate-300">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-700/20">
                        <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                        <td className="px-6 py-4">
                          {user.is_admin ? (
                            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-md text-xs border border-indigo-500/30">Admin</span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded-md text-xs border border-slate-500/30">User</span>
                          )}
                        </td>
                        <td className="px-6 py-4">{user.document_count}</td>
                        <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="overflow-x-auto rounded-xl border border-slate-700">
                <table className="w-full text-left bg-slate-800/30 backdrop-blur-xl">
                  <thead className="bg-slate-700/50 text-slate-300 text-sm uppercase">
                    <tr>
                      <th className="px-6 py-4">Filename</th>
                      <th className="px-6 py-4">Owner</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 text-slate-300">
                    {filteredDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-700/20">
                        <td className="px-6 py-4 font-medium text-white">{doc.filename}</td>
                        <td className="px-6 py-4">{doc.owner}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-xs border ${
                            doc.status === 'indexed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            doc.status === 'failed' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                            'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">{new Date(doc.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl space-y-2 hover:border-indigo-500/50 transition-all">
    <div className="flex items-center gap-3">
      <div className={`p-2 bg-${color}-500/10 rounded-lg`}>{icon}</div>
      <span className="text-slate-400 font-medium">{label}</span>
    </div>
    <div className="text-3xl font-bold text-white">{value}</div>
  </div>
);

const TabButton = ({ active, onClick, label }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-4 text-sm font-medium transition-all relative ${
      active ? 'text-indigo-400' : 'text-slate-400 hover:text-white'
    }`}
  >
    {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
  </button>
);

export default AdminView;
