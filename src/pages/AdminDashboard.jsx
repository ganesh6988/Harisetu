import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, operations, users
  
  // Data State
  const [stats, setStats] = useState({ totalCitizens: 0, totalWorkers: 0, totalReports: 0, resolvedReports: 0, totalKg: 0, pendingReports: 0 });
  const [wasteData, setWasteData] = useState([]);
  const [pipelineData, setPipelineData] = useState([]);
  
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id of report being processed
  const [assignDropdownId, setAssignDropdownId] = useState(null);
  const navigate = useNavigate();

  // Helper for GPS distance
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2-lat1) * (Math.PI/180);
    const dLon = (lon2-lon1) * (Math.PI/180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  };

  const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#60a5fa'];

  const fetchAdminData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/admin/login');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileData && profileData.role !== 'admin') {
      navigate(`/${profileData.role}`);
      return;
    }
    setProfile(profileData);

    // Fetch Global Stats
    const { data: allProfiles } = await supabase.from('profiles').select('*');
    const { data: allReports } = await supabase.from('reports').select(`*, profiles!reports_citizen_id_fkey(full_name)`).order('created_at', { ascending: false });

    if (allProfiles && allReports) {
      setUsers(allProfiles);
      setReports(allReports);

      const cCount = allProfiles.filter(p => p.role === 'citizen').length;
      const wCount = allProfiles.filter(p => p.role === 'worker').length;
      const rCount = allReports.length;
      const resCount = allReports.filter(r => r.status === 'resolved').length;
      const penCount = allReports.filter(r => r.status === 'pending').length;
      const kgCount = allReports.reduce((acc, curr) => acc + Number(curr.weight_kg || 0), 0);

      setStats({
        totalCitizens: cCount,
        totalWorkers: wCount,
        totalReports: rCount,
        resolvedReports: resCount,
        pendingReports: penCount,
        totalKg: kgCount
      });

      // Shape Data for Waste Types Pie Chart
      const typeCounts = allReports.reduce((acc, curr) => {
         const type = curr.type_of_waste || 'Uncategorized';
         acc[type] = (acc[type] || 0) + 1;
         return acc;
      }, {});
      setWasteData(Object.keys(typeCounts).map(k => ({ name: k, value: typeCounts[k] })));

      // Shape Data for Pipeline Bar Chart
      setPipelineData([
         { name: 'Pending', count: penCount },
         { name: 'Assigned', count: allReports.filter(r => r.status === 'assigned').length },
         { name: 'Collected', count: allReports.filter(r => r.status === 'collected').length },
         { name: 'Resolved', count: resCount }
      ]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
    
    const channel = supabase.channel('realtime_admin_data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
         fetchAdminData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const updateReportStatus = async (reportId, newStatus, workerId = null) => {
    setActionLoading(reportId);
    const updates = { status: newStatus };
    if (workerId) updates.worker_id = workerId;
    const { error } = await supabase.from('reports').update(updates).eq('id', reportId);
    if (!error) {
       // Optimistic update
       setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus, worker_id: workerId || r.worker_id } : r));
       fetchAdminData(); // Refresh metrics
       setAssignDropdownId(null);
    } else {
       alert("Failed to update status");
    }
    setActionLoading(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface-container-highest"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;
  }

  const opsPending = reports.filter(r => r.status === 'pending');
  const opsCollected = reports.filter(r => r.status === 'collected');
  const opsRejected = reports.filter(r => r.status === 'rejected');

  return (
    <div className="text-slate-100 min-h-screen bg-slate-950">
      {/* SideNavBar */}
      <aside className="fixed h-full w-64 left-0 top-0 hidden md:flex bg-slate-900 border-r border-slate-800 flex-col py-6 px-4 z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-indigo-400 tracking-tighter">Command Control</h1>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">HaritSetu Global</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2 text-sm">
          <button 
             onClick={() => setActiveTab('overview')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeTab === 'overview' ? 'bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
            <span className="material-symbols-outlined text-lg">stacked_line_chart</span>
            System Overview
          </button>
          <button 
             onClick={() => setActiveTab('operations')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeTab === 'operations' ? 'bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
            <span className="material-symbols-outlined text-lg">call_split</span>
            Field Operations
            {opsPending.length + opsCollected.length + opsRejected.length > 0 && (
               <span className="ml-auto bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full">{opsPending.length + opsCollected.length + opsRejected.length}</span>
            )}
          </button>
          <button 
             onClick={() => setActiveTab('users')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeTab === 'users' ? 'bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
            <span className="material-symbols-outlined text-lg">group</span>
            User Management
          </button>
        </nav>
        <div className="mt-auto space-y-1 pt-6 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-lg">logout</span>
            <span className="font-bold text-sm">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen p-8">
        <header className="flex justify-between items-end mb-12 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
               System Global View
               <span className="material-symbols-outlined text-emerald-500 animate-pulse" title="Live Synced">sensors</span>
            </h2>
            <p className="text-slate-400 mt-2 font-medium">Real-time HaritSetu network telemetry & control.</p>
          </div>
          <div className="text-right border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 rounded-xl">
             <p className="text-[10px] uppercase text-indigo-300 font-bold tracking-widest">System Admin Active</p>
             <p className="text-sm font-bold text-indigo-100">{profile?.full_name || 'Administrator'}</p>
          </div>
        </header>

        {activeTab === 'overview' && (
           <>
              {/* Top KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg hover:border-indigo-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-indigo-400 text-[18px]">group</span> Citizens</h3>
                     <span className="text-xs font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">Active</span>
                  </div>
                  <p className="text-4xl font-black text-white">{stats.totalCitizens}</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg hover:border-emerald-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-emerald-400 text-[18px]">engineering</span> Workers</h3>
                     <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Deployed</span>
                  </div>
                  <p className="text-4xl font-black text-white">{stats.totalWorkers}</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg hover:border-amber-500/50 transition-colors relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-[100px] pointer-events-none"></div>
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-amber-400 text-[18px]">pending_actions</span> Pending</h3>
                     <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">To process</span>
                  </div>
                  <p className="text-4xl font-black text-white">{stats.pendingReports}</p>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Out of {stats.totalReports} total logic traces</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-6 rounded-2xl border border-indigo-400/30 shadow-indigo-500/20 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full pointer-events-none"></div>
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-white text-[18px]">recycling</span> Impact (Kg)</h3>
                     <span className="material-symbols-outlined text-white/50 text-xl">public</span>
                  </div>
                  <p className="text-4xl font-black text-white">{stats.totalKg}</p>
                  <p className="text-xs text-indigo-200 mt-2 font-medium">Safely diverted from landfills</p>
                </div>
              </div>

              {/* Dynamic Analytics Dashboards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                 {/* Chart 1: Workflow Pipeline */}
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Workflow Pipeline</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ fill: '#334155', opacity: 0.4 }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {
                              pipelineData.map((entry, index) => {
                                 let color = '#a78bfa'; // default
                                 if (entry.name === 'Pending') color = '#f87171';
                                 if (entry.name === 'Assigned') color = '#fbbf24';
                                 if (entry.name === 'Collected') color = '#38bdf8';
                                 if (entry.name === 'Resolved') color = '#34d399';
                                 return <Cell key={`cell-${index}`} fill={color} />
                              })
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                 </div>

                 {/* Chart 2: Waste Type Breakdown */}
                 <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Waste Category Distribution</h3>
                    <div className="h-64 flex justify-center">
                       {wasteData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={wasteData}
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {wasteData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                       ) : (
                          <div className="flex items-center justify-center text-slate-500 text-sm h-full">No waste categorised yet.</div>
                       )}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                       {wasteData.map((entry, idx) => (
                          <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                             <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                             {entry.name}
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </>
        )}

        {activeTab === 'operations' && (
           <div className="space-y-8">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                 <h3 className="text-xl font-bold text-white flex items-center gap-3">
                   <span className="material-symbols-outlined text-amber-500">warning</span>
                   Action Required: New Reports
                 </h3>
                 <p className="text-slate-400 text-sm mt-1 mb-6">Review new citizen reports and assign them to the worker routing pool.</p>
                 
                 <div className="space-y-4">
                    {opsPending.length === 0 ? (
                       <p className="text-slate-500 italic p-4 text-center">No pending reports to assign.</p>
                    ) : opsPending.map(report => (
                       <div key={report.id} className="flex flex-col md:flex-row gap-6 items-start bg-slate-950 p-4 rounded-xl border border-slate-800">
                          {report.image_url ? (
                             <img src={report.image_url} alt="Waste" className="w-32 h-32 rounded-lg object-cover bg-slate-800" />
                          ) : (
                             <div className="w-32 h-32 rounded-lg bg-slate-800 flex items-center justify-center text-slate-600"><span className="material-symbols-outlined">image_not_supported</span></div>
                          )}
                          <div className="flex-1">
                             <div className="flex justify-between">
                                <h4 className="text-white font-bold">{report.type_of_waste} Report</h4>
                                <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded">Pending Assignment</span>
                             </div>
                             <p className="text-slate-400 text-sm mt-1 mb-2">
                                <span className="material-symbols-outlined text-[14px]">pin_drop</span> {report.location || 'No location given'} 
                                {report.latitude && report.longitude && (
                                   <span className="ml-2 text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400">
                                      GPS: {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                                   </span>
                                )}
                             </p>
                             <p className="text-slate-500 text-xs italic mb-4 max-w-xl">{report.description}</p>
                             <div className="flex gap-4 items-center">
                                {assignDropdownId === report.id ? (
                                   <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 w-full max-w-md">
                                      <div className="flex justify-between items-center mb-2">
                                         <span className="text-xs font-bold text-slate-300">Select Worker</span>
                                         <button onClick={() => setAssignDropdownId(null)} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined text-[14px]">close</span></button>
                                      </div>
                                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                         {users.filter(u => u.role === 'worker').sort((a, b) => {
                                            const distA = getDistanceFromLatLonInKm(report.latitude, report.longitude, a.latitude, a.longitude);
                                            const distB = getDistanceFromLatLonInKm(report.latitude, report.longitude, b.latitude, b.longitude);
                                            return distA - distB;
                                         }).map(worker => {
                                            const dist = getDistanceFromLatLonInKm(report.latitude, report.longitude, worker.latitude, worker.longitude);
                                            return (
                                               <div key={worker.id} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-700">
                                                  <div>
                                                     <p className="text-sm font-bold text-white">{worker.full_name}</p>
                                                     {dist !== Infinity ? (
                                                        <p className="text-[10px] text-emerald-400 font-bold">{dist.toFixed(1)} km away</p>
                                                     ) : (
                                                        <p className="text-[10px] text-amber-500 font-bold">Default Zone / Standby</p>
                                                     )}
                                                  </div>
                                                  <button 
                                                     onClick={() => updateReportStatus(report.id, 'assigned', worker.id)}
                                                     className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
                                                  >
                                                     Assign
                                                  </button>
                                               </div>
                                            );
                                         })}
                                      </div>
                                   </div>
                                ) : (
                                   <button 
                                      onClick={() => setAssignDropdownId(report.id)}
                                      disabled={actionLoading === report.id}
                                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded shadow transition-colors text-sm disabled:opacity-50"
                                   >
                                      {actionLoading === report.id ? 'Processing...' : 'Assign to Worker'}
                                   </button>
                                )}
                                {assignDropdownId !== report.id && (
                                   <span className="text-xs text-slate-500">Citizen: {report.profiles?.full_name}</span>
                                )}
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                 <h3 className="text-xl font-bold text-white flex items-center gap-3">
                   <span className="material-symbols-outlined text-emerald-500">task_alt</span>
                   Action Required: Verification
                 </h3>
                 <p className="text-slate-400 text-sm mt-1 mb-6">Workers have collected these. Verify and resolve to release Eco Tokens to the citizen.</p>
                 
                 <div className="space-y-4">
                    {opsCollected.length === 0 ? (
                       <p className="text-slate-500 italic p-4 text-center">No collected reports waiting for verification.</p>
                    ) : opsCollected.map(report => (
                       <div key={report.id} className="flex flex-col md:flex-row gap-6 items-start bg-slate-950 p-4 rounded-xl border border-slate-800">
                          {report.image_url ? (
                             <img src={report.image_url} alt="Waste" className="w-32 h-32 rounded-lg object-cover bg-slate-800" />
                          ) : (
                             <div className="w-32 h-32 rounded-lg bg-slate-800 flex items-center justify-center text-slate-600"><span className="material-symbols-outlined">image_not_supported</span></div>
                          )}
                          <div className="flex-1">
                             <div className="flex justify-between">
                                <h4 className="text-white font-bold">{report.type_of_waste} Report</h4>
                                <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">Needs Verification</span>
                             </div>
                             <p className="text-slate-400 text-sm mt-1 mb-2"><span className="material-symbols-outlined text-[14px]">pin_drop</span> {report.location}</p>
                             <p className="text-slate-500 text-xs italic mb-4 max-w-xl">{report.description}</p>
                             <div className="flex gap-4 items-center">
                                <button 
                                   onClick={() => updateReportStatus(report.id, 'resolved')}
                                   disabled={actionLoading === report.id}
                                   className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded shadow transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                   {actionLoading === report.id ? 'Processing...' : <><span className="material-symbols-outlined text-[16px]">verified</span> Verify & Grant Tokens</>}
                                </button>
                                <span className="text-xs text-slate-500">Citizen: {report.profiles?.full_name}</span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
               </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg mt-8">
                 <h3 className="text-xl font-bold text-white flex items-center gap-3">
                   <span className="material-symbols-outlined text-red-500">warning</span>
                   Flagged as Fake / Rejected
                 </h3>
                 <p className="text-slate-400 text-sm mt-1 mb-6">Workers flagged these routes as fake or unrecoverable.</p>
                 
                 <div className="space-y-4">
                    {opsRejected.length === 0 ? (
                       <p className="text-slate-500 italic p-4 text-center">No rejected reports.</p>
                    ) : opsRejected.map(report => (
                       <div key={report.id} className="flex flex-col md:flex-row gap-6 items-start bg-slate-950 p-4 rounded-xl border border-red-500/30">
                          {report.image_url ? (
                             <img src={report.image_url} alt="Waste" className="w-32 h-32 rounded-lg object-cover bg-slate-800 opacity-50 grayscale" />
                          ) : (
                             <div className="w-32 h-32 rounded-lg bg-slate-800 flex items-center justify-center text-slate-600"><span className="material-symbols-outlined">image_not_supported</span></div>
                          )}
                          <div className="flex-1">
                             <div className="flex justify-between">
                                <h4 className="text-white font-bold">{report.type_of_waste} Report</h4>
                                <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded">Fake / Rejected</span>
                             </div>
                             <p className="text-slate-400 text-sm mt-1 mb-2"><span className="material-symbols-outlined text-[14px]">pin_drop</span> {report.location}</p>
                             <p className="text-slate-500 text-xs italic mb-4 max-w-xl">{report.description}</p>
                             <div className="flex gap-4 items-center">
                                <button 
                                   onClick={() => updateReportStatus(report.id, 'dismissed')}
                                   disabled={actionLoading === report.id}
                                   className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded shadow transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                   {actionLoading === report.id ? 'Processing...' : <><span className="material-symbols-outlined text-[16px]">close</span> Dismiss Permanently</>}
                                </button>
                                <span className="text-xs text-slate-500">Citizen: {report.profiles?.full_name}</span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'users' && (
           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
               <h3 className="text-xl font-bold text-white mb-6">User Management Database</h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-widest">
                       <th className="p-4">Name</th>
                       <th className="p-4">Role</th>
                       <th className="p-4">Registered</th>
                       <th className="p-4">Account ID</th>
                     </tr>
                   </thead>
                   <tbody>
                      {users.map(u => (
                         <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors text-sm">
                            <td className="p-4 text-white font-bold">{u.full_name}</td>
                            <td className="p-4">
                               <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                  u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' :
                                  u.role === 'worker' ? 'bg-emerald-500/10 text-emerald-400' :
                                  'bg-slate-500/10 text-slate-400'
                               }`}>{u.role}</span>
                            </td>
                            <td className="p-4 text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                            <td className="p-4 text-slate-600 font-mono text-xs">{u.id}</td>
                         </tr>
                      ))}
                   </tbody>
                 </table>
               </div>
           </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
