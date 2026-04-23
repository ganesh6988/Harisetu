import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const LoginPage = () => {
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

    // Now let's determine their role to redirect them correctly
    if (authData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();
        
      if (profileError) {
        console.error('Error fetching profile:', profileError.message);
        navigate('/'); // fallback
      } else {
        const role = profileData?.role || 'citizen';
        if (role === 'admin') navigate('/admin');
        else if (role === 'worker') navigate('/worker');
        else navigate('/citizen');
      }
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    
    // Attempt OAuth sign in
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center p-6 bg-surface-container-low">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-[2rem] p-8 shadow-xl ghost-border relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 text-center mb-10">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center shadow-inner">
               <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            </div>
          </Link>
          <h2 className="text-3xl font-black tracking-tight text-on-surface font-headline">Welcome Back</h2>
          <p className="text-on-surface-variant font-body text-sm mt-2">Log in to track your environmental impact.</p>
        </div>

        <form onSubmit={handleLogin} className="relative z-10 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
              {errorMsg}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest pl-1" htmlFor="email">Email Address</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">mail</span>
              <input 
                id="email"
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-surface border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
                placeholder="citizen@haritsetu.in"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center pl-1 pr-1">
               <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest" htmlFor="password">Password</label>
               <a href="#" className="text-xs font-bold text-primary hover:underline">Forgot?</a>
            </div>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">lock</span>
              <input 
                id="password"
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-surface border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary-container text-white font-black text-[15px] rounded-xl shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            ) : (
              <>
                 Secure Login
                 <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-outline-variant"></div>
            <span className="flex-shrink-0 mx-4 text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">Or</span>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 bg-surface border border-outline-variant text-on-surface font-bold text-[14px] rounded-xl shadow-sm hover:bg-surface-variant transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-3"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
        </form>

        <div className="relative z-10 mt-8 space-y-4">
          <p className="text-center text-sm text-on-surface-variant">
            New to HaritSetu? <Link to="/signup" className="text-primary font-bold hover:underline">Create an account</Link>
          </p>
          
          <div className="pt-4 border-t border-outline-variant/30 flex justify-center">
            <Link to="/admin/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">
              <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
