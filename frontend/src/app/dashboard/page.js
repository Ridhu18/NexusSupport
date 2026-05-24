'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/utils/auth';
import Navbar from '@/components/Navbar';
import TicketCard from '@/components/TicketCard';
import TicketModal from '@/components/TicketModal';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
    } else {
      setUser(auth.getUser());
    }
  }, [router]);

  // Fetch Tickets
  const fetchTickets = useCallback(async () => {
    if (!auth.isAuthenticated()) return;
    setLoading(true);
    setError(null);

    try {
      // Build query string
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (search.trim()) params.append('search', search);

      const res = await fetch(auth.getApiUrl(`/tickets?${params.toString()}`), {
        headers: auth.getHeaders(),
      });

      if (!res.ok) {
        throw new Error('Failed to retrieve tickets.');
      }

      const data = await res.json();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, priority, search]);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user, fetchTickets]);

  // Stats calculation
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    progress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
    closed: tickets.filter(t => t.status === 'CLOSED').length,
  };

  return (
    <>
      <Navbar />

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto 4rem auto',
        width: '90%',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Welcome Section */}
        {user && (
          <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2.5rem',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '2.25rem',
                color: '#fff',
                fontFamily: 'Outfit',
                fontWeight: '800',
                letterSpacing: '-0.03em',
                background: 'linear-gradient(to right, #fff, hsl(var(--text-secondary)))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Welcome back, {user.username}!</h1>
              <p style={{
                color: 'hsl(var(--text-secondary))',
                fontSize: '0.95rem',
                marginTop: '0.25rem'
              }}>
                {user.role === 'USER' 
                  ? 'Monitor the status of your reported issues or raise a new request.' 
                  : 'Manage incoming queues, assign technician profiles, and resolve requests.'}
              </p>
            </div>

            {user.role === 'USER' && (
              <button 
                id="raise-ticket-btn"
                onClick={() => setIsModalOpen(true)} 
                className="btn btn-primary"
                style={{
                  boxShadow: 'var(--shadow-glow)',
                  padding: '0.85rem 1.75rem',
                  fontSize: '1rem'
                }}
              >
                <span>&#65291;</span> Raise Support Ticket
              </button>
            )}
          </header>
        )}

        {/* Stats Grid widgets */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          {/* Total Widget */}
          <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Requests</span>
            <div style={{ fontSize: '2.25rem', fontWeight: '800', color: '#fff', marginTop: '0.25rem', fontFamily: 'Outfit' }}>{stats.total}</div>
          </div>
          {/* Open Widget */}
          <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', borderColor: 'hsl(var(--status-open) / 0.3)' }}>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--status-open))', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open Queue</span>
            <div style={{ fontSize: '2.25rem', fontWeight: '800', color: '#fff', marginTop: '0.25rem', fontFamily: 'Outfit' }}>{stats.open}</div>
          </div>
          {/* In Progress Widget */}
          <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', borderColor: 'hsl(var(--status-progress) / 0.3)' }}>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--status-progress))', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Work</span>
            <div style={{ fontSize: '2.25rem', fontWeight: '800', color: '#fff', marginTop: '0.25rem', fontFamily: 'Outfit' }}>{stats.progress}</div>
          </div>
          {/* Resolved Widget */}
          <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', borderColor: 'hsl(var(--status-resolved) / 0.3)' }}>
            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--status-resolved))', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolved</span>
            <div style={{ fontSize: '2.25rem', fontWeight: '800', color: '#fff', marginTop: '0.25rem', fontFamily: 'Outfit' }}>{stats.resolved}</div>
          </div>
        </section>

        {/* Filter Bar Panel */}
        <section className="glass-panel" style={{
          padding: '1.25rem 2rem',
          marginBottom: '2.5rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Search */}
          <div style={{ flex: '1', minWidth: '220px' }}>
            <input 
              type="text"
              className="form-input"
              placeholder="Search issues by keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div style={{ minWidth: '160px' }}>
            <select 
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ appearance: 'none', WebkitAppearance: 'none' }}
            >
              <option value="" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>All Statuses</option>
              <option value="OPEN" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Open</option>
              <option value="IN_PROGRESS" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>In Progress</option>
              <option value="RESOLVED" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Resolved</option>
              <option value="CLOSED" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ minWidth: '160px' }}>
            <select 
              className="form-input"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{ appearance: 'none', WebkitAppearance: 'none' }}
            >
              <option value="" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>All Priorities</option>
              <option value="LOW" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Low</option>
              <option value="MEDIUM" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Medium</option>
              <option value="HIGH" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>High</option>
              <option value="URGENT" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Urgent</option>
            </select>
          </div>
        </section>

        {/* Tickets Grid Queue */}
        {error && (
          <div style={{
            backgroundColor: 'hsl(var(--priority-urgent) / 0.15)',
            border: '1px solid hsl(var(--priority-urgent) / 0.4)',
            color: 'hsl(var(--priority-urgent))',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'hsl(var(--text-secondary))' }}>
            <div className="badge badge-progress" style={{ padding: '0.5rem 1rem', fontSize: '1rem', animation: 'pulse-border 2s infinite' }}>Loading Support Queue...</div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '5rem 2rem', borderRadius: 'var(--radius-lg)' }}>
            <span style={{ fontSize: '3rem' }}>📁</span>
            <h3 style={{ fontSize: '1.5rem', color: '#fff', marginTop: '1rem', marginBottom: '0.5rem' }}>No Tickets Found</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>
              We couldn't find any tickets matching your select filters.
            </p>
            {user && user.role === 'USER' && (
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="btn btn-primary"
                style={{ marginTop: '1.5rem' }}
              >
                Raise Your First Ticket
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {tickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </main>

      {/* Creation Modal */}
      <TicketModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTickets}
      />
    </>
  );
}
