'use client';

import React from 'react';
import Link from 'next/link';

export default function TicketCard({ ticket }) {
  const statusLabels = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed'
  };

  const statusBadges = {
    OPEN: 'badge-open',
    IN_PROGRESS: 'badge-progress',
    RESOLVED: 'badge-resolved',
    CLOSED: 'badge-closed'
  };

  const priorityBadges = {
    LOW: 'badge-priority-low',
    MEDIUM: 'badge-priority-medium',
    HIGH: 'badge-priority-high',
    URGENT: 'badge-priority-urgent'
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="glass-card" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      minHeight: '200px',
      gap: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header Info */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <span style={{
            fontSize: '0.8rem',
            color: 'hsl(var(--text-muted))',
            fontWeight: '700',
            fontFamily: 'Outfit'
          }}>#T-{ticket.id}</span>
          
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            alignItems: 'center'
          }}>
            <span className={`badge ${priorityBadges[ticket.priority]}`} style={{ fontSize: '0.65rem' }}>
              {ticket.priority}
            </span>
            <span className={`badge ${statusBadges[ticket.status]}`} style={{ fontSize: '0.65rem' }}>
              {statusLabels[ticket.status]}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.1rem',
          color: '#fff',
          marginBottom: '0.5rem',
          lineHeight: '1.3'
        }}>{ticket.subject}</h3>

        {/* Description Excerpt */}
        <p style={{
          fontSize: '0.9rem',
          color: 'hsl(var(--text-secondary))',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '1.4',
          marginBottom: '1rem'
        }}>{ticket.description}</p>
      </div>

      {/* Footer Info */}
      <div style={{
        borderTop: '1px solid hsl(var(--border-glass))',
        paddingTop: '0.75rem',
        marginTop: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        color: 'hsl(var(--text-muted))'
      }}>
        <div>
          <span>Raised on: </span>
          <span style={{ fontWeight: '500', color: 'hsl(var(--text-secondary))' }}>
            {formatDate(ticket.createdAt)}
          </span>
        </div>

        {/* Assignee Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}>
          <span style={{ fontSize: '0.75rem' }}>Agent:</span>
          <span style={{
            fontWeight: '600',
            color: ticket.assigneeUsername ? 'hsl(var(--secondary))' : 'hsl(var(--priority-high))',
            fontSize: '0.8rem'
          }}>
            {ticket.assigneeUsername ? ticket.assigneeUsername : 'Unassigned'}
          </span>
        </div>
      </div>

      {/* Click overlay link for complete card access */}
      <Link href={`/tickets/${ticket.id}`} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10
      }} aria-label={`View details of ticket ${ticket.subject}`} />
    </div>
  );
}
