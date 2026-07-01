import React, { useState, useEffect } from 'react';
import { Shield, Users, Briefcase, FileText, CheckCircle2, TrendingUp, BarChart2, Check, X, Download } from 'lucide-react';

export default function AdminPortal({ user, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('analytics');
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [drives, setDrives] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [message, setMessage] = useState('');
  const [errMessage, setErrMessage] = useState('');

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/admin/companies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDrives = async () => {
    try {
      const res = await fetch('/api/admin/drives', {
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
    fetchAnalytics();
    fetchCompanies();
    fetchStudents();
    fetchDrives();
  }, [activeTab]);

  const handleCompanyApprove = async (companyId, approve) => {
    setMessage('');
    setErrMessage('');
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approve })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        fetchCompanies();
      } else {
        setErrMessage(data.message || 'Failed to update company status');
      }
    } catch (err) {
      setErrMessage('Connection error');
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="logo-container">
            <Shield size={28} color="#d946ef" />
            <span className="logo-text">CampusLink Admin</span>
          </div>
          <nav className="nav-links">
            <button 
              className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart2 size={18} />
              Analytics Dashboard
            </button>
            <button 
              className={`nav-item ${activeTab === 'companies' ? 'active' : ''}`}
              onClick={() => setActiveTab('companies')}
            >
              <Briefcase size={18} />
              Verify Companies
            </button>
            <button 
              className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <Users size={18} />
              Student Profiles
            </button>
            <button 
              className={`nav-item ${activeTab === 'drives' ? 'active' : ''}`}
              onClick={() => setActiveTab('drives')}
            >
              <FileText size={18} />
              All Job Drives
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
            <h1 className="welcome-title">Administrative Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Welcome back, Placement Officer | Role: Super Admin</p>
          </div>
        </header>

        {/* Global Feedback Banner */}
        {message && (
          <div className="glass-card animated-entry d-flex align-center gap-10" style={{ borderLeft: '4px solid var(--color-success)', marginBottom: '24px', padding: '16px' }}>
            <CheckCircle2 color="var(--color-success)" />
            <span>{message}</span>
          </div>
        )}
        {errMessage && (
          <div className="glass-card animated-entry d-flex align-center gap-10" style={{ borderLeft: '4px solid var(--color-danger)', marginBottom: '24px', padding: '16px' }}>
            <X size={20} color="var(--color-danger)" />
            <span>{errMessage}</span>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="animated-entry">
            {/* Stat Cards */}
            <div className="grid-4" style={{ marginBottom: '32px' }}>
              <div className="glass-card">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Placed Students</div>
                <div className="stat-val">{analytics.summary.placedStudents} / {analytics.summary.totalStudents}</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '4px', fontWeight: 600 }}>
                  <TrendingUp size={12} style={{ marginRight: '2px', display: 'inline' }} />
                  {analytics.summary.placementRate}% Placement Rate
                </p>
              </div>

              <div className="glass-card">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Companies</div>
                <div className="stat-val">{analytics.summary.totalCompanies}</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Registered recruiters</p>
              </div>

              <div className="glass-card">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Drives</div>
                <div className="stat-val">{analytics.summary.totalDrives}</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Currently open drives</p>
              </div>

              <div className="glass-card">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Job Applications</div>
                <div className="stat-val">{analytics.summary.totalApplications}</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Total student applications</p>
              </div>
            </div>

            {/* Placement Breakdown by Branch */}
            <div className="grid-2" style={{ marginBottom: '32px' }}>
              <div className="glass-card">
                <h3 style={{ marginBottom: '20px' }}>Academic Branch Performance</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Branch</th>
                        <th>Total Students</th>
                        <th>Placed Students</th>
                        <th>Placement Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.branchStats.totals.map(t => {
                        const placements = analytics.branchStats.placements.find(p => p.branch === t.branch);
                        const placedCount = placements ? placements.placed_count : 0;
                        const rate = t.total_count > 0 ? ((placedCount / t.total_count) * 100).toFixed(1) : 0;
                        return (
                          <tr key={t.branch}>
                            <td><strong>{t.branch}</strong></td>
                            <td>{t.total_count}</td>
                            <td>{placedCount}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', width: '60px', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ background: 'var(--grad-primary)', width: `${rate}%`, height: '100%' }}></div>
                                </div>
                                <span>{rate}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hires by Company */}
              <div className="glass-card">
                <h3 style={{ marginBottom: '20px' }}>Recruiter Hiring Leaderboard</h3>
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Total Offers Accepted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.companyHires.map(ch => (
                        <tr key={ch.company_name}>
                          <td><strong>{ch.company_name}</strong></td>
                          <td>
                            <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>{ch.hires_count} Candidates Selected</span>
                          </td>
                        </tr>
                      ))}
                      {analytics.companyHires.length === 0 && (
                        <tr>
                          <td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                            No hires recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verify Companies Tab */}
        {activeTab === 'companies' && (
          <div className="animated-entry">
            <h2 style={{ marginBottom: '20px' }}>Verify & Manage Recruiter Accounts</h2>
            <div className="glass-card table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Email</th>
                    <th>Industry</th>
                    <th>Website</th>
                    <th>Approval Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(comp => (
                    <tr key={comp.id}>
                      <td><strong>{comp.name}</strong></td>
                      <td>{comp.email}</td>
                      <td>{comp.industry || 'N/A'}</td>
                      <td>
                        {comp.website ? (
                          <a href={comp.website} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
                            {comp.website}
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td>
                        {comp.is_approved ? (
                          <span className="badge badge-success">Approved</span>
                        ) : (
                          <span className="badge badge-warning">Pending Review</span>
                        )}
                      </td>
                      <td>
                        {comp.is_approved ? (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--color-danger)' }}
                            onClick={() => handleCompanyApprove(comp.id, false)}
                          >
                            Revoke Approval
                          </button>
                        ) : (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            onClick={() => handleCompanyApprove(comp.id, true)}
                          >
                            <Check size={14} /> Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No company registrations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Student Profiles Tab */}
        {activeTab === 'students' && (
          <div className="animated-entry">
            <h2 style={{ marginBottom: '20px' }}>Registered Student Profiles</h2>
            <div className="glass-card table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Branch</th>
                    <th>CGPA</th>
                    <th>Backlogs</th>
                    <th>Grad Year</th>
                    <th>Resume Document</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td><strong>{student.roll_number}</strong></td>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td><span className="badge badge-info">{student.branch}</span></td>
                      <td>{student.cgpa}</td>
                      <td>{student.backlogs}</td>
                      <td>{student.graduation_year}</td>
                      <td>
                        {student.resume_url ? (
                          <a href={student.resume_url} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            <Download size={14} /> View Resume
                          </a>
                        ) : (
                          <span style={{ color: 'var(--color-danger)' }}>Not Uploaded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No students registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Drives Tab */}
        {activeTab === 'drives' && (
          <div className="animated-entry">
            <h2 style={{ marginBottom: '20px' }}>All Recruitment Placement Drives</h2>
            <div className="glass-card table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Drive Title</th>
                    <th>Role</th>
                    <th>Package (LPA)</th>
                    <th>Min CGPA</th>
                    <th>Drive Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {drives.map(drive => (
                    <tr key={drive.id}>
                      <td><strong>{drive.company_name}</strong></td>
                      <td>{drive.title}</td>
                      <td>{drive.role_title}</td>
                      <td>{drive.package_lpa} LPA</td>
                      <td>{drive.min_cgpa}</td>
                      <td>{new Date(drive.drive_date).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${drive.status === 'active' ? 'success' : 'danger'}`}>
                          {drive.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {drives.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No drives posted.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
