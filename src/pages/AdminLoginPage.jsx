import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setErrorMsg(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();
        
      if (profileError) {
        console.error('Error fetching profile:', profileError.message);
        setErrorMsg('Error fetching profile. Please try again.');
        await supabase.auth.signOut();
      } else {
        const role = profileData?.role || 'citizen';
        if (role === 'admin') {
          navigate('/admin');
        } else {
          setErrorMsg('Access denied. You do not have administrator privileges.');
          await supabase.auth.signOut();
        }
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col items-center justify-center p-6 bg-surface-container-low selection:bg-indigo-500/30">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-50%] left-[-50%] w-full h-full bg-slate-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 text-center mb-10">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-inner">
               <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
            </div>
          </Link>
          <h2 className="text-3xl font-black tracking-tight text-white font-headline">Admin Access</h2>
          <p className="text-slate-400 font-body text-sm mt-2">Secure gateway to HaritSetu command control.</p>
        </div>

        <form onSubmit={handleLogin} className="relative z-10 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
              {errorMsg}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1" htmlFor="email">Admin Email</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">mail</span>
              <input 
                id="email"
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder-slate-600 shadow-inner"
                placeholder="admin@haritsetu.in"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center pl-1 pr-1">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest" htmlFor="password">Passphrase</label>
            </div>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">lock</span>
              <input 
                id="password"
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white placeholder-slate-600 shadow-inner"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[15px] rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            ) : (
              <>
                 Authenticate
                 <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500 font-medium">This section is strictly for authorized personnel.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
