import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const LandingPage = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({ weight: 0, users: 0, reports: 0, rewards: 0 });
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const { data, error } = await supabase.rpc('get_platform_stats');
      if (!error && data) {
         setStats({
            weight: data.total_weight.toFixed(1),
            users: data.total_users,
            reports: data.total_reports,
            rewards: data.total_rewards
         });
      } else {
         console.error("Error fetching stats:", error);
      }
    };
    
    fetchStats();

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        const role = profile?.role || 'citizen';
        if (role === 'admin') navigate('/admin');
        else if (role === 'worker') navigate('/worker');
        else navigate('/citizen');
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="bg-surface text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen">
      {/* Top Navigation */}
      <nav className="sticky top-0 w-full z-40 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.05)] flex justify-between items-center h-20 px-8 transition-all">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500 dark:text-emerald-400 text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>recycling</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter font-headline">HaritSetu</span>
          </div>
          <div className="hidden md:flex items-center gap-2 ml-8 bg-slate-900 dark:bg-slate-800 px-2 py-2 rounded-full border border-slate-700 shadow-xl">
            <a className="text-slate-300 hover:text-white hover:bg-emerald-600 transition-all font-bold text-[13px] tracking-wide px-5 py-2 rounded-full" href="#">Overview</a>
            <a className="text-slate-300 hover:text-white hover:bg-emerald-600 transition-all font-bold text-[13px] tracking-wide px-5 py-2 rounded-full" href="#methodology">Methodology</a>
            <a className="text-slate-300 hover:text-white hover:bg-emerald-600 transition-all font-bold text-[13px] tracking-wide px-5 py-2 rounded-full" href="#impact">Impact</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/upload" className="hidden sm:block px-6 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-sm rounded-xl shadow-md hover:shadow-primary/30 transition-all scale-100 active:scale-95">
            Report Waste
          </Link>
          <Link to="/login" className="px-6 py-2.5 bg-surface-container-highest text-on-surface font-bold text-sm rounded-xl shadow-sm hover:bg-surface-variant transition-all scale-100 active:scale-95">
            Log In
          </Link>
          <Link to="/signup" className="hidden sm:block px-6 py-2.5 bg-gradient-to-r from-secondary to-secondary-container text-on-secondary font-bold text-sm rounded-xl shadow-md transition-all scale-100 active:scale-95 hover:opacity-90">
            Sign Up
          </Link>
        </div>
      </nav>

      <main className="relative">
        {/* Hero Section */}
        <section className="relative min-h-[870px] flex items-center overflow-hidden px-6 lg:px-20 py-20">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px]"></div>
          </div>
          <div className="container mx-auto relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-xs font-black tracking-widest uppercase mb-6 shadow-sm">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
                Digital Stewardship
              </div>
              <h1 className="text-6xl lg:text-8xl font-black text-on-surface tracking-tighter leading-[0.9] mb-8 font-headline">
                Smart Waste.<br/><span className="text-primary">Clean Future.</span>
              </h1>
              <p className="text-xl text-on-surface-variant leading-relaxed mb-10 max-w-lg font-body">
                Join the movement for a cleaner, greener community with modern digital waste management. Precision logistics for a sustainable tomorrow.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/upload" className="px-8 py-4 bg-gradient-to-r from-primary to-primary-container text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
                  Report Waste
                </Link>
                <button onClick={() => setShowHowItWorksModal(true)} className="px-8 py-4 bg-slate-900 text-white font-bold text-lg rounded-xl hover:bg-slate-800 transition-all inline-block shadow-lg">
                  How it Works
                </button>
              </div>
            </div>

            {/* Bento Hero Visual */}
            <div className="relative grid grid-cols-12 gap-4 h-[500px]">
              <div className="col-span-8 row-span-12 relative rounded-3xl overflow-hidden shadow-2xl group">
                <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Modern clean urban recycling center" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdn-Slo4b6LedOGuGzyOZitINEIRCrvBsX44u7XxdCagDZE5xT-XmuxhIr3yeCXGVCA5yMQbbps5tJ1Y2mvmpc5XoombRckT6w1nkCrIaFYIt0ZCCG7tewagGtB_Zs7FxY0MyF8wACCRoMggUseXScuKDO9vjGZiuinjJAZAiOIvmZAkmRp3SGGphsZJc9hA0-HtWNvPegSgdylijVwAIAL9-ldx7bCpOwwnyYjosXbwMryiLirkxCNfJso0oXURfhNjzxamRFVm6u" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Active Zone</p>
                  <h3 className="text-2xl font-bold">Lutyens Garden District</h3>
                </div>
              </div>
              <div className="col-span-4 row-span-6 bg-primary-container/10 rounded-3xl p-6 flex flex-col justify-between border border-primary/10">
                <span className="material-symbols-outlined text-primary text-4xl">eco</span>
                <div>
                  <p className="text-4xl font-black text-primary tracking-tighter">84%</p>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Recycling Efficiency</p>
                </div>
              </div>
              <div className="col-span-4 row-span-6 bg-surface-container-lowest rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center text-center ghost-border">
                <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-on-secondary-fixed-variant">trending_up</span>
                </div>
                <p className="text-xs font-bold text-on-surface-variant">Total Operations</p>
                <p className="text-xl font-bold">{stats.reports}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="methodology" className="py-24 bg-surface-container-low scroll-mt-20">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div className="max-w-xl">
                <h2 className="text-4xl font-black tracking-tight text-on-surface mb-4 font-headline uppercase">Regenerative Systems</h2>
                <p className="text-on-surface-variant font-body">Our platform transforms the lifecycle of urban waste using sophisticated tracking and AI-driven route precision.</p>
              </div>
              <div className="flex items-center gap-2 text-primary font-bold text-sm tracking-widest uppercase cursor-pointer">
                Explore Methodology
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-surface-container-lowest rounded-[2rem] p-8 md:p-12 shadow-sm ghost-border relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8">
                    <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-4">Visual Data Logging</h3>
                  <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">Upload a photo of your waste, and our system tracks it instantly, providing optimal disposal routing and environmental impact metrics.</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary to-primary-container rounded-[2rem] p-8 text-white flex flex-col justify-between">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-3xl">route</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Smart Route Logic</h3>
                  <p className="text-white/80 text-sm">Dynamic pickup scheduling that reduces collection carbon footprint by 40%.</p>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm ghost-border flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Sustainability Index</span>
                    <span className="material-symbols-outlined text-primary">verified</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[78%] rounded-full shadow-[0_0_10px_rgba(0,107,44,0.3)]"></div>
                  </div>
                  <p className="text-sm font-medium">Community is 78% closer to Zero-Waste Goal this month.</p>
                </div>
                <div className="mt-8">
                  <h3 className="text-2xl font-bold mb-2">Real-time Impact</h3>
                  <p className="text-on-surface-variant text-sm">Watch your personal and community contributions grow on the live dashboard.</p>
                </div>
              </div>

              <div className="md:col-span-2 bg-inverse-surface rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden group">
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <h3 className="text-3xl font-bold max-w-sm">Transparent Personnel Tracking</h3>
                  <div className="flex -space-x-4">
                    <div className="w-12 h-12 rounded-full border-4 border-inverse-surface bg-surface-container-high text-on-surface flex items-center justify-center text-xs font-bold">+24</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="impact" className="py-24 bg-surface scroll-mt-20">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              <div>
                <p className="text-5xl font-black text-on-surface tracking-tighter mb-2">{stats.weight} <span className="text-3xl">kg</span></p>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Total Weight</p>
              </div>
              <div>
                <p className="text-5xl font-black text-primary tracking-tighter mb-2">{stats.users}</p>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Active Citizens</p>
              </div>
              <div>
                <p className="text-5xl font-black text-on-surface tracking-tighter mb-2">{stats.reports}</p>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Total Reports</p>
              </div>
              <div>
                <p className="text-5xl font-black text-secondary tracking-tighter mb-2">{stats.rewards}</p>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Rewards Claimed</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-surface-container-lowest rounded-[3rem] p-8 md:p-20 shadow-xl ghost-border flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent"></div>
              <div className="relative z-10 md:w-3/5">
                <h2 className="text-4xl md:text-6xl font-black text-on-surface mb-6 tracking-tight leading-tight">Ready to lead the change?</h2>
                <p className="text-xl text-on-surface-variant mb-10 leading-relaxed">Start your digital stewardship today. Report your first waste collection and earn carbon credits for a cleaner tomorrow.</p>
                <div className="flex flex-wrap gap-4">
                  <button className="px-10 py-5 bg-primary text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-primary/30 transition-all scale-100 active:scale-95">
                    Join the Movement
                  </button>
                  <button onClick={() => setShowContactModal(true)} className="px-10 py-5 bg-white text-slate-900 font-black text-lg rounded-2xl border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                    Contact Support
                  </button>
                </div>
              </div>
              <div className="relative z-10 md:w-2/5 flex justify-center">
                <div className="w-64 h-64 bg-primary rounded-full flex items-center justify-center p-8 animate-pulse shadow-[0_0_50px_rgba(0,107,44,0.2)]">
                  <span className="material-symbols-outlined text-white text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modals */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowHowItWorksModal(false)}>
          <div className="bg-surface w-full max-w-3xl rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="bg-emerald-600 p-8 text-white relative">
              <button onClick={() => setShowHowItWorksModal(false)} className="absolute top-6 right-6 w-10 h-10 bg-black/20 rounded-full flex items-center justify-center hover:bg-black/30 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
              <h2 className="text-3xl font-black mb-2">How HaritSetu Works</h2>
              <p className="text-emerald-50">The simple, rewarding path to a cleaner environment.</p>
            </div>
            <div className="p-8 grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black">1</div>
                <h4 className="font-bold text-lg">Snap & Upload</h4>
                <p className="text-sm text-slate-500">Take a photo of waste in your area. Our system instantly logs the location.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black">2</div>
                <h4 className="font-bold text-lg">Smart Dispatch</h4>
                <p className="text-sm text-slate-500">The nearest available collection worker is notified and routed to the spot.</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center text-3xl font-black">3</div>
                <h4 className="font-bold text-lg">Earn Rewards</h4>
                <p className="text-sm text-slate-500">Once collected, you earn tokens that can be redeemed for eco-friendly goods!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowContactModal(false)}>
          <div className="bg-surface w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowContactModal(false)} className="absolute top-6 right-6 w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">support_agent</span>
            </div>
            <h2 className="text-2xl font-black mb-2 text-slate-900">Contact Support</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">We're here to help! Whether you have an issue with a report or need account assistance, reach out to our team.</p>
            
            <div className="space-y-4">
              <a href="mailto:support@haritsetu.in" className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-600 hover:bg-emerald-50 transition-all group">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-600">mail</span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Email Us</h4>
                  <p className="text-xs text-slate-500">support@haritsetu.in</p>
                </div>
              </a>
              <a href="tel:+911800000000" className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-600 hover:bg-emerald-50 transition-all group">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-600">call</span>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Call Toll-Free</h4>
                  <p className="text-xs text-slate-500">1800-000-0000</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
