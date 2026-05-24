'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { auth } from '@/utils/auth';

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(auth.getUser());
  }, []);

  if (!user) return null;

  const roleLabels = {
    ADMIN: 'Administrator',
    SUPPORT_AGENT: 'Support Agent',
    USER: 'Client'
  };

  const badgeClasses = {
    ADMIN: 'badge-priority-urgent',
    SUPPORT_AGENT: 'badge-priority-medium',
    USER: 'badge-priority-low'
  };

  return (
    <nav className="glass-panel" style={{
      margin: '1.5rem auto',
      maxWidth: '1200px',
      width: '90%',
      borderRadius: 'var(--radius-md)',
      padding: '0.75rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: '1rem',
      zIndex: 50
    }}>
      {/* Brand Logo */}
      <Link href="/dashboard" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        textDecoration: 'none',
        color: '#fff'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: 'var(--radius-sm)',
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '800',
          fontSize: '1.2rem',
          boxShadow: '0 0 10px 0 var(--primary-glow)'
        }}>N</div>
        <span style={{
          fontFamily: 'Outfit',
          fontSize: '1.3rem',
          fontWeight: '800',
          letterSpacing: '-0.03em',
          background: 'linear-gradient(to right, #fff, hsl(var(--text-secondary)))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>NexusSupport</span>
      </Link>

      {/* Nav Links */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2rem'
      }}>
        <Link href="/dashboard" className="btn-secondary" style={{
          padding: '0.4rem 1rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.9rem',
          textDecoration: 'none'
        }}>Dashboard</Link>
        
        {user.role === 'ADMIN' && (
          <Link href="/admin" className="btn-secondary" style={{
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            textDecoration: 'none'
          }}>Admin Panel</Link>
        )}
      </div>

      {/* User Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '0.2rem'
        }}>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '600',
            color: '#fff'
          }}>{user.username}</span>
          <span className={`badge ${badgeClasses[user.role]}`} style={{
            fontSize: '0.65rem',
            padding: '0.1rem 0.4rem'
          }}>{roleLabels[user.role]}</span>
        </div>

        <button onClick={() => auth.logout()} className="btn btn-danger" style={{
          padding: '0.4rem 1rem',
          fontSize: '0.85rem',
          borderRadius: 'var(--radius-sm)'
        }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
