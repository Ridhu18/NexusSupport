'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/utils/auth';
import Navbar from '@/components/Navbar';

export default function TicketDetailPage({ params }) {
  const router = useRouter();
  const [ticketId, setTicketId] = useState(null);
  const [user, setUser] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [agents, setAgents] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Input states
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Rating states
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // Unwrap params safely for all Next.js versions
  useEffect(() => {
    Promise.resolve(params).then(resolvedParams => {
      setTicketId(resolvedParams.id);
    });
  }, [params]);

  // Load user data
  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
    } else {
      setUser(auth.getUser());
    }
  }, [router]);

  // Fetch Ticket Details, Comments, and Attachments
  const fetchData = useCallback(async () => {
    if (!ticketId || !auth.isAuthenticated()) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Ticket
      const ticketRes = await fetch(auth.getApiUrl(`/tickets/${ticketId}`), {
        headers: auth.getHeaders(),
      });
      if (!ticketRes.ok) throw new Error('Failed to retrieve ticket details');
      const ticketData = await ticketRes.json();
      setTicket(ticketData);

      // 2. Fetch Comments
      const commentsRes = await fetch(auth.getApiUrl(`/tickets/${ticketId}/comments`), {
        headers: auth.getHeaders(),
      });
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData);
      }

      // 3. Fetch Attachments
      const attachmentsRes = await fetch(auth.getApiUrl(`/tickets/${ticketId}/attachments`), {
        headers: auth.getHeaders(),
      });
      if (attachmentsRes.ok) {
        const attachmentsData = await attachmentsRes.json();
        setAttachments(attachmentsData);
      }

      // 4. Fetch Support Agents list if not Client
      const currentUser = auth.getUser();
      if (currentUser && currentUser.role !== 'USER') {
        const agentsRes = await fetch(auth.getApiUrl('/users/agents'), {
          headers: auth.getHeaders(),
        });
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json();
          setAgents(agentsData);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId && user) {
      fetchData();
    }
  }, [ticketId, user, fetchData]);

  // Submit a comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setCommentLoading(true);
    try {
      const res = await fetch(auth.getApiUrl(`/tickets/${ticketId}/comments`), {
        method: 'POST',
        headers: auth.getHeaders(),
        body: JSON.stringify({ commentText }),
      });

      if (!res.ok) throw new Error('Failed to submit comment');

      const newComment = await res.json();
      setComments([...comments, newComment]);
      setCommentText('');
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCommentLoading(false);
    }
  };

  // Upload attachment
  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = auth.getToken();
      const res = await fetch(auth.getApiUrl(`/tickets/${ticketId}/attachments`), {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      if (!res.ok) throw new Error('File upload failed');

      const newAttachment = await res.json();
      setAttachments([...attachments, newAttachment]);
      setFile(null);
      
      // Clear input
      document.getElementById('file-upload-input').value = '';
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  // Update Status
  const handleStatusChange = async (newStatus) => {
    try {
      const res = await fetch(auth.getApiUrl(`/tickets/${ticketId}/status?status=${newStatus}`), {
        method: 'PUT',
        headers: auth.getHeaders(),
      });

      if (!res.ok) throw new Error('Failed to update ticket status');

      const updated = await res.json();
      setTicket(updated);
      
      // Reload comments to show transition notices or notifications
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Assign Agent
  const handleAssignAgent = async (agentId) => {
    try {
      const query = agentId ? `?agentId=${agentId}` : '';
      const res = await fetch(auth.getApiUrl(`/tickets/${ticketId}/assign${query}`), {
        method: 'PUT',
        headers: auth.getHeaders(),
      });

      if (!res.ok) throw new Error('Failed to update ticket assignment');

      const updated = await res.json();
      setTicket(updated);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit Rating
  const handleRateResolution = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(auth.getApiUrl(`/tickets/${ticketId}/rate?rating=${rating}&feedback=${encodeURIComponent(feedback)}`), {
        method: 'POST',
        headers: auth.getHeaders(),
      });

      if (!res.ok) throw new Error('Failed to submit resolution rating.');

      const updated = await res.json();
      setTicket(updated);
      setRatingSuccess(true);
    } catch (err) {
      alert(err.message);
    }
  };

  // Secure download using fetch with Authorization header
  const handleDownloadFile = async (attachmentId, fileName) => {
    try {
      const res = await fetch(auth.getApiUrl(`/tickets/attachments/download/${attachmentId}`), {
        headers: auth.getHeaders(),
      });

      if (!res.ok) throw new Error('Failed to download file');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '6rem', color: 'hsl(var(--text-secondary))' }}>
          <div className="badge badge-progress" style={{ padding: '0.5rem 1rem', fontSize: '1rem', animation: 'pulse-border 2s infinite' }}>
            Retrieving ticket audit thread...
          </div>
        </div>
      </>
    );
  }

  if (error || !ticket) {
    return (
      <>
        <Navbar />
        <main style={{ maxWidth: '800px', margin: '4rem auto', width: '90%', textAlign: 'center' }}>
          <div className="glass-panel" style={{ padding: '3rem 2rem' }}>
            <span style={{ fontSize: '3rem' }}>⚠️</span>
            <h3 style={{ fontSize: '1.5rem', color: '#fff', marginTop: '1rem', marginBottom: '0.5rem' }}>Audit Retrieval Blocked</h3>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>{error || 'The requested ticket does not exist or you do not have permission to view it.'}</p>
          </div>
        </main>
      </>
    );
  }

  const priorityBadges = {
    LOW: 'badge-priority-low',
    MEDIUM: 'badge-priority-medium',
    HIGH: 'badge-priority-high',
    URGENT: 'badge-priority-urgent'
  };

  const statusBadges = {
    OPEN: 'badge-open',
    IN_PROGRESS: 'badge-progress',
    RESOLVED: 'badge-resolved',
    CLOSED: 'badge-closed'
  };

  const statusLabels = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed'
  };

  return (
    <>
      <Navbar />

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto 4rem auto',
        width: '90%',
        position: 'relative',
        zIndex: 10,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2rem'
      }}>
        {/* Left / Middle Span: Ticket Header & Conversation */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Ticket Information Panel */}
          <section className="glass-panel" style={{ padding: '2.5rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontWeight: '700' }}>
                  #TICKET-{ticket.id}
                </span>
                <h1 style={{ fontSize: '1.8rem', color: '#fff', marginTop: '0.25rem', lineHeight: '1.2' }}>
                  {ticket.subject}
                </h1>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className={`badge ${priorityBadges[ticket.priority]}`} style={{ padding: '0.35rem 0.75rem' }}>
                  {ticket.priority} Priority
                </span>
                <span className={`badge ${statusBadges[ticket.status]}`} style={{ padding: '0.35rem 0.75rem' }}>
                  {statusLabels[ticket.status]}
                </span>
              </div>
            </div>

            {/* Description */}
            <h3 style={{ fontSize: '1rem', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Issue Description</h3>
            <p style={{
              backgroundColor: 'hsl(var(--bg-base) / 0.5)',
              border: '1px solid hsl(var(--border-glass))',
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              color: 'hsl(var(--text-secondary))',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              fontSize: '0.95rem'
            }}>{ticket.description}</p>
          </section>

          {/* Comment Message Feed / Thread */}
          <section className="glass-panel" style={{ padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '1.5rem', fontFamily: 'Outfit' }}>Audit Conversation Feed</h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '0.5rem',
              marginBottom: '2rem'
            }}>
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
                  No messages on this audit timeline. Add a comment below to update the ticket state.
                </div>
              ) : (
                comments.map(c => {
                  const isCurrentUser = user && c.userId === user.id;
                  return (
                    <div key={c.id} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}>
                      {/* Name & Time */}
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        color: 'hsl(var(--text-muted))',
                        marginBottom: '0.25rem',
                        padding: '0 0.5rem'
                      }}>
                        <span style={{ fontWeight: '700', color: isCurrentUser ? 'hsl(var(--primary))' : 'hsl(var(--secondary))' }}>
                          {c.username}
                        </span>
                        <span className="badge" style={{
                          fontSize: '0.6rem',
                          padding: '0 0.3rem',
                          background: c.userRole === 'ADMIN' ? 'hsl(var(--priority-urgent)/0.15)' : c.userRole === 'SUPPORT_AGENT' ? 'hsl(var(--priority-medium)/0.15)' : 'hsl(var(--priority-low)/0.15)',
                          color: c.userRole === 'ADMIN' ? 'hsl(var(--priority-urgent))' : c.userRole === 'SUPPORT_AGENT' ? 'hsl(var(--priority-medium))' : 'hsl(var(--priority-low))',
                        }}>
                          {c.userRole === 'ADMIN' ? 'Admin' : c.userRole === 'SUPPORT_AGENT' ? 'Agent' : 'Client'}
                        </span>
                        <span>•</span>
                        <span>{new Date(c.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Bubble */}
                      <div style={{
                        background: isCurrentUser 
                          ? 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--secondary) / 0.15))' 
                          : 'hsl(var(--bg-card))',
                        border: '1px solid',
                        borderColor: isCurrentUser ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--border-glass))',
                        padding: '0.85rem 1.25rem',
                        borderRadius: isCurrentUser ? '12px 12px 0 12px' : '12px 12px 12px 0',
                        maxWidth: '85%',
                        color: '#fff',
                        fontSize: '0.9rem',
                        lineHeight: '1.4',
                        boxShadow: isCurrentUser ? '0 0 10px 0 var(--primary-glow)' : 'none'
                      }}>
                        {c.commentText}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Post Form */}
            {ticket.status !== 'CLOSED' ? (
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Type your reply or audit update here..." 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={commentLoading}
                  required
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={commentLoading || !commentText.trim()}
                  style={{ minWidth: '110px' }}
                >
                  {commentLoading ? 'Posting...' : 'Reply'}
                </button>
              </form>
            ) : (
              <div className="badge badge-closed" style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', fontSize: '0.9rem' }}>
                This ticket has been permanently closed. No further comments can be posted.
              </div>
            )}
          </section>
        </div>

        {/* Right Side Span: Metadata Sidebar & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Metadata & Actions Sidebar */}
          <section className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '1.5rem', fontFamily: 'Outfit' }}>Ticket Management</h2>

            {/* Owner Parameters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: '700' }}>Creator Client</span>
                <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.95rem', marginTop: '0.15rem' }}>{ticket.creatorUsername}</div>
                <div style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem' }}>{ticket.creatorEmail}</div>
              </div>

              {/* Assignee Details */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: '700' }}>Assigned Support Tech</span>
                <div style={{
                  color: ticket.assigneeUsername ? 'hsl(var(--secondary))' : 'hsl(var(--priority-high))', 
                  fontWeight: '700', 
                  fontSize: '0.95rem', 
                  marginTop: '0.15rem' 
                }}>
                  {ticket.assigneeUsername ? ticket.assigneeUsername : 'Unassigned (Waiting)'}
                </div>
              </div>
            </div>

            {/* Support Actions: Status Update & Assignee Drop-down */}
            {user && user.role !== 'USER' && (
              <div style={{
                borderTop: '1px solid hsl(var(--border-glass))',
                paddingTop: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                {/* Status Trigger */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Set Lifecycle Status</label>
                  <select
                    className="form-input"
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    style={{ appearance: 'none', WebkitAppearance: 'none' }}
                  >
                    <option value="OPEN" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Open</option>
                    <option value="IN_PROGRESS" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>In Progress</option>
                    <option value="RESOLVED" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Resolved</option>
                    <option value="CLOSED" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Closed</option>
                  </select>
                </div>

                {/* Assignment Trigger */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Assign Support Tech</label>
                  <select
                    className="form-input"
                    value={ticket.assigneeId || ''}
                    onChange={(e) => handleAssignAgent(e.target.value)}
                    style={{ appearance: 'none', WebkitAppearance: 'none' }}
                  >
                    <option value="" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>-- Unassign Tech --</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id} style={{ backgroundColor: 'hsl(var(--bg-card))' }}>
                        {a.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Client specific closure action */}
            {user && user.role === 'USER' && ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
              <button 
                onClick={() => handleStatusChange('CLOSED')}
                className="btn btn-danger"
                style={{ width: '100%', height: '40px', marginTop: '1rem' }}
              >
                Close Ticket Request
              </button>
            )}
          </section>

          {/* Rating Section (Creator only and Resolved/Closed only) */}
          {user && user.id === ticket.creatorId && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
            <section className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '1rem', fontFamily: 'Outfit' }}>Rate Resolution</h2>

              {ticket.rating ? (
                <div>
                  <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.75rem' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} style={{ fontSize: '1.3rem', color: star <= ticket.rating ? 'goldenrod' : 'hsl(var(--text-muted))' }}>★</span>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', fontStyle: 'italic' }}>
                    "{ticket.feedback || 'No feedback comment supplied.'}"
                  </p>
                </div>
              ) : ratingSuccess ? (
                <div className="badge badge-resolved" style={{ padding: '0.5rem 1rem', width: '100%', justifyContent: 'center' }}>
                  Thank you for your rating!
                </div>
              ) : (
                <form onSubmit={handleRateResolution}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          color: star <= rating ? 'goldenrod' : 'hsl(var(--text-muted))',
                          transition: 'transform 0.1s'
                        }}
                      >★</button>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Feedback Comments</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Share your experience resolving this issue..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '35px' }}>
                    Submit Feedback
                  </button>
                </form>
              )}
            </section>
          )}

          {/* Attachments Panel */}
          <section className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '1.25rem', fontFamily: 'Outfit' }}>Attachments</h2>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {attachments.length === 0 ? (
                <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem', fontStyle: 'italic' }}>
                  No files attached to this ticket audit thread.
                </div>
              ) : (
                attachments.map(att => (
                  <div key={att.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'hsl(var(--bg-base) / 0.4)',
                    border: '1px solid hsl(var(--border-glass))',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '500' }}>{att.fileName}</span>
                    </div>
                    
                    <button
                      onClick={() => handleDownloadFile(att.id, att.fileName)}
                      className="badge badge-open"
                      style={{ textDecoration: 'none', cursor: 'pointer', fontSize: '0.65rem', border: 'none' }}
                    >
                      Download
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Upload form */}
            {ticket.status !== 'CLOSED' && (
              <form onSubmit={handleUploadFile} style={{ borderTop: '1px solid hsl(var(--border-glass))', paddingTop: '1rem' }}>
                <div className="form-group" style={{ gap: '0.5rem' }}>
                  <input
                    id="file-upload-input"
                    type="file"
                    className="form-input"
                    style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={uploadLoading || !file}
                    style={{ padding: '0.4rem', fontSize: '0.8rem', height: '35px' }}
                  >
                    {uploadLoading ? 'Uploading...' : 'Attach File'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
