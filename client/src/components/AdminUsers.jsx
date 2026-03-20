import { useState, useEffect } from 'react';
import axios from 'axios';

const ROLE_COLORS = { admin: '#ef4444', teacher: '#f59e0b', student: '#22c55e' };
const ROLE_ICONS  = { admin: '🛡️', teacher: '👨‍🏫', student: '🎓' };

export default function AdminUsers({ onClose }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/auth/users');
      setUsers(res.data.users);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (user) => {
    try {
      const res = await axios.patch(`/api/auth/users/${user._id}`, { isActive: !user.isActive });
      setUsers(prev => prev.map(u => u._id === user._id ? res.data.user : u));
    } catch {}
  };

  const deleteUser = async (user) => {
    if (!confirm(`Delete user "${user.name}"?`)) return;
    try {
      await axios.delete(`/api/auth/users/${user._id}`);
      setUsers(prev => prev.filter(u => u._id !== user._id));
    } catch {}
  };

  const changeRole = async (user, role) => {
    try {
      const res = await axios.patch(`/api/auth/users/${user._id}`, { role });
      setUsers(prev => prev.map(u => u._id === user._id ? res.data.user : u));
    } catch {}
  };

  const filtered = users.filter(u => {
    const matchRole = filter === 'all' || u.role === filter;
    const matchSearch = !search.trim() ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const counts = { all: users.length, admin: 0, teacher: 0, student: 0 };
  users.forEach(u => { if (counts[u.role] !== undefined) counts[u.role]++; });

  return (
    <div className="manage-overlay" onClick={onClose}>
      <div className="manage-panel" onClick={e => e.stopPropagation()}>
        <div className="manage-hdr">
          <div>
            <div className="manage-title">🛡️ User Management</div>
            <div className="manage-sub">{users.length} registered users</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="manage-cancel-btn" onClick={load}>🔄 Refresh</button>
            <button className="manage-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="admin-filter-bar">
          {['all', 'admin', 'teacher', 'student'].map(f => (
            <button key={f} className={`admin-filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? '👥' : ROLE_ICONS[f]} {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="admin-filter-count">{counts[f]}</span>
            </button>
          ))}
          <input
            className="manage-input"
            placeholder="🔍 Search name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginLeft: 'auto', maxWidth: '220px' }}
          />
        </div>

        <div className="admin-user-list">
          {loading && <div className="manage-empty">Loading users...</div>}
          {error && <div className="manage-empty" style={{ color: 'var(--danger)' }}>{error}</div>}
          {!loading && filtered.length === 0 && <div className="manage-empty">No users found</div>}
          {filtered.map(u => (
            <div key={u._id} className={`admin-user-row${!u.isActive ? ' inactive' : ''}`}>
              <div className="admin-user-avatar" style={{ background: ROLE_COLORS[u.role] + '22', border: `1px solid ${ROLE_COLORS[u.role]}44` }}>
                {ROLE_ICONS[u.role]}
              </div>
              <div className="admin-user-info">
                <div className="admin-user-name">{u.name} {!u.isActive && <span className="admin-badge-disabled">Disabled</span>}</div>
                <div className="admin-user-email">{u.email}</div>
                <div className="admin-user-meta">
                  {u.role === 'student' && u.classNum && <span>Class {u.classNum}</span>}
                  {u.role === 'teacher' && u.subject && <span>{u.subject}</span>}
                  <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                  <span>{u.watchedIds?.length || 0} watched</span>
                </div>
              </div>
              <div className="admin-user-actions">
                <select
                  className="admin-role-select"
                  value={u.role}
                  onChange={e => changeRole(u, e.target.value)}
                  style={{ borderColor: ROLE_COLORS[u.role] + '88' }}
                >
                  <option value="student">🎓 Student</option>
                  <option value="teacher">👨‍🏫 Teacher</option>
                  <option value="admin">🛡️ Admin</option>
                </select>
                <button
                  className={`admin-toggle-btn${u.isActive ? '' : ' disabled'}`}
                  onClick={() => toggleActive(u)}
                  title={u.isActive ? 'Disable account' : 'Enable account'}
                >
                  {u.isActive ? '🔒' : '🔓'}
                </button>
                <button className="manage-del-btn" onClick={() => deleteUser(u)} title="Delete user">🗑</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
