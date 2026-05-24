const API_BASE_URL = 'http://localhost:8080/api';

export const auth = {
  async login(usernameOrEmail, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password }),
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Authentication failed');
    }
    
    const data = await res.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem('ticket_jwt', data.token);
      localStorage.setItem('ticket_user', JSON.stringify({
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role
      }));
    }
    return data;
  },

  async register(username, email, password, role = 'USER') {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Registration failed');
    }
    return await res.json();
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ticket_jwt');
      localStorage.removeItem('ticket_user');
      window.location.href = '/login';
    }
  },

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ticket_jwt');
    }
    return null;
  },

  getUser() {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('ticket_user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  getHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  },

  getApiUrl(path) {
    return `${API_BASE_URL}${path}`;
  }
};
