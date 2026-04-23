import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const SignupPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen'); // default role
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Sign up the user in Supabase Auth and pass metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        }
      }
    });

    if (authError) {
      setErrorMsg(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      setSuccessMsg("Account created! Redirecting...");
      
      // Auto-redirect to the correct dashboard after a short delay
      setTimeout(() => {
        if (role === 'worker') navigate('/worker');
        else if (role === 'admin') navigate('/admin');
        else navigate('/citizen');
      }, 1500);
    } else {
      setSuccessMsg("Please check your email for a confirmation link.");
    }

    setLoading(false);
  };

  const handleGoogleSignup = async () => {
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
        <div className="absolute top-[-50%] right-[-50%] w-full h-[150%] bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center shadow-inner">
               <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>app_registration</span>
            </div>
          </Link>
          <h2 className="text-3xl font-black tracking-tight text-on-surface font-headline">Join HaritSetu</h2>
          <p className="text-on-surface-variant font-body text-sm mt-2">Become a digital steward of your community.</p>
        </div>

        <form onSubmit={handleSignup} className="relative z-10 space-y-5">
          {errorMsg && (
            <div className="p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-primary-container text-on-primary-container rounded-xl text-sm font-medium">
              {successMsg}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest pl-1" htmlFor="fullName">Full Name</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-colors">person</span>
              <input 
                id="fullName"
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary focus:border-secondary transition-all shadow-sm"
                placeholder="Aruna Patel"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest pl-1" htmlFor="email">Email Address</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-colors">mail</span>
              <input 
                id="email"
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary focus:border-secondary transition-all shadow-sm"
                placeholder="aruna@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest pl-1" htmlFor="password">Password</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-secondary transition-colors">lock</span>
              <input 
                id="password"
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-secondary focus:border-secondary transition-all shadow-sm"
                placeholder="Choose a strong password"
              />
            </div>
          </div>

          <div className="space-y-1">
             <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Join As</label>
             <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setRole('citizen')}
                  className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    role === 'citizen' 
                      ? 'bg-secondary-container border-secondary-container text-on-secondary-container shadow-sm border-2' 
                      : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  Citizen
                </button>
                <button
                  type="button"
                  onClick={() => setRole('worker')}
                  className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    role === 'worker' 
                      ? 'bg-tertiary-container border-tertiary-container text-on-tertiary-container shadow-sm border-2' 
                      : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">engineering</span>
                  Worker
                </button>
             </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-2 bg-gradient-to-r from-secondary to-secondary-container text-white font-black text-[15px] rounded-xl shadow-lg hover:shadow-secondary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            ) : (
              <>
                 Create Account
                 <span className="material-symbols-outlined text-lg">person_add</span>
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
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full py-3.5 bg-surface border border-outline-variant text-on-surface font-bold text-[14px] rounded-xl shadow-sm hover:bg-surface-variant transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-3"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        </form>

        <p className="relative z-10 text-center mt-6 text-sm text-on-surface-variant">
          Already a digital steward? <Link to="/login" className="text-secondary font-bold hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
