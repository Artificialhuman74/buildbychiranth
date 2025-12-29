import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/MyReports.css';

interface Report {
  id: number;
  title: string;
  type: string;
  date: string;
  status: string;
  anonymous: boolean;
}

const MyReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/my-reports?filter=${filter}`);
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      fetchReports();
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  return (
    <div className="my-reports-container">
      <div className="reports-header">
        <div>
          <h1>📝 My Reports</h1>
          <p>View and manage your incident reports</p>
        </div>
        <Link to="/report" className="btn btn-primary">
          ➕ New Report
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Reports
        </button>
        <button
          className={`tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`tab ${filter === 'resolved' ? 'active' : ''}`}
          onClick={() => setFilter('resolved')}
        >
          Resolved
        </button>
      </div>

      {/* Reports List */}
      <div className="reports-content">
        {loading ? (
          <div className="loading-state">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No reports yet</h3>
            <p>Your incident reports will appear here</p>
            <Link to="/report" className="btn btn-primary">
              Create First Report
            </Link>
          </div>
        ) : (
          <div className="reports-grid">
            {reports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-header">
                  <div>
                    <h4>{report.title || 'Incident Report'}</h4>
                    <span className={`status-badge status-${report.status}`}>
                      {report.status}
                    </span>
                  </div>
                  {report.anonymous && <span className="anonymous-badge">🔒 Anonymous</span>}
                </div>

                <div className="report-body">
                  <div className="report-meta">
                    <span>📅 {report.date}</span>
                    <span>🏷️ {report.type}</span>
                  </div>
                </div>

                <div className="report-footer">
                  <Link to={`/reports/${report.id}`} className="btn btn-sm btn-outline">
                    View Details
                  </Link>
                  <button
                    onClick={() => deleteReport(report.id)}
                    className="btn btn-sm btn-outline-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReports;
