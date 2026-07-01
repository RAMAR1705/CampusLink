import React, { useState, useEffect } from 'react';
import { Briefcase, User, Users, CheckCircle, AlertCircle, Plus, FileText, Download, Check, X, ShieldAlert } from 'lucide-react';

export default function CompanyPortal({ profile, user, token, onLogout, refreshProfile }) {
  const [activeTab, setActiveTab] = useState('drives');
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [message, setMessage] = useState('');
  const [errMessage, setErrMessage] = useState('');

  // Profile Edit fields
  const [companyName, setCompanyName] = useState(profile?.name || '');
  const [industry, setIndustry] = useState(profile?.industry || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [description, setDescription] = useState(profile?.description || '');

  // New Drive fields
  const [driveTitle, setDriveTitle] = useState('');
  const [driveRole, setDriveRole] = useState('');
  const [driveDesc, setDriveDesc] = useState('');
  const [drivePackage, setDrivePackage] = useState('');
  const [driveMinCgpa, setDriveMinCgpa] = useState('');
  const [driveMaxBacklogs, setDriveMaxBacklogs] = useState(0);
  const [driveDate, setDriveDate] = useState('');
  const [allowedBranches, setAllowedBranches] = useState({
    CSE: true,
    ECE: true,
    EEE: false,
    ME: false,
    CE: false
  });

  // Action fields
  const [feedbackText, setFeedbackText] = useState({});

  const fetchDrives = async () => {
    try {
      const res = await fetch('/api/company/drives', {
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

  useEffect(() => {
    fetchDrives();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrMessage('');
    try {
      const res = await fetch('/api/company/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: companyName, industry, website, description })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Profile details updated successfully');
        refreshProfile();
      } else {
        setErrMessage(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setErrMessage('Connection error');
    }
  };

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrMessage('');

    const branches = Object.keys(allowedBranches).filter(b => allowedBranches[b]);

    try {
      const res = await fetch('/api/company/drives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: driveTitle,
          role_title: driveRole,
          job_description: driveDesc,
          package_lpa: parseFloat(drivePackage),
          min_cgpa: parseFloat(driveMinCgpa),
          max_backlogs: parseInt(driveMaxBacklogs),
          allowed_branches: branches,
          drive_date: driveDate
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Job Placement drive created successfully!');
        setDriveTitle('');
        setDriveRole('');
        setDriveDesc('');
        setDrivePackage('');
        setDriveMinCgpa('');
        setDriveMaxBacklogs(0);
        setDriveDate('');
        fetchDrives();
        setActiveTab('drives');
      } else {
        setErrMessage(data.message || 'Failed to create drive');
      }
    } catch (err) {
      setErrMessage('Connection error');
    }
  };

  const handleViewApplicants = async (drive) => {
    setSelectedDrive(drive);
    setApplicants([]);
    setActiveTab('applicants');
    try {
      const res = await fetch(`/api/company/drives/${drive.id}/applicants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplicants(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    setMessage('');
    setErrMessage('');
    const feedback = feedbackText[appId] || '';
    try {
      const res = await fetch(`/api/company/applications/${appId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, feedback })
      });
      if (res.ok) {
        setMessage(`Candidate status updated to: ${newStatus.toUpperCase()}`);
        if (selectedDrive) {
          handleViewApplicants(selectedDrive);
        }
      } else {
        const data = await res.json();
        setErrMessage(data.message || 'Failed to update candidate status');
      }
    } catch (err) {
      setErrMessage('Connection error');
    }
  };

  const toggleBranch = (br) => {
    setAllowedBranches(prev => ({
      ...prev,
      [br]: !prev[br]
    }));
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="logo-container">
            <Briefcase size={28} color="#8b5cf6" />
            <span className="logo-text">CampusLink</span>
          </div>
          <nav className="nav-links">
            <button 
              className={`nav-item ${activeTab === 'drives' || activeTab === 'applicants' ? 'active' : ''}`}
              onClick={() => setActiveTab('drives')}
            >
              <Users size={18} />
              Drives & Applicants
            </button>
            <button 
              className={`nav-item ${activeTab === 'create-drive' ? 'active' : ''}`}
              onClick={() => setActiveTab('create-drive')}
              disabled={!profile?.is_approved}
            >
              <Plus size={18} />
              Post Job Drive
            </button>
            <button 
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} />
              Company Details
            </button>
          </nav>
        </div>
        <button className="nav-item" style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }} onClick={onLogout}>
          <LogOutBtnIcon size={18} />
          Logout
        </button>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        <header className="top-header">
          <div>
            <h1 className="welcome-title">{profile?.name || user.email}</h1>
            <div style={{ marginTop: '4px' }}>
              {profile?.is_approved ? (
                <span className="badge badge-success">Approved Recruiter</span>
              ) : (
                <span className="badge badge-warning">Pending Approval</span>
              )}
            </div>
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

        {!profile?.is_approved && activeTab === 'create-drive' && (
          <div className="glass-card animated-entry d-flex align-center gap-10" style={{ borderLeft: '4px solid var(--color-warning)', padding: '24px' }}>
            <ShieldAlert size={28} color="var(--color-warning)" />
            <div>
              <h3>Account Not Verified</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Your company account must be approved by the system placement officer before you can publish placement drives.</p>
            </div>
          </div>
        )}

        {/* Drives Tab */}
        {activeTab === 'drives' && (
          <div className="animated-entry">
            <h2 style={{ marginBottom: '24px' }}>Active Job Recruitment Drives</h2>
            <div className="grid-2">
              {drives.map(drive => (
                <div key={drive.id} className="glass-card d-flex flex-column justify-between" style={{ minHeight: '260px' }}>
                  <div>
                    <div className="d-flex justify-between align-center" style={{ marginBottom: '12px' }}>
                      <span className="badge badge-info">{drive.role_title}</span>
                      <span className="badge badge-success">{drive.package_lpa} LPA</span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{drive.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                      {drive.job_description}
                    </p>
                  </div>
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      <div>Min CGPA: <strong>{drive.min_cgpa}</strong></div>
                      <div>Drive Date: <strong>{new Date(drive.drive_date).toLocaleDateString()}</strong></div>
                    </div>
                    <button className="btn btn-primary w-100" onClick={() => handleViewApplicants(drive)}>
                      Manage Applications
                    </button>
                  </div>
                </div>
              ))}
              {drives.length === 0 && (
                <div className="glass-card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px' }}>
                  <Briefcase size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                  <p>You haven't posted any drives yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Drive Tab */}
        {activeTab === 'create-drive' && profile?.is_approved && (
          <div className="glass-card animated-entry" style={{ maxWidth: '700px' }}>
            <h2 style={{ marginBottom: '20px' }}>Post Job Recruitment Drive</h2>
            <form onSubmit={handleCreateDrive}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Job Drive Title</label>
                  <input type="text" className="form-control" placeholder="e.g., Google Summer Internship 2026" value={driveTitle} onChange={e => setDriveTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Role / Designation</label>
                  <input type="text" className="form-control" placeholder="e.g., Software Engineering Intern" value={driveRole} onChange={e => setDriveRole(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Job Description</label>
                <textarea className="form-control" rows="3" placeholder="Specify job description, technologies, and team details..." value={driveDesc} onChange={e => setDriveDesc(e.target.value)} required />
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Salary Package (LPA)</label>
                  <input type="number" step="0.1" className="form-control" placeholder="e.g., 12.5" value={drivePackage} onChange={e => setDrivePackage(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum CGPA</label>
                  <input type="number" step="0.1" className="form-control" placeholder="e.g., 7.5" value={driveMinCgpa} onChange={e => setDriveMinCgpa(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Active Backlogs</label>
                  <input type="number" className="form-control" value={driveMaxBacklogs} onChange={e => setDriveMaxBacklogs(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Drive Date</label>
                <input type="date" className="form-control" value={driveDate} onChange={e => setDriveDate(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Eligible Branches</label>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {Object.keys(allowedBranches).map(br => (
                    <label key={br} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={allowedBranches[br]} onChange={() => toggleBranch(br)} style={{ transform: 'scale(1.2)' }} />
                      <span>{br}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100">Publish Recruitment Drive</button>
            </form>
          </div>
        )}

        {/* Applicants Tab */}
        {activeTab === 'applicants' && selectedDrive && (
          <div className="animated-entry">
            <div className="d-flex justify-between align-center" style={{ marginBottom: '24px' }}>
              <div>
                <button className="btn btn-secondary" style={{ marginBottom: '12px' }} onClick={() => setActiveTab('drives')}>&larr; Back to Drives</button>
                <h2>Applicants for: {selectedDrive.title}</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Role: {selectedDrive.role_title} | Package: {selectedDrive.package_lpa} LPA</p>
              </div>
            </div>

            <div className="glass-card table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Candidate</th>
                    <th>Branch</th>
                    <th>CGPA</th>
                    <th>Backlogs</th>
                    <th>Resume</th>
                    <th>Application Status</th>
                    <th>Recruiter Feedback / Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map(app => (
                    <tr key={app.application_id}>
                      <td><strong>{app.roll_number}</strong></td>
                      <td>{app.student_name}</td>
                      <td><span className="badge badge-info">{app.branch}</span></td>
                      <td>{app.cgpa}</td>
                      <td>{app.backlogs}</td>
                      <td>
                        {app.resume_url ? (
                          <a href={app.resume_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            <Download size={14} /> Resume
                          </a>
                        ) : (
                          <span style={{ color: 'var(--color-danger)' }}>Missing</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${
                          app.status === 'selected' ? 'success' :
                          app.status === 'shortlisted' ? 'warning' :
                          app.status === 'rejected' ? 'danger' : 'info'
                        }`}>{app.status}</span>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-10">
                          <input 
                            type="text" 
                            className="form-control" 
                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            placeholder="Add feedback comment..." 
                            value={feedbackText[app.application_id] || app.feedback || ''}
                            onChange={e => {
                              const txt = e.target.value;
                              setFeedbackText(prev => ({ ...prev, [app.application_id]: txt }));
                            }}
                          />
                          <div className="d-flex gap-10">
                            {app.status === 'applied' && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--color-warning)' }} 
                                onClick={() => handleStatusUpdate(app.application_id, 'shortlisted')}
                              >
                                <Check size={14} color="var(--color-warning)" /> Shortlist
                              </button>
                            )}
                            {app.status !== 'selected' && app.status !== 'rejected' && (
                              <>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--color-success)' }} 
                                  onClick={() => handleStatusUpdate(app.application_id, 'selected')}
                                >
                                  <Check size={14} color="var(--color-success)" /> Select
                                </button>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--color-danger)' }} 
                                  onClick={() => handleStatusUpdate(app.application_id, 'rejected')}
                                >
                                  <X size={14} color="var(--color-danger)" /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {applicants.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No candidates have applied to this drive yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="glass-card animated-entry" style={{ maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '20px' }}>Company Information</h2>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Company Legal Name</label>
                <input type="text" className="form-control" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Industry Sector</label>
                  <input type="text" className="form-control" placeholder="e.g., Software, Fintech" value={industry} onChange={e => setIndustry(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Corporate Website</label>
                  <input type="url" className="form-control" placeholder="https://example.com" value={website} onChange={e => setWebsite(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Corporate Description</label>
                <textarea className="form-control" rows="4" placeholder="Brief details about company focus, values..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary w-100">Save Company Info</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

function LogOutBtnIcon({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  );
}
