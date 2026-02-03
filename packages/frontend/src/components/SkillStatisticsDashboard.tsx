/**
 * SkillStatisticsDashboard - Dashboard for skill usage statistics
 * 
 * Features:
 * - Display most common skills
 * - Show skill trends over time
 * - Filter by date range and category
 * - Show variation usage
 * - Sort by frequency or name
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 11.1-11.6
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { SkillStatistics, TechLayer } from '../api/types';

const TECH_LAYERS: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];

export const SkillStatisticsDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<SkillStatistics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<TechLayer | 'all'>('all');
  const [sortBy, setSortBy] = useState<'frequency' | 'name'>('frequency');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Detail view
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, [selectedCategory, sortBy, sortOrder, dateFrom, dateTo]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        sortBy,
        sortOrder
      };
      
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      if (dateFrom) {
        params.dateFrom = dateFrom;
      }
      
      if (dateTo) {
        params.dateTo = dateTo;
      }
      
      const response = await apiClient.getSkillStatistics(params);
      setStatistics(response.statistics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
      setStatistics([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (skillName: string) => {
    setExpandedSkill(expandedSkill === skillName ? null : skillName);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTopSkills = (count: number = 10) => {
    return statistics.slice(0, count);
  };

  const getTotalUsage = () => {
    return statistics.reduce((sum, stat) => sum + stat.totalUsage, 0);
  };

  return (
    <div className="skill-statistics-dashboard">
      <div className="header">
        <div>
          <h2>Skill Usage Statistics</h2>
          <p className="subtitle">Analyze skill usage across JD specifications and resumes</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <label>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TechLayer | 'all')}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {TECH_LAYERS.map(layer => (
              <option key={layer} value={layer}>
                {layer}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'frequency' | 'name')}
            className="filter-select"
          >
            <option value="frequency">Frequency</option>
            <option value="name">Name</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Order:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="filter-select"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Date To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="filter-input"
          />
        </div>

        <button onClick={loadStatistics} className="btn-refresh" disabled={loading}>
          Refresh
        </button>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading statistics...</p>
        </div>
      )}

      {!loading && statistics.length > 0 && (
        <>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-value">{statistics.length}</div>
              <div className="card-label">Total Skills</div>
            </div>
            <div className="summary-card">
              <div className="card-value">{getTotalUsage()}</div>
              <div className="card-label">Total Usage</div>
            </div>
            <div className="summary-card">
              <div className="card-value">
                {statistics.reduce((sum, stat) => sum + stat.jdCount, 0)}
              </div>
              <div className="card-label">JD Mentions</div>
            </div>
            <div className="summary-card">
              <div className="card-value">
                {statistics.reduce((sum, stat) => sum + stat.resumeCount, 0)}
              </div>
              <div className="card-label">Resume Mentions</div>
            </div>
          </div>

          <div className="top-skills-section">
            <h3>Top 10 Skills</h3>
            <div className="top-skills-chart">
              {getTopSkills(10).map((stat, index) => (
                <div key={stat.skillName} className="skill-bar-item">
                  <div className="skill-rank">#{index + 1}</div>
                  <div className="skill-info">
                    <div className="skill-name-row">
                      <span className="skill-name">{stat.skillName}</span>
                      <span className="skill-category">{stat.category}</span>
                    </div>
                    <div className="usage-bar-container">
                      <div 
                        className="usage-bar" 
                        style={{ 
                          width: `${(stat.totalUsage / getTotalUsage()) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className="skill-count">{stat.totalUsage}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="all-skills-section">
            <h3>All Skills ({statistics.length})</h3>
            <div className="skills-table">
              <div className="table-header">
                <div className="col-skill">Skill</div>
                <div className="col-category">Category</div>
                <div className="col-count">JDs</div>
                <div className="col-count">Resumes</div>
                <div className="col-count">Total</div>
                <div className="col-dates">First / Last Seen</div>
                <div className="col-action"></div>
              </div>
              {statistics.map((stat) => (
                <div key={stat.skillName} className="table-row">
                  <div className="col-skill">{stat.skillName}</div>
                  <div className="col-category">
                    <span className="category-badge">{stat.category}</span>
                  </div>
                  <div className="col-count">{stat.jdCount}</div>
                  <div className="col-count">{stat.resumeCount}</div>
                  <div className="col-count">
                    <strong>{stat.totalUsage}</strong>
                  </div>
                  <div className="col-dates">
                    <div className="date-info">
                      {formatDate(stat.firstSeen)}
                    </div>
                    <div className="date-info">
                      {formatDate(stat.lastSeen)}
                    </div>
                  </div>
                  <div className="col-action">
                    {stat.variations.length > 0 && (
                      <button
                        onClick={() => toggleExpand(stat.skillName)}
                        className="btn-expand-small"
                      >
                        {expandedSkill === stat.skillName ? '▼' : '▶'}
                      </button>
                    )}
                  </div>
                  {expandedSkill === stat.skillName && (
                    <div className="variations-row">
                      <strong>Variations ({stat.variations.length}):</strong>
                      <div className="variation-tags">
                        {stat.variations.map((variation, idx) => (
                          <span key={idx} className="variation-tag">
                            {variation}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && statistics.length === 0 && (
        <div className="empty-state">
          <p>No skill statistics available</p>
          <p className="empty-subtitle">Create JD specifications to start tracking skill usage</p>
        </div>
      )}

      <style>{`
        .skill-statistics-dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
        }

        .header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e9ecef;
        }

        .header h2 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .subtitle {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .alert {
          padding: 16px;
          border-radius: 4px;
          margin-bottom: 24px;
        }

        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .filters-section {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: flex-end;
          margin-bottom: 32px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-group label {
          font-weight: 500;
          color: #555;
          font-size: 13px;
        }

        .filter-select, .filter-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          text-transform: capitalize;
        }

        .btn-refresh {
          padding: 8px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          align-self: flex-end;
        }

        .btn-refresh:hover {
          background: #0056b3;
        }

        .btn-refresh:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #666;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .summary-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
        }

        .card-value {
          font-size: 36px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 8px;
        }

        .card-label {
          color: #666;
          font-size: 14px;
        }

        .top-skills-section {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .top-skills-section h3 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .top-skills-chart {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skill-bar-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .skill-rank {
          font-weight: bold;
          color: #666;
          min-width: 40px;
        }

        .skill-info {
          flex: 1;
        }

        .skill-name-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .skill-name {
          font-weight: 600;
          color: #333;
        }

        .skill-category {
          font-size: 12px;
          padding: 2px 8px;
          background: #e9ecef;
          border-radius: 4px;
          text-transform: capitalize;
        }

        .usage-bar-container {
          height: 24px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .usage-bar {
          height: 100%;
          background: linear-gradient(90deg, #007bff, #0056b3);
          transition: width 0.3s ease;
        }

        .skill-count {
          font-weight: bold;
          color: #007bff;
          min-width: 60px;
          text-align: right;
        }

        .all-skills-section {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 24px;
        }

        .all-skills-section h3 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .skills-table {
          display: flex;
          flex-direction: column;
        }

        .table-header, .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 80px 80px 80px 180px 50px;
          gap: 12px;
          padding: 12px;
          align-items: center;
        }

        .table-header {
          background: #f8f9fa;
          font-weight: 600;
          color: #555;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .table-row {
          border-bottom: 1px solid #e9ecef;
          position: relative;
        }

        .table-row:hover {
          background: #f8f9fa;
        }

        .col-skill {
          font-weight: 500;
        }

        .category-badge {
          padding: 4px 10px;
          background: #e9ecef;
          border-radius: 4px;
          font-size: 12px;
          text-transform: capitalize;
        }

        .col-count {
          text-align: center;
        }

        .col-dates {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .date-info {
          font-size: 12px;
          color: #666;
        }

        .col-action {
          text-align: center;
        }

        .btn-expand-small {
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          width: 28px;
          height: 28px;
          cursor: pointer;
          font-size: 12px;
        }

        .btn-expand-small:hover {
          background: #545b62;
        }

        .variations-row {
          grid-column: 1 / -1;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 4px;
          margin-top: 8px;
        }

        .variations-row strong {
          display: block;
          margin-bottom: 8px;
          color: #555;
          font-size: 13px;
        }

        .variation-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .variation-tag {
          padding: 4px 10px;
          background: #e9ecef;
          border-radius: 4px;
          font-size: 12px;
          color: #495057;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #666;
        }

        .empty-state p {
          font-size: 20px;
          margin: 0 0 8px 0;
        }

        .empty-subtitle {
          font-size: 16px !important;
          color: #999 !important;
        }
      `}</style>
    </div>
  );
};
