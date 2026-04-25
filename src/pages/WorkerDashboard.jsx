import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const WorkerDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [processingType, setProcessingType] = useState(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [workerLocation, setWorkerLocation] = useState(null);
  const navigate = useNavigate();

  const fetchWorkerData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileData && profileData.role !== 'worker') {
      navigate(`/${profileData.role}`);
    }
    setProfile(profileData);

    // Fetch assigned/collected/rejected tasks from reports
    const { data: reportsData } = await supabase
      .from('reports')
      .select(`
        id,
        status,
        weight_kg,
        type_of_waste,
        location,
        description,
        image_url,
        created_at,
        profiles!reports_citizen_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (reportsData) setTasks(reportsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkerData();

    // Listen for realtime updates from Admin
    const channel = supabase.channel('realtime_worker_data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
         fetchWorkerData();
      })
      .subscribe();

    // Start GPS Tracking
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          setGpsActive(true);
          const { latitude, longitude } = position.coords;
          setWorkerLocation({ latitude, longitude });
          
          // Update profile with latest location
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('profiles').update({
              latitude: latitude,
              longitude: longitude,
              last_location_update: new Date().toISOString()
            }).eq('id', user.id);
          }
        },
        (error) => {
          console.error("GPS Tracking Error:", error);
          setGpsActive(false);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      supabase.removeChannel(channel);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    setProcessingId(taskId);
    setProcessingType(newStatus);
    const { error } = await supabase
      .from('reports')
      .update({ status: newStatus, worker_id: profile.id })
      .eq('id', taskId);
      
    if (!error) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } else {
      alert("Error: " + error.message + " | Code: " + error.code + " | Details: " + error.details);
      console.error(error);
    }
    setProcessingId(null);
    setProcessingType(null);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950"><span className="material-symbols-outlined animate-spin text-emerald-500 text-4xl">progress_activity</span></div>;
  }

  const activeTasks = tasks.filter(t => t.status === 'assigned');
  const completedTasks = tasks.filter(t => t.status === 'collected' || t.status === 'resolved' || t.status === 'rejected');

  return (
    <div className="text-slate-100 min-h-screen bg-slate-950">
      {/* SideNavBar */}
      <aside className="fixed h-full w-64 left-0 top-0 hidden md:flex bg-slate-900 border-r border-slate-800 flex-col py-6 px-4 z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 shadow-lg shadow-emerald-600/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-emerald-400 tracking-tighter">Field Ops</h1>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Worker Protocol</p>
          </div>
        </div>
        <nav className="flex-1 space-y-2 text-sm">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
            <span className="material-symbols-outlined text-lg">map</span>
            Active Routes
            {activeTasks.length > 0 && (
               <span className="ml-auto bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full">{activeTasks.length}</span>
            )}
          </div>
        </nav>
        <div className="mt-auto space-y-1 pt-6 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-lg">logout</span>
            <span className="font-bold text-sm">Terminate Shift</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen p-8">
        <header className="flex justify-between items-end mb-12 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
               Route Dashboard
               <span className="material-symbols-outlined text-emerald-500 animate-pulse text-2xl" title="Live Synced">radar</span>
            </h2>
            <p className="text-slate-400 mt-2 font-medium">Clear your designated extraction zones securely.</p>
          </div>
          <div className="text-right border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 rounded-xl flex items-center gap-4">
             {gpsActive && workerLocation ? (
               <div className="flex items-center gap-1.5 text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">GPS Active</span>
               </div>
             ) : (
               <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="material-symbols-outlined text-[12px]">location_off</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">GPS Inactive</span>
               </div>
             )}
             <div className="border-l border-emerald-500/30 pl-4">
                <p className="text-[10px] uppercase text-emerald-300 font-bold tracking-widest">Active Operative</p>
                <p className="text-sm font-bold text-emerald-100">{profile?.full_name}</p>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Active Tasks Flow */}
          <div className="lg:col-span-8">
             <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">route</span> 
                Dispatched Targets ({activeTasks.length})
             </h3>
             <div className="space-y-6">
                {activeTasks.map(task => (
                  <div key={task.id} className="bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-700 relative overflow-hidden transition-all hover:border-emerald-500/50">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] pointer-events-none"></div>
                     <div className="flex flex-col md:flex-row gap-6 relative z-10">
                        {task.image_url ? (
                           <div className="w-full md:w-40 h-40 shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shadow-inner">
                              <img src={task.image_url} alt="Waste Profile" className="w-full h-full object-cover" />
                           </div>
                        ) : (
                           <div className="w-full md:w-40 h-40 shrink-0 rounded-xl flex flex-col items-center justify-center bg-slate-800 text-slate-500 border border-slate-700 shadow-inner">
                              <span className="material-symbols-outlined text-4xl mb-2">satellite_alt</span>
                              <span className="text-[10px] font-bold tracking-widest uppercase">No Image Scan</span>
                           </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                           <div>
                              <div className="flex justify-between items-start mb-2">
                                 <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/20 px-3 py-1 rounded border border-amber-500/30 tracking-widest shadow-sm">
                                    {task.type_of_waste || 'Mixed'} Protocol
                                 </span>
                                 <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                                    <span className="material-symbols-outlined text-[10px] mr-1">history</span>
                                    {new Date(task.created_at).toLocaleDateString()}
                                 </span>
                              </div>
                              <p className="font-bold text-lg text-white mt-1 flex items-start gap-2 leading-tight">
                                 <span className="material-symbols-outlined text-emerald-400 text-[20px] mt-0.5">my_location</span>
                                 {task.location || 'Coordinates Unavailable'}
                              </p>
                              {task.description && (
                                 <p className="text-sm text-slate-400 mt-2 bg-slate-950 p-3 rounded-lg border border-slate-800/50 line-clamp-2">
                                    "{task.description}"
                                 </p>
                              )}
                              <p className="text-xs font-bold text-slate-500 mt-3 flex items-center gap-4 uppercase tracking-widest">
                                 <span>⚖️ Est: {task.weight_kg ? `${task.weight_kg}kg` : 'Unknown'}</span>
                                 <span>👤 Caller: {task.profiles?.full_name || 'Citizen'}</span>
                              </p>
                           </div>
                           
                           <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-800">
                              <button 
                                 onClick={() => updateTaskStatus(task.id, 'collected')}
                                 disabled={processingId === task.id}
                                 className={`flex-1 text-sm font-bold px-4 py-3 rounded-xl border transition-all flex items-center justify-center gap-2 group disabled:opacity-50 ${processingId === task.id && processingType === 'collected' ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-900/50 text-white' : 'bg-transparent border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500'}`}
                              >
                                 <span className="material-symbols-outlined group-hover:scale-110 transition-transform">verified</span>
                                 {processingId === task.id && processingType === 'collected' ? 'Processing...' : 'Secure & Collect'}
                              </button>
                              
                              <button 
                                 onClick={() => updateTaskStatus(task.id, 'rejected')}
                                 disabled={processingId === task.id}
                                 className={`text-sm font-bold px-6 py-3 rounded-xl border transition-all flex items-center gap-2 disabled:opacity-50 ${processingId === task.id && processingType === 'rejected' ? 'bg-red-600 border-red-600 shadow-lg shadow-red-900/50 text-white' : 'bg-transparent border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500'}`}
                              >
                                 <span className="material-symbols-outlined text-[18px]">gpp_bad</span>
                                 {processingId === task.id && processingType === 'rejected' ? 'Processing...' : 'Flag as Fake'}
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
                
                {activeTasks.length === 0 && (
                   <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center">
                      <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">coffee</span>
                      <p className="font-bold">No active routes dispatched.</p>
                      <p className="text-sm mt-1">Stand by for command center assignments.</p>
                   </div>
                )}
             </div>
          </div>

          {/* Historical Log */}
          <div className="lg:col-span-4">
             <h3 className="text-xl font-bold mb-6 text-slate-300 flex items-center gap-2">
                <span className="material-symbols-outlined">inventory_2</span> Log ({completedTasks.length})
             </h3>
             <div className="space-y-4">
                {completedTasks.slice(0, 8).map(task => (
                  <div key={task.id} className="bg-slate-900 p-4 rounded-xl shadow border border-slate-800 flex flex-col gap-2 relative overflow-hidden group">
                     {task.status === 'rejected' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
                     {task.status === 'collected' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>}
                     {task.status === 'resolved' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>}
                     
                     <div className="flex justify-between items-start pl-2">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">ID: {task.id.slice(0,8)}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                           task.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                           task.status === 'collected' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                           'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                           {task.status}
                        </span>
                     </div>
                     <p className="text-sm font-bold text-slate-300 truncate pl-2">{task.location || 'Unknown Location'}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerDashboard;
