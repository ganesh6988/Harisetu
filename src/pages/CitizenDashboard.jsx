import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CitizenDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [claims, setClaims] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Redeem Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [shippingDetails, setShippingDetails] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCitizenData = async () => {
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
      
      if (profileData && profileData.role !== 'citizen') {
        navigate(`/${profileData.role}`);
      }
      setProfile(profileData);

      // Fetch user's reports
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .eq('citizen_id', user.id)
        .order('created_at', { ascending: false });

      if (reportsData) setReports(reportsData);

      // Fetch user's claims
      const { data: claimsData } = await supabase
        .from('reward_claims')
        .select('*')
        .eq('citizen_id', user.id);
        
      if (claimsData) setClaims(claimsData);

      // Fetch leaderboard data (top 3 citizens)
      // We get all resolved reports safely as RLS is open for SELECT
      const { data: allReports } = await supabase
        .from('reports')
        .select('citizen_id, weight_kg, status')
        .eq('status', 'resolved');
        
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'citizen');

      if (allReports && allProfiles) {
         const scores = {};
         allReports.forEach(r => {
            scores[r.citizen_id] = (scores[r.citizen_id] || 0) + (r.weight_kg ? Number(r.weight_kg) * 10 : 10);
         });
         
         const ranked = allProfiles.map(p => ({
            id: p.id,
            name: p.full_name || 'Citizen',
            points: scores[p.id] || 0
         })).sort((a,b) => b.points - a.points);
         
         setLeaderboard(ranked);
      }
      
      setLoading(false);
    };

    fetchCitizenData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };
  
  const handleRedeemClick = (rewardName, cost) => {
    setSelectedReward({ name: rewardName, cost });
    setShowModal(true);
  };
  
  const confirmRedemption = async () => {
    if (!shippingDetails) return alert('Please enter shipping details');
    setRedeemLoading(true);
    
    const { data, error } = await supabase.from('reward_claims').insert([{
       citizen_id: profile.id,
       reward_name: selectedReward.name,
       tokens_cost: selectedReward.cost,
       shipping_details: shippingDetails
    }]).select();
    
    if (!error && data) {
       setClaims([...claims, data[0]]);
       setShowModal(false);
       setShippingDetails('');
    } else {
       console.error("Redeem error:", error);
       alert("Failed to redeem reward");
    }
    setRedeemLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;
  }

  // Statistics Calculation
  const totalUploads = reports.length;
  // strict pending filter so users aren't confused
  const reportsPending = reports.filter(r => r.status === 'pending' || r.status === 'assigned' || r.status === 'collected').length;
  const reportsResolved = reports.filter(r => r.status === 'resolved').length;
  const ecoImpactKg = reports.reduce((acc, curr) => acc + Number(curr.weight_kg || 0), 0);
  
  // TOKENS: Strict rule - only reward on RESOLVED reports!
  const grossTokens = reports.filter(r => r.status === 'resolved').reduce((acc, curr) => acc + (curr.weight_kg ? Number(curr.weight_kg) * 10 : 10), 0);
  const spentTokens = claims.reduce((acc, curr) => acc + curr.tokens_cost, 0);
  const tokensBalance = grossTokens - spentTokens;
  
  // Real Leaderboard Setup
  const topRanker = leaderboard.length > 0 ? leaderboard[0] : null;
  const myRankIndex = leaderboard.findIndex(l => l.id === profile?.id);
  const myRankNumber = myRankIndex !== -1 ? myRankIndex + 1 : '-';

  return (
    <div className="text-on-surface min-h-screen bg-surface">
      {/* Redemption Modal */}
      {showModal && (
         <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-2xl p-8 max-w-sm w-full shadow-2xl relative border border-primary/20">
               <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
               </button>
               <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-on-surface">
                 <span className="material-symbols-outlined text-primary">shopping_bag</span> Redeem Reward
               </h3>
               <p className="text-sm font-bold text-slate-500 mb-6 border-b border-outline-variant/30 pb-4">
                  Claiming: <span className="text-primary">{selectedReward?.name}</span> <br/>
                  Cost: <span className="text-primary">{selectedReward?.cost} Tokens</span>
               </p>
               <div className="mb-6">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest pl-1 block mb-2">Delivery Details</label>
                  <textarea 
                     rows="3" 
                     className="w-full bg-surface border border-outline-variant rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary shadow-sm" 
                     placeholder="Enter full shipping address, pin code, and contact number"
                     value={shippingDetails}
                     onChange={(e) => setShippingDetails(e.target.value)}
                  />
               </div>
               <button 
                 onClick={confirmRedemption} 
                 disabled={redeemLoading}
                 className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-container shadow-md transition-all active:scale-95 disabled:opacity-70"
               >
                 {redeemLoading ? 'Processing...' : 'Confirm Redemption'}
               </button>
            </div>
         </div>
      )}

      {/* SideNavBar */}
      <aside className="fixed h-full w-64 left-0 top-0 hidden md:flex bg-slate-50 dark:bg-slate-900 shadow-sm flex-col py-6 px-4 z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-green-800 dark:text-green-300 tracking-tighter">HaritSetu</h1>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Digital Stewardship</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 border-l-4 border-green-600 text-green-700 font-bold bg-white transition-all duration-200" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-inter text-sm tracking-tight">Dashboard</span>
          </a>
        </nav>
        <div className="mt-auto space-y-1 pt-6 border-t border-slate-100">
          <Link to="/upload" className="w-full bg-primary hover:bg-primary-container text-white rounded-xl py-3 px-4 mb-4 flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md">
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span className="text-sm font-bold">Report Waste</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-slate-100 transition-all duration-200">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-inter text-sm tracking-tight">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen">
        {/* TopNavBar */}
        <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 flex justify-between items-center h-16 px-6 ml-auto">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600">search</span>
              <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500 transition-all" placeholder="Search activities or reports..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-sm font-bold">
              {profile?.full_name || 'Citizen'}
              <div className="h-8 w-8 rounded-full overflow-hidden bg-primary text-white flex items-center justify-center font-bold">
                 {(profile?.full_name?.[0] || 'C').toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Hero / Quick Actions Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Welcome & CTA */}
            <div className="lg:col-span-8 bg-surface-container-lowest p-8 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[240px] border border-outline-variant/15 hover:border-black/5 transition-colors">
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-on-surface tracking-tight mb-2">Namaste, {profile?.full_name?.split(' ')[0] || 'Friend'}!</h2>
                <p className="text-on-surface-variant max-w-md mb-6 leading-relaxed">Your stewardship has diverted {ecoImpactKg}kg of waste. Tokens are awarded seamlessly once a worker successfully collects your report!</p>
                <Link to="/upload" className="bg-primary hover:bg-primary-container text-white px-8 py-3.5 rounded-lg font-bold flex items-center gap-3 transition-transform active:scale-95 shadow-lg shadow-primary/20 max-w-fit">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
                  Quick Upload
                </Link>
              </div>
              <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-[200px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
              </div>
            </div>

            {/* Total Balance View */}
            <div className="lg:col-span-4 bg-gradient-to-br from-primary to-primary-container p-8 rounded-xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-[100px] pointer-events-none"></div>
              <div>
                <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Available Tokens</p>
                <h3 className="text-6xl font-black tracking-tighter">{tokensBalance}</h3>
                <p className="text-xs opacity-75 mt-1 font-medium">{grossTokens} Earned • {spentTokens} Spent</p>
              </div>
              <div className="space-y-4">
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" style={{ width: `100%`}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-center border border-outline-variant/15 hover:border-primary/50 transition-colors">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 flex items-center gap-1">
                 <span className="material-symbols-outlined text-[14px]">photo_library</span> Uploads
              </p>
              <h4 className="text-3xl font-black text-on-surface">{totalUploads}</h4>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-center border border-outline-variant/15 hover:border-amber-500/50 transition-colors">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                 <span className="material-symbols-outlined text-[14px]">hourglass_empty</span> Active Pipeline
              </p>
              <h4 className="text-3xl font-black text-amber-500">{reportsPending}</h4>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-center border border-outline-variant/15 hover:border-emerald-500/50 transition-colors">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                 <span className="material-symbols-outlined text-[14px]">assignment_turned_in</span> Officially Collected
              </p>
              <h4 className="text-3xl font-black text-emerald-500">{reportsResolved}</h4>
            </div>

            <div className="bg-primary/5 p-6 rounded-xl shadow-sm flex flex-col justify-center border border-primary/20 hover:bg-primary/10 transition-colors">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-1">
                 <span className="material-symbols-outlined text-[14px]">redeem</span> Claims Processing
              </p>
              <h4 className="text-3xl font-black text-primary">{claims.length}</h4>
            </div>
          </div>

          {/* Asymmetric Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Activity Feed */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
                  Your Operations
                  <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                </h3>
              </div>
              <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/15">
                <div className="divide-y divide-slate-50">
                  {reports.length === 0 ? (
                     <div className="p-8 text-center text-on-surface-variant font-medium">
                        No reports yet! Upload your first waste image to see it here.
                     </div>
                  ) : (
                    reports.map(report => (
                      <div key={report.id} className="p-6 flex items-start gap-4 hover:bg-surface-container-low transition-colors group">
                        {report.image_url ? (
                           <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-surface-container-high relative">
                              <img src={report.image_url} alt="Waste" className="w-full h-full object-cover" />
                              {report.status === 'resolved' && (
                                 <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white drop-shadow-md">check_circle</span>
                                 </div>
                              )}
                           </div>
                        ) : (
                           <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-100 bg-surface-container-high flex items-center justify-center">
                             <span className="material-symbols-outlined text-3xl opacity-50">image</span>
                           </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h5 className="text-sm font-bold text-on-surface truncate">
                               {report.type_of_waste || 'Waste'} Report
                            </h5>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              report.status === 'resolved' ? 'bg-primary-fixed text-on-primary-fixed-variant' :
                              report.status === 'assigned' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                              report.status === 'collected' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              'bg-surface-container-highest text-on-surface'
                            }`}>
                              {report.status}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mb-2 leading-relaxed truncate">
                             <span className="font-bold">{report.location || 'Location unspecified'}</span> • Est. {report.weight_kg}kg
                          </p>
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">schedule</span> {new Date(report.created_at).toLocaleDateString()}</span>
                            {report.status === 'resolved' ? (
                               <span className="text-primary font-black">+{report.weight_kg ? Number(report.weight_kg) * 10 : 10} Tokens Earned</span>
                            ) : (
                               <span>Awaiting Admin Verification</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-gradient-to-b from-surface-container-lowest to-surface-container border border-outline-variant/15 p-6 rounded-xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-[100px] pointer-events-none"></div>
                <h4 className="text-sm font-black text-on-surface uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text">leaderboard</span>
                  Actual Live Ranking
                </h4>
                <div className="space-y-4">
                  
                  {topRanker && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-amber-100 shadow-sm relative overflow-hidden">
                      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-amber-100 to-transparent pointer-events-none"></div>
                      <span className="text-xs font-black text-amber-600 w-4">#1</span>
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-amber-200">
                         {topRanker.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 relative z-10">
                        <p className="text-xs font-bold text-on-surface truncate">{topRanker.name} <span className="material-symbols-outlined text-[12px] text-amber-500 align-text-top">workspace_premium</span></p>
                        <p className="text-[10px] text-on-surface-variant font-bold">{topRanker.points} Confirmed Tokens</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200">
                    <span className="text-xs font-black text-slate-400 w-4">#{myRankNumber}</span>
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">
                       {(profile?.full_name?.[0] || 'Y').toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-on-surface">You</p>
                      <p className="text-[10px] text-on-surface-variant">{grossTokens} Confirmed Tokens</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Eco Rewards Store */}
              <div className="bg-white p-6 rounded-xl border border-primary/20 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none"></div>
                <h4 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2 mb-6">
                   <span className="material-symbols-outlined text-primary">redeem</span> Eco Rewards
                </h4>
                
                <div className="space-y-4 relative z-10">
                   {/* Reward 1 */}
                   <div className="flex items-center gap-4 bg-stone-50 p-3 rounded-lg border border-stone-200 hover:border-primary/30 transition-colors">
                      <div className="w-12 h-12 rounded-md bg-white border border-stone-100 flex items-center justify-center shrink-0 text-xl shadow-sm">
                         🌲
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-xs font-bold text-on-surface truncate">Mini Succulent</p>
                         <p className="text-[10px] text-primary font-bold">50 Tokens</p>
                      </div>
                      <button 
                        onClick={() => handleRedeemClick('Mini Succulent', 50)}
                        disabled={tokensBalance < 50} 
                        className={`text-[10px] font-bold px-3 py-2 rounded shadow-sm transition-all ${tokensBalance >= 50 ? 'bg-primary text-white hover:opacity-90 active:scale-95' : 'bg-slate-200 text-slate-400'}`}
                      >
                         {tokensBalance >= 50 ? 'Claim Now' : 'Locked'}
                      </button>
                   </div>

                   {/* Reward 2 */}
                   <div className="flex items-center gap-4 bg-amber-50/50 p-3 rounded-lg border border-amber-100 hover:border-primary/30 transition-colors">
                      <div className="w-12 h-12 rounded-md bg-white border border-amber-50 flex items-center justify-center shrink-0 text-xl shadow-sm">
                         🛍️
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-xs font-bold text-on-surface truncate">Custom Jute Bag</p>
                         <p className="text-[10px] text-primary font-bold">150 Tokens</p>
                      </div>
                      <button 
                         onClick={() => handleRedeemClick('Custom Jute Bag', 150)}
                        disabled={tokensBalance < 150} 
                        className={`text-[10px] font-bold px-3 py-2 rounded shadow-sm transition-all ${tokensBalance >= 150 ? 'bg-primary text-white hover:opacity-90 active:scale-95' : 'bg-slate-200 text-slate-400'}`}
                      >
                         {tokensBalance >= 150 ? 'Claim Now' : 'Locked'}
                      </button>
                   </div>

                   {/* Reward 3 */}
                   <div className="flex items-center gap-4 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 hover:border-primary/30 transition-colors">
                      <div className="w-12 h-12 rounded-md bg-white border border-emerald-50 flex items-center justify-center shrink-0 text-xl shadow-sm">
                         🎫
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-xs font-bold text-on-surface truncate">Community Event Pass</p>
                         <p className="text-[10px] text-primary font-bold">300 Tokens</p>
                      </div>
                      <button 
                        onClick={() => handleRedeemClick('Community Event Pass', 300)}
                        disabled={tokensBalance < 300} 
                        className={`text-[10px] font-bold px-3 py-2 rounded shadow-sm transition-all ${tokensBalance >= 300 ? 'bg-primary text-white hover:opacity-90 active:scale-95' : 'bg-slate-200 text-slate-400'}`}
                      >
                         {tokensBalance >= 300 ? 'Claim Now' : 'Locked'}
                      </button>
                   </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CitizenDashboard;
