'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    // If already authenticated, bypass login screen
    if (auth.isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Handle Login
        if (!username || !password) throw new Error('Username and password are required');
        await auth.login(username, password);
        router.push('/dashboard');
      } else {
        // Handle Register
        if (!username || !email || !password) throw new Error('All registration fields are required');
        await auth.register(username, email, password, role);
        setSuccess('Registration successful! Please log in to your profile.');
        setIsLogin(true);
        // Clean fields
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Brand Watermark Grid */}
      <div className="glass-panel" style={{
        maxWidth: '450px',
        width: '100%',
        padding: '3rem 2.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-glow)'
      }}>
        {/* Brand Header */}
        <header style={{
          textAlign: 'center',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div style={{
            width: '45px',
            height: '45px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '1.6rem',
            color: '#fff',
            boxShadow: '0 0 15px 0 var(--primary-glow)'
          }}>N</div>
          
          <h1 style={{
            fontFamily: 'Outfit',
            fontSize: '2rem',
            fontWeight: '800',
            letterSpacing: '-0.04em',
            background: 'linear-gradient(to right, #fff, hsl(var(--text-secondary)))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginTop: '0.5rem'
          }}>NexusSupport</h1>
          
          <p style={{
            color: 'hsl(var(--text-secondary))',
            fontSize: '0.9rem',
            marginTop: '0.2rem'
          }}>
            {isLogin ? 'Sign in to access your dashboard' : 'Create your enterprise support account'}
          </p>
        </header>

        {/* Error / Success Callout */}
        {error && (
          <div id="login-error-alert" style={{
            backgroundColor: 'hsl(var(--priority-urgent) / 0.15)',
            border: '1px solid hsl(var(--priority-urgent) / 0.4)',
            color: 'hsl(var(--priority-urgent))',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1.2rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div id="login-success-alert" style={{
            backgroundColor: 'hsl(var(--priority-low) / 0.15)',
            border: '1px solid hsl(var(--priority-low) / 0.4)',
            color: 'hsl(var(--priority-low))',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1.2rem',
            textAlign: 'center'
          }}>
            {success}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {/* Username / Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="username-input">
              {isLogin ? 'Username or Email' : 'Username'}
            </label>
            <input 
              id="username-input"
              type="text" 
              className="form-input"
              placeholder={isLogin ? "enter username or email" : "choose a unique username"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Email (Register only) */}
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">Email Address</label>
              <input 
                id="email-input"
                type="email" 
                className="form-input"
                placeholder="your.email@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password</label>
            <input 
              id="password-input"
              type="password" 
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Role selection (Register only) */}
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="role-select">Select Access Role</label>
              <select 
                id="role-select"
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ appearance: 'none', WebkitAppearance: 'none' }}
              >
                <option value="USER" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Client (Standard User)</option>
                <option value="SUPPORT_AGENT" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Support Agent (IT Technician)</option>
                <option value="ADMIN" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>System Administrator</option>
              </select>
            </div>
          )}

          {/* Submit */}
          <button 
            id="auth-submit-btn"
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '1.5rem', height: '45px' }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Mode Switch Footer */}
        <footer style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '0.9rem',
          color: 'hsl(var(--text-secondary))'
        }}>
          <span>{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
          <button 
            id="mode-switch-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'hsl(var(--primary))',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Register now' : 'Sign in here'}
          </button>
        </footer>
      </div>
    </main>
  );
}
