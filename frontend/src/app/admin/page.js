'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/utils/auth';
import Navbar from '@/components/Navbar';

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Create User form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Authenticate and authorize ADMIN only
  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    const currentUser = auth.getUser();
    if (currentUser?.role !== 'ADMIN') {
      router.push('/dashboard');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    if (!auth.isAuthenticated()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(auth.getApiUrl('/admin/users'), {
        headers: auth.getHeaders(),
      });

      if (!res.ok) {
        throw new Error('Failed to retrieve user directory.');
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) {
      fetchUsers();
    }
  }, [authorized, fetchUsers]);

  // Handle Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (!username.trim() || !email.trim() || !password.trim()) {
      setFormError('All fields are required.');
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch(auth.getApiUrl('/admin/users'), {
        method: 'POST',
        headers: auth.getHeaders(),
        body: JSON.stringify({ username, email, password, role }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to register user.');
      }

      setFormSuccess(`User ${username} successfully registered!`);
      // Reset Form
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('USER');
      // Refresh list
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Role Change
  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const res = await fetch(auth.getApiUrl(`/admin/users/${targetUserId}/role?role=${newRole}`), {
        method: 'PUT',
        headers: auth.getHeaders(),
      });

      if (!res.ok) {
        throw new Error('Failed to update role.');
      }
      
      // Update list locally
      setUsers(users.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (targetUserId) => {
    const currentUser = auth.getUser();
    if (currentUser?.id === targetUserId) {
      alert('You cannot delete your own active administrator profile.');
      return;
    }

    if (!confirm('Are you sure you want to permanently delete this user? All their comments and tickets associations will remain in read-only format.')) {
      return;
    }

    try {
      const res = await fetch(auth.getApiUrl(`/admin/users/${targetUserId}`), {
        method: 'DELETE',
        headers: auth.getHeaders(),
      });

      if (!res.ok) {
        throw new Error('Failed to delete user profile.');
      }

      setUsers(users.filter(u => u.id !== targetUserId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (!authorized) return null;

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
        {/* Header */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{
            fontSize: '2.25rem',
            color: '#fff',
            fontFamily: 'Outfit',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(to right, #fff, hsl(var(--text-secondary)))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>System Command Center</h1>
          <p style={{
            color: 'hsl(var(--text-secondary))',
            fontSize: '0.95rem',
            marginTop: '0.25rem'
          }}>
            Manage enterprise user accounts, assign support system roles, and audit access parameters.
          </p>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'flex-start'
        }}>
          {/* User Directory List */}
          <section className="glass-panel" style={{
            padding: '2rem',
            gridColumn: 'span 2',
            overflow: 'hidden'
          }}>
            <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.5rem', fontFamily: 'Outfit' }}>User Account Directory</h2>

            {error && (
              <div style={{
                backgroundColor: 'hsl(var(--priority-urgent) / 0.15)',
                border: '1px solid hsl(var(--priority-urgent) / 0.4)',
                color: 'hsl(var(--priority-urgent))',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.5rem'
              }}>{error}</div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-secondary))' }}>
                Loading accounts...
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.9rem',
                  textAlign: 'left'
                }}>
                  <thead>
                    <tr style={{
                      borderBottom: '1px solid hsl(var(--border-glass))',
                      color: 'hsl(var(--text-secondary))',
                      fontWeight: '700'
                    }}>
                      <th style={{ padding: '0.75rem 1rem' }}>User ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Username</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Email Address</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Access Role</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{
                        borderBottom: '1px solid hsl(var(--border-glass) / 0.5)',
                        transition: 'background-color 0.2s'
                      }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--border-glass) / 0.1)'}
                         onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '1rem', color: 'hsl(var(--text-muted))', fontWeight: '700' }}>#{u.id}</td>
                        <td style={{ padding: '1rem', fontWeight: '600', color: '#fff' }}>{u.username}</td>
                        <td style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>{u.email}</td>
                        <td style={{ padding: '1rem' }}>
                          <select
                            className="form-input"
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.8rem',
                              width: 'auto',
                              minWidth: '130px',
                              borderRadius: 'var(--radius-sm)',
                              appearance: 'none',
                              WebkitAppearance: 'none'
                            }}
                          >
                            <option value="USER" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Client (USER)</option>
                            <option value="SUPPORT_AGENT" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Support Agent</option>
                            <option value="ADMIN" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Administrator</option>
                          </select>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="btn btn-danger"
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.8rem',
                              borderRadius: 'var(--radius-sm)'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Add User Profile Form */}
          <section className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.25rem', fontFamily: 'Outfit' }}>Provision User Account</h2>
            
            {formError && (
              <div style={{
                backgroundColor: 'hsl(var(--priority-urgent) / 0.15)',
                border: '1px solid hsl(var(--priority-urgent) / 0.4)',
                color: 'hsl(var(--priority-urgent))',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>{formError}</div>
            )}

            {formSuccess && (
              <div style={{
                backgroundColor: 'hsl(var(--priority-low) / 0.15)',
                border: '1px solid hsl(var(--priority-low) / 0.4)',
                color: 'hsl(var(--priority-low))',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>{formSuccess}</div>
            )}

            <form onSubmit={handleCreateUser}>
              {/* Username */}
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. jdoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. john.doe@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Role */}
              <div className="form-group">
                <label className="form-label">System Access Role</label>
                <select
                  className="form-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ appearance: 'none', WebkitAppearance: 'none' }}
                >
                  <option value="USER" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Client (Standard USER)</option>
                  <option value="SUPPORT_AGENT" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>Support Agent (IT Tech)</option>
                  <option value="ADMIN" style={{ backgroundColor: 'hsl(var(--bg-card))' }}>System Administrator</option>
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formLoading}
                style={{ width: '100%', marginTop: '1rem', height: '40px' }}
              >
                {formLoading ? 'Provisioning...' : 'Provision User'}
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
