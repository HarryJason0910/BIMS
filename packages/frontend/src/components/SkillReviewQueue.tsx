/**
 * SkillReviewQueue - Component for reviewing unknown skills
 * 
 * Features:
 * - Display unknown skills with frequency and sources
 * - Approve as canonical skill (with category selection)
 * - Approve as variation (with canonical skill selection)
 * - Reject skills with reason
 * - Sort by frequency or name
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 5.3-5.6, 9.12, 9.13
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { UnknownSkillItem, TechLayer } from '../api/types';

const TECH_LAYERS: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];

export const SkillReviewQueue: React.FC = () => {
  const [queueItems, setQueueItems] = useState<UnknownSkillItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'frequency' | 'name'>('frequency');
  
  // Approval form state
  const [approvingSkill, setApprovingSkill] = useState<string | null>(null);
  const [approvalType, setApprovalType] = useState<'canonical' | 'variation'>('canonical');
  const [selectedCategory, setSelectedCategory] = useState<TechLayer>('frontend');
  const [canonicalName, setCanonicalName] = useState('');
  
  // Rejection form state
  const [rejectingSkill, setRejectingSkill] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getReviewQueue();
      setQueueItems(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review queue');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (skillName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (approvalType === 'canonical') {
        await apiClient.approveSkill(skillName, 'canonical', selectedCategory);
      } else {
        if (!canonicalName.trim()) {
          alert('Please enter the canonical skill name');
          setLoading(false);
          return;
        }
        await apiClient.approveSkill(skillName, 'variation', undefined, canonicalName.trim());
      }
      
      await loadQueue();
      setApprovingSkill(null);
      setCanonicalName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve skill');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (skillName: string) => {
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiClient.rejectSkill(skillName, rejectionReason.trim());
      await loadQueue();
      setRejectingSkill(null);
      setRejectionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject skill');
    } finally {
      setLoading(false);
    }
  };

  const sortedItems = [...queueItems].sort((a, b) => {
    if (sortBy === 'frequency') {
      return b.frequency - a.frequency;
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="skill-review-queue">
      <div className="header">
        <div>
          <h2>Skill Review Queue</h2>
          <p className="subtitle">Review and approve unknown skills detected in JD specifications</p>
        </div>
        <div className="header-actions">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'frequency' | 'name')}
            className="sort-select"
          >
            <option value="frequency">Frequency</option>
            <option value="name">Name</option>
          </select>
          <button onClick={loadQueue} className="btn-refresh" disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading && queueItems.length === 0 && (
        <div className="loading">Loading review queue...</div>
      )}

      {queueItems.length === 0 && !loading && (
        <div className="empty-state">
          <p>No skills pending review!</p>
          <p className="empty-subtitle">All detected skills have been reviewed.</p>
        </div>
      )}

      <div className="queue-list">
        {sortedItems.map((item) => (
          <div key={item.name} className="queue-item">
            <div className="item-header">
              <div className="skill-info">
                <h3>{item.name}</h3>
                <div className="skill-meta">
                  <span className="frequency-badge">
                    Used {item.frequency} time{item.frequency !== 1 ? 's' : ''}
                  </span>
                  <span className="date-info">
                    First seen: {formatDate(item.firstSeen)}
                  </span>
                  <span className="date-info">
                    Last seen: {formatDate(item.lastSeen)}
                  </span>
                </div>
              </div>
              <div className="item-actions">
                <button
                  onClick={() => setApprovingSkill(approvingSkill === item.name ? null : item.name)}
                  className="btn-approve"
                  disabled={loading}
                >
                  {approvingSkill === item.name ? 'Cancel' : 'Approve'}
                </button>
                <button
                  onClick={() => setRejectingSkill(rejectingSkill === item.name ? null : item.name)}
                  className="btn-reject"
                  disabled={loading}
                >
                  {rejectingSkill === item.name ? 'Cancel' : 'Reject'}
                </button>
              </div>
            </div>

            {item.sources.length > 0 && (
              <div className="sources">
                <strong>Sources:</strong>
                <div className="source-tags">
                  {item.sources.map((source, index) => (
                    <span key={index} className="source-tag">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {approvingSkill === item.name && (
              <div className="approval-form">
                <h4>Approve "{item.name}"</h4>
                <div className="form-group">
                  <label>Approval Type:</label>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        value="canonical"
                        checked={approvalType === 'canonical'}
                        onChange={(e) => setApprovalType(e.target.value as 'canonical' | 'variation')}
                      />
                      As Canonical Skill
                    </label>
                    <label>
                      <input
                        type="radio"
                        value="variation"
                        checked={approvalType === 'variation'}
                        onChange={(e) => setApprovalType(e.target.value as 'canonical' | 'variation')}
                      />
                      As Variation
                    </label>
                  </div>
                </div>

                {approvalType === 'canonical' && (
                  <div className="form-group">
                    <label>Category:</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as TechLayer)}
                      className="form-select"
                    >
                      {TECH_LAYERS.map(layer => (
                        <option key={layer} value={layer}>
                          {layer}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {approvalType === 'variation' && (
                  <div className="form-group">
                    <label>Canonical Skill Name:</label>
                    <input
                      type="text"
                      value={canonicalName}
                      onChange={(e) => setCanonicalName(e.target.value)}
                      placeholder="e.g., React"
                      className="form-input"
                    />
                  </div>
                )}

                <button
                  onClick={() => handleApprove(item.name)}
                  className="btn-submit"
                  disabled={loading}
                >
                  Approve
                </button>
              </div>
            )}

            {rejectingSkill === item.name && (
              <div className="rejection-form">
                <h4>Reject "{item.name}"</h4>
                <div className="form-group">
                  <label>Reason:</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Why is this skill being rejected?"
                    className="form-textarea"
                    rows={3}
                  />
                </div>
                <button
                  onClick={() => handleReject(item.name)}
                  className="btn-submit-reject"
                  disabled={loading}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .skill-review-queue {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
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

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-actions label {
          font-weight: 500;
          color: #555;
        }

        .sort-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .btn-refresh {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-refresh:hover {
          background: #0056b3;
        }

        .btn-refresh:disabled {
          background: #6c757d;
          cursor: not-allowed;
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

        .loading {
          text-align: center;
          padding: 60px 20px;
          color: #666;
          font-size: 18px;
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

        .queue-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .queue-item {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          transition: box-shadow 0.2s;
        }

        .queue-item:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .skill-info h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 20px;
        }

        .skill-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .frequency-badge {
          padding: 4px 12px;
          background: #007bff;
          color: white;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
        }

        .date-info {
          color: #666;
          font-size: 13px;
        }

        .item-actions {
          display: flex;
          gap: 10px;
        }

        .btn-approve, .btn-reject {
          padding: 8px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-approve {
          background: #28a745;
          color: white;
        }

        .btn-approve:hover {
          background: #218838;
        }

        .btn-approve:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .btn-reject {
          background: #dc3545;
          color: white;
        }

        .btn-reject:hover {
          background: #c82333;
        }

        .btn-reject:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .sources {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e9ecef;
        }

        .sources strong {
          display: block;
          margin-bottom: 8px;
          color: #666;
          font-size: 13px;
        }

        .source-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .source-tag {
          padding: 4px 10px;
          background: #e9ecef;
          border-radius: 4px;
          font-size: 12px;
          color: #495057;
        }

        .approval-form, .rejection-form {
          margin-top: 16px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .approval-form h4, .rejection-form h4 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #555;
        }

        .radio-group {
          display: flex;
          gap: 20px;
        }

        .radio-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: normal;
        }

        .form-select, .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          text-transform: capitalize;
        }

        .form-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
        }

        .btn-submit, .btn-submit-reject {
          padding: 10px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-submit {
          background: #28a745;
          color: white;
        }

        .btn-submit:hover {
          background: #218838;
        }

        .btn-submit:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .btn-submit-reject {
          background: #dc3545;
          color: white;
        }

        .btn-submit-reject:hover {
          background: #c82333;
        }

        .btn-submit-reject:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
