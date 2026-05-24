'use client';

import React, { useState } from 'react';
import { auth } from '@/utils/auth';

export default function TicketModal({ isOpen, onClose, onSuccess }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(auth.getApiUrl('/tickets'), {
        method: 'POST',
        headers: auth.getHeaders(),
        body: JSON.stringify({ subject, description, priority }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit support ticket.');
      }

      // Reset Form
      setSubject('');
      setDescription('');
      setPriority('MEDIUM');
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      <div className="glass-panel" style={{
        width: '90%',
        maxWidth: '550px',
        padding: '2.5rem',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'hsl(var(--text-muted))',
            fontSize: '1.5rem',
            cursor: 'pointer',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#fff'}
          onMouseLeave={(e) => e.target.style.color = 'hsl(var(--text-muted))'}
        >
          &times;
        </button>

        {/* Header */}
        <h2 style={{
          fontSize: '1.75rem',
          color: '#fff',
          marginBottom: '0.5rem',
          background: 'linear-gradient(to right, #fff, hsl(var(--text-secondary)))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>Raise Support Ticket</h2>
        <p style={{
          fontSize: '0.9rem',
          color: 'hsl(var(--text-secondary))',
          marginBottom: '1.5rem'
        }}>Provide detail parameters about the IT issue. A support agent will review it shortly.</p>

        {/* Error Callout */}
        {error && (
          <div style={{
            backgroundColor: 'hsl(var(--priority-urgent) / 0.15)',
            border: '1px solid hsl(var(--priority-urgent) / 0.4)',
            color: 'hsl(var(--priority-urgent))',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Subject */}
          <div className="form-group">
            <label className="form-label">Issue Subject</label>
            <input 
              type="text" 
              className="form-input"
              placeholder="e.g. Cannot connect to corporate VPN network" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Detailed Description</label>
            <textarea 
              className="form-input"
              rows={4}
              placeholder="Provide exact symptoms, screenshots descriptions, and steps to reproduce..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical', minHeight: '100px' }}
              required
            />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">Urgency Priority</label>
            <select 
              className="form-input" 
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{ appearance: 'none', WebkitAppearance: 'none' }}
            >
              <option value="LOW" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Low - General operational query</option>
              <option value="MEDIUM" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Medium - Standard issue (Default)</option>
              <option value="HIGH" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>High - Disrupted department productivity</option>
              <option value="URGENT" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Urgent - Severe system outage / Critical business block</option>
            </select>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '2rem'
          }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '140px' }}
            >
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
