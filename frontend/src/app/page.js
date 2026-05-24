'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/utils/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (auth.isAuthenticated()) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 10
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="badge badge-progress" style={{ 
          padding: '0.75rem 1.5rem', 
          fontSize: '1.1rem', 
          animation: 'pulse-border 2s infinite' 
        }}>
          Directing to Support Portal...
        </div>
      </div>
    </main>
  );
}
