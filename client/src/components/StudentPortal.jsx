import React, { useState, useEffect } from 'react';
import { User, FileText, Briefcase, GraduationCap, CheckCircle, AlertCircle, Clock, Bell, LogOut, Check } from 'lucide-react';

export default function StudentPortal({ profile, user, token, onLogout, refreshProfile }) {
  const [activeTab, setActiveTab] = useState('drives');
  const [drives, setDrives] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [file, setFile] = useState(null);
  
  // Profile edit fields
  const [name, setName] = useState(profile?.name || '');
  const [branch, setBranch] = useState(profile?.branch || 'CSE');
  const [rollNumber, setRollNumber] = useState(profile?.roll_number || '');
  const [cgpa, setCgpa] = useState(profile?.cgpa || 0);
  const [backlogs, setBacklogs] = useState(profile?.backlogs || 0);
  const [skills, setSkills] = useState(profile?.skills || '');
  const [graduationYear, setGraduationYear] = useState(profile?.graduation_year || 2027);

  const [message, setMessage] = useState('');
  const [errMessage, setErrMessage] = useState('');

  const fetchDrives = async () => {
    try {
      const res = await fetch('/api/student/drives', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDrives(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/student/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDrives();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrMessage('');
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          branch,
          rollNumber,
          cgpa: parseFloat(cgpa),
          backlogs: parseInt(backlogs),
          skills,
          graduationYear: parseInt(graduationYear)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Profile updated successfully!');
        refreshProfile();
      } else {
        setErrMessage(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setErrMessage('Connection error');
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setMessage('');
    setErrMessage('');
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/student/upload-resume', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Resume uploaded successfully!');
        refreshProfile();
      } else {
        setErrMessage(data.message || 'Resume upload failed');
      }
    } catch (err) {
      setErrMessage('Upload failed');
    }
  };

  const handleApply = async (driveId) => {
    setMessage('');
    setErrMessage('');
    try {
      const res = await fetch('/api/student/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ driveId })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Applied successfully!');
        fetchDrives();
        fetchNotifications();
      } else {
        setErrMessage(data.message || 'Application failed');
      }
    } catch (err) {
      setErrMessage('Connection error');
    }
  };

  const markNotificationsRead = async () => {
    try {
      await fetch('/api/student/notifications/read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="logo-container">
            <GraduationCap size={28} color="#8b5cf6" />
            <span className="logo-text">CampusLink</span>
          </div>
          <nav className="nav-links">
            <button 
              className={`nav-item ${activeTab === 'drives' ? 'active' : ''}`}
              onClick={() => setActiveTab('drives')}
            >
              <Briefcase size={18} />
              Job Drives
            </button>
            <button 
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} />
              My Profile
            </button>
            <button 
              className={`nav-item ${activeTab === 'applied' ? 'active' : ''}`}
              onClick={() => setActiveTab('applied')}
            >
              <FileText size={18} />
              Applications
            </button>
          </nav>
        </div>
        <button className="nav-item" style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }} onClick={onLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        <header className="top-header">
          <div>
            <h1 className="welcome-title">Welcome, {profile?.name || user.email}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Branch: {profile?.branch} | CGPA: {profile?.cgpa}</p>
          </div>
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-secondary" 
              style={{ position: 'relative', padding: '10px' }}
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && unreadCount > 0) markNotificationsRead();
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  background: 'var(--color-danger)', borderRadius: '50%',
                  width: '18px', height: '18px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '10px'
                }}>{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="glass-card notifications-dropdown">
                <h4 style={{ marginBottom: '12px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Notifications</h4>
                {notifications.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`}>
                      <p>{n.message}</p>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </header>

        {/* Global Feedback Banner */}
        {message && (
          <div className="glass-card animated-entry d-flex align-center gap-10" style={{ borderLeft: '4px solid var(--color-success)', marginBottom: '24px', padding: '16px' }}>
            <CheckCircle color="var(--color-success)" />
            <span>{message}</span>
          </div>
        )}
        {errMessage && (
          <div className="glass-card animated-entry d-flex align-center gap-10" style={{ borderLeft: '4px solid var(--color-danger)', marginBottom: '24px', padding: '16px' }}>
            <AlertCircle color="var(--color-danger)" />
            <span>{errMessage}</span>
          </div>
        )}

        {/* Drives Tab */}
        {activeTab === 'drives' && (
          <div className="animated-entry">
            <h2 style={{ marginBottom: '24px' }}>Eligible Recruitment Drives</h2>
            <div className="grid-2">
              {drives.map(drive => {
                const isApplied = !!drive.application_status;
                return (
                  <div key={drive.id} className="glass-card d-flex flex-column justify-between" style={{ minHeight: '280px' }}>
                    <div>
                      <div className="d-flex justify-between align-center" style={{ marginBottom: '12px' }}>
                        <span className="badge badge-info">{drive.company_name}</span>
                        {isApplied ? (
                          <span className={`badge badge-${
                            drive.application_status === 'selected' ? 'success' :
                            drive.application_status === 'shortlisted' ? 'warning' :
                            drive.application_status === 'rejected' ? 'danger' : 'info'
                          }`}>{drive.application_status}</span>
                        ) : (
                          <span className={`badge ${drive.isEligible ? 'badge-success' : 'badge-danger'}`}>
                            {drive.isEligible ? 'Eligible' : 'Ineligible'}
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{drive.title}</h3>
                      <p style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '12px' }}>Role: {drive.role_title} | Package: {drive.package_lpa} LPA</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.4' }}>
                        {drive.job_description}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: 'auto' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        <div>Min CGPA: <strong>{drive.min_cgpa}</strong></div>
                        <div>Max Backlogs: <strong>{drive.max_backlogs}</strong></div>
                        <div style={{ gridColumn: 'span 2' }}>Branches: <strong>{JSON.parse(drive.allowed_branches).join(', ') || 'All'}</strong></div>
                      </div>

                      {isApplied ? (
                        <button className="btn btn-secondary w-100" disabled>Applied on {new Date(drive.applied_at).toLocaleDateString()}</button>
                      ) : (
                        <button 
                          className="btn btn-primary w-100" 
                          disabled={!drive.isEligible}
                          onClick={() => handleApply(drive.id)}
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {drives.length === 0 && (
                <div className="glass-card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px' }}>
                  <Briefcase size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                  <p>No active placement drives found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="animated-entry grid-2">
            {/* Edit details */}
            <div className="glass-card">
              <h3 style={{ marginBottom: '20px' }}>Academic & Personal Details</h3>
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Roll Number</label>
                    <input type="text" className="form-control" value={rollNumber} onChange={e => setRollNumber(e.target.value)} required />
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
                    <input type="number" step="0.01" className="form-control" value={cgpa} onChange={e => setCgpa(e.target.value)} required />
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
                <div className="form-group">
                  <label className="form-label">Skills (Comma separated)</label>
                  <input type="text" className="form-control" placeholder="React, Node.js, SQLite" value={skills} onChange={e => setSkills(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary w-100">Save Profile</button>
              </form>
            </div>

            {/* Document upload & Resume Verification card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="glass-card">
                <h3 style={{ marginBottom: '20px' }}>Upload Resume</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Please upload your updated resume in PDF format. This resume will be forwarded directly to companies when you apply for drives.
                </p>
                <form onSubmit={handleResumeUpload}>
                  <div className="form-group">
                    <input type="file" accept=".pdf" className="form-control" onChange={e => setFile(e.target.files[0])} required />
                  </div>
                  <button type="submit" className="btn btn-accent w-100" disabled={!file}>Upload File</button>
                </form>
              </div>

              <div className="glass-card">
                <h3 style={{ marginBottom: '16px' }}>Resume Status</h3>
                {profile?.resume_url ? (
                  <div className="d-flex align-center gap-10">
                    <Check color="var(--color-success)" />
                    <div>
                      <a href={profile.resume_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
                        View Uploaded Resume.pdf
                      </a>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Upload new resume to replace it.</p>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex align-center gap-10">
                    <AlertCircle color="var(--color-danger)" />
                    <p style={{ color: 'var(--color-danger)', fontWeight: 600 }}>No resume uploaded. You cannot apply to drives yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Applied Drives Tab */}
        {activeTab === 'applied' && (
          <div className="animated-entry">
            <h2 style={{ marginBottom: '24px' }}>My Applications & Progress</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {drives.filter(d => !!d.application_status).map(drive => (
                <div key={drive.id} className="glass-card grid-2">
                  <div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{drive.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>{drive.company_name} | Role: {drive.role_title}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Applied on: {new Date(drive.applied_at).toLocaleString()}</p>
                    
                    {drive.feedback && (
                      <div className="glass-card" style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderLeft: '3px solid var(--color-accent)' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent)' }}>Feedback from recruiter:</span>
                        <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>"{drive.feedback}"</p>
                      </div>
                    )}
                  </div>

                  {/* Status Timeline */}
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase' }}>Visual Tracking Status</h4>
                    <ul className="timeline">
                      <li className="timeline-item">
                        <div className="timeline-dot success"></div>
                        <div className="timeline-title">Applied Successfully</div>
                        <div className="timeline-desc">Resume submitted to company databases.</div>
                      </li>
                      <li className="timeline-item">
                        <div className={`timeline-dot ${
                          drive.application_status === 'shortlisted' || drive.application_status === 'selected' ? 'success' : 
                          drive.application_status === 'rejected' ? 'danger' : ''
                        }`}></div>
                        <div className="timeline-title">Recruiter Review & Shortlist</div>
                        <div className="timeline-desc">Profile evaluated against job criteria.</div>
                      </li>
                      <li className="timeline-item">
                        <div className={`timeline-dot ${drive.application_status === 'selected' ? 'success' : drive.application_status === 'rejected' ? 'danger' : ''}`}></div>
                        <div className="timeline-title">Final Interview Result</div>
                        <div className="timeline-desc">
                          {drive.application_status === 'selected' ? 'Offer Extended!' : drive.application_status === 'rejected' ? 'Application Closed' : 'Evaluation Pending.'}
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              ))}

              {drives.filter(d => !!d.application_status).length === 0 && (
                <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
                  <FileText size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                  <p>You haven't applied to any job drives yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
