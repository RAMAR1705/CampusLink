import React, { useState, useEffect } from 'react';
import StudentPortal from './components/StudentPortal.jsx';
import CompanyPortal from './components/CompanyPortal.jsx';
import AdminPortal from './components/AdminPortal.jsx';
import { ShieldCheck, User, Building2, Lock, Mail, GraduationCap } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth UI state
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  
  // Student extra signup fields
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [cgpa, setCgpa] = useState('');
  const [backlogs, setBacklogs] = useState(0);
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear() + 1);

  // Company extra signup fields
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  const [message, setMessage] = useState('');
  const [errMessage, setErrMessage] = useState('');

  const fetchCurrentUser = async (authToken) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
      } else {
        // Token expired or invalid
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to authenticate:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrMessage('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setProfile(data.profile);
        setEmail('');
        setPassword('');
      } else {
        setErrMessage(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setErrMessage('Failed to connect to server');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrMessage('');

    const extraData = role === 'student' 
      ? { rollNumber, branch, cgpa: parseFloat(cgpa) || 0, backlogs: parseInt(backlogs) || 0, graduationYear: parseInt(graduationYear) }
      : { industry, website, description };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, name, extraData })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Registration successful! Please login.');
        setIsLogin(true);
        // Clear registration inputs
        setName('');
        setRollNumber('');
        setCgpa('');
        setBacklogs(0);
        setIndustry('');
        setWebsite('');
        setDescription('');
      } else {
        setErrMessage(data.message || 'Registration failed');
      }
    } catch (err) {
      setErrMessage('Failed to connect to server');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = () => {
    if (token) {
      fetchCurrentUser(token);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-primary)' }}>
        <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p>Authenticating session...</p>
        </div>
      </div>
    );
  }

  // Authenticated Role Redirects
  if (user) {
    if (user.role === 'student') {
      return (
        <StudentPortal 
          profile={profile} 
          user={user} 
          token={token} 
          onLogout={handleLogout} 
          refreshProfile={refreshProfile} 
        />
      );
    }
    if (user.role === 'company') {
      return (
        <CompanyPortal 
          profile={profile} 
          user={user} 
          token={token} 
          onLogout={handleLogout} 
          refreshProfile={refreshProfile} 
        />
      );
    }
    if (user.role === 'admin') {
      return (
        <AdminPortal 
          user={user} 
          token={token} 
          onLogout={handleLogout} 
        />
      );
    }
  }

  // Not Logged In: Show Authentication forms
  return (
    <div className="auth-wrapper">
      <div className="glass-card auth-card animated-entry">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <GraduationCap size={42} color="var(--color-primary)" />
          <h1 style={{ fontSize: '1.75rem', background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CampusLink</h1>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: '24px' }}>
          <button 
            className={`btn`} 
            style={{ flex: 1, background: 'none', borderBottom: isLogin ? '2px solid var(--color-primary)' : 'none', color: isLogin ? '#fff' : 'var(--text-secondary)', borderRadius: 0 }}
            onClick={() => { setIsLogin(true); setMessage(''); setErrMessage(''); }}
          >
            Login
          </button>
          <button 
            className={`btn`} 
            style={{ flex: 1, background: 'none', borderBottom: !isLogin ? '2px solid var(--color-primary)' : 'none', color: !isLogin ? '#fff' : 'var(--text-secondary)', borderRadius: 0 }}
            onClick={() => { setIsLogin(false); setMessage(''); setErrMessage(''); }}
          >
            Register
          </button>
        </div>

        {message && (
          <div style={{ color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '16px', fontSize: '0.85rem' }}>
            {message}
          </div>
        )}
        {errMessage && (
          <div style={{ color: 'var(--color-danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '16px', fontSize: '0.85rem' }}>
            {errMessage}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input type="email" className="form-control" style={{ paddingLeft: '44px' }} placeholder="you@college.edu" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input type="password" className="form-control" style={{ paddingLeft: '44px' }} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100" style={{ marginTop: '12px' }}>Sign In</button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Account Role Type</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, padding: '12px', background: role === 'student' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)', border: `1px solid ${role === 'student' ? 'var(--color-primary)' : 'var(--glass-border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <input type="radio" name="role" value="student" checked={role === 'student'} onChange={() => setRole('student')} />
                  <User size={16} /> Student
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, padding: '12px', background: role === 'company' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)', border: `1px solid ${role === 'company' ? 'var(--color-primary)' : 'var(--glass-border)'}`, borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <input type="radio" name="role" value="company" checked={role === 'company'} onChange={() => setRole('company')} />
                  <Building2 size={16} /> Recruiter
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{role === 'student' ? 'Full Name' : 'Company Name'}</label>
              <input type="text" className="form-control" placeholder={role === 'student' ? 'e.g., Jane Doe' : 'e.g., Stripe Inc.'} value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" placeholder={role === 'student' ? 'student@college.edu' : 'hiring@company.com'} value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" placeholder="•••••••• (Min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>

            {/* Role specific inputs */}
            {role === 'student' ? (
              <div className="animated-entry">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Roll Number</label>
                    <input type="text" className="form-control" placeholder="e.g., 22CSE045" value={rollNumber} onChange={e => setRollNumber(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <select className="form-control" value={branch} onChange={e => setBranch(e.target.value)}>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="ME">Mechanical</option>
                      <option value="CE">Civil</option>
                    </select>
                  </div>
                </div>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">CGPA</label>
                    <input type="number" step="0.01" className="form-control" placeholder="e.g., 8.75" value={cgpa} onChange={e => setCgpa(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Backlogs</label>
                    <input type="number" className="form-control" value={backlogs} onChange={e => setBacklogs(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Grad Year</label>
                    <input type="number" className="form-control" value={graduationYear} onChange={e => setGraduationYear(e.target.value)} required />
                  </div>
                </div>
              </div>
            ) : (
              <div className="animated-entry">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Industry</label>
                    <input type="text" className="form-control" placeholder="e.g., Software, Fintech" value={industry} onChange={e => setIndustry(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input type="url" className="form-control" placeholder="https://company.com" value={website} onChange={e => setWebsite(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Company Description</label>
                  <textarea className="form-control" rows="2" placeholder="Tell us about the company..." value={description} onChange={e => setDescription(e.target.value)} required />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary w-100" style={{ marginTop: '12px' }}>Sign Up</button>
          </form>
        )}
        
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
          Secure Session | Role-Based Access Control
        </div>
      </div>
    </div>
  );
}
