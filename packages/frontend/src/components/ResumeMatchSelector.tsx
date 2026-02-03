/**
 * ResumeMatchSelector - Enhanced resume selector with match rates
 * 
 * Features:
 * - Display match rate percentage for each resume
 * - Show layer breakdown on hover/expand
 * - Show matching and missing skills per layer
 * - Sort resumes by match rate
 * - Visual indicators for match quality
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 7.4, 7.5, 7.6, 7.7
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { ResumeMatchRate, TechLayer } from '../api/types';

interface ResumeMatchSelectorProps {
  currentJDId: string;
  onResumeSelected: (resumeId: string) => void;
  disabled?: boolean;
}

const TECH_LAYERS: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];

export const ResumeMatchSelector: React.FC<ResumeMatchSelectorProps> = ({
  currentJDId,
  onResumeSelected,
  disabled = false
}) => {
  const [matchRates, setMatchRates] = useState<ResumeMatchRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    if (!currentJDId || disabled) {
      setMatchRates([]);
      return;
    }

    loadMatchRates();
  }, [currentJDId, disabled]);

  const loadMatchRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.calculateResumeMatchRates(currentJDId);
      setMatchRates(response.matchRates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load match rates');
      setMatchRates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (resumeId: string) => {
    setSelectedId(resumeId);
    onResumeSelected(resumeId);
  };

  const toggleExpand = (resumeId: string) => {
    setExpandedId(expandedId === resumeId ? null : resumeId);
  };

  const getMatchQualityClass = (matchRate: number): string => {
    if (matchRate >= 80) return 'excellent';
    if (matchRate >= 60) return 'good';
    if (matchRate >= 40) return 'fair';
    return 'poor';
  };

  const sortedMatchRates = [...matchRates].sort((a, b) => {
    return sortOrder === 'desc' 
      ? b.matchRate - a.matchRate 
      : a.matchRate - b.matchRate;
  });

  if (disabled || !currentJDId) {
    return (
      <div className="resume-match-selector disabled">
        <p>Select a JD specification to see matching resumes</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="resume-match-selector loading">
        <div className="spinner"></div>
        <p>Calculating match rates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resume-match-selector error">
        <p className="error-message">{error}</p>
        <button onClick={loadMatchRates} className="btn-retry">
          Retry
        </button>
      </div>
    );
  }

  if (matchRates.length === 0) {
    return (
      <div className="resume-match-selector empty">
        <p>No resumes found for this JD specification</p>
      </div>
    );
  }

  return (
    <div className="resume-match-selector">
      <div className="header">
        <h3>Matching Resumes ({matchRates.length})</h3>
        <div className="sort-controls">
          <label>Sort:</label>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="btn-sort"
          >
            Match Rate {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      <div className="resumes-list">
        {sortedMatchRates.map((match) => (
          <div
            key={match.resumeId}
            className={`resume-item ${selectedId === match.resumeId ? 'selected' : ''} ${getMatchQualityClass(match.matchRate)}`}
          >
            <div className="resume-header" onClick={() => handleSelect(match.resumeId)}>
              <div className="resume-info">
                <h4>Resume {match.resumeId.substring(0, 8)}...</h4>
                <div className="match-rate-display">
                  <div className="match-percentage">
                    {match.matchRate.toFixed(1)}%
                  </div>
                  <div className="match-bar-container">
                    <div 
                      className="match-bar" 
                      style={{ width: `${match.matchRate}%` }}
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(match.resumeId);
                }}
                className="btn-expand"
              >
                {expandedId === match.resumeId ? '▼' : '▶'}
              </button>
            </div>

            {expandedId === match.resumeId && (
              <div className="layer-breakdown">
                <h5>Layer Breakdown</h5>
                {match.correlation.layerBreakdown.map((layer) => (
                  <div key={layer.layer} className="layer-detail">
                    <div className="layer-header">
                      <span className="layer-name">{layer.layer}</span>
                      <span className="layer-score">
                        {(layer.score * 100).toFixed(1)}%
                      </span>
                      <span className="layer-weight">
                        (weight: {(layer.weight * 100).toFixed(0)}%)
                      </span>
                    </div>
                    
                    <div className="layer-bar-container">
                      <div 
                        className="layer-bar" 
                        style={{ width: `${layer.score * 100}%` }}
                      />
                    </div>

                    {layer.matchingSkills.length > 0 && (
                      <div className="skills-section">
                        <strong>Matching Skills:</strong>
                        <div className="skill-tags">
                          {layer.matchingSkills.map((skill, idx) => (
                            <span key={idx} className="skill-tag matching">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {layer.missingSkills.length > 0 && (
                      <div className="skills-section">
                        <strong>Missing Skills:</strong>
                        <div className="skill-tags">
                          {layer.missingSkills.map((skill, idx) => (
                            <span key={idx} className="skill-tag missing">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div className="dictionary-version">
                  Dictionary Version: {match.correlation.dictionaryVersion}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .resume-match-selector {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          min-height: 300px;
        }

        .resume-match-selector.disabled,
        .resume-match-selector.loading,
        .resume-match-selector.error,
        .resume-match-selector.empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #666;
          text-align: center;
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

        .error-message {
          color: #dc3545;
          margin-bottom: 16px;
        }

        .btn-retry {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-retry:hover {
          background: #0056b3;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e9ecef;
        }

        .header h3 {
          margin: 0;
          color: #333;
        }

        .sort-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sort-controls label {
          font-weight: 500;
          color: #555;
        }

        .btn-sort {
          padding: 8px 16px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-sort:hover {
          background: #545b62;
        }

        .resumes-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 600px;
          overflow-y: auto;
        }

        .resume-item {
          border: 2px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .resume-item:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .resume-item.selected {
          border-color: #007bff;
          background: #f0f8ff;
        }

        .resume-item.excellent {
          border-left: 4px solid #28a745;
        }

        .resume-item.good {
          border-left: 4px solid #17a2b8;
        }

        .resume-item.fair {
          border-left: 4px solid #ffc107;
        }

        .resume-item.poor {
          border-left: 4px solid #dc3545;
        }

        .resume-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .resume-info {
          flex: 1;
        }

        .resume-info h4 {
          margin: 0 0 12px 0;
          color: #333;
        }

        .match-rate-display {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .match-percentage {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          min-width: 80px;
        }

        .match-bar-container {
          flex: 1;
          height: 24px;
          background: #e9ecef;
          border-radius: 12px;
          overflow: hidden;
        }

        .match-bar {
          height: 100%;
          background: linear-gradient(90deg, #28a745, #17a2b8);
          transition: width 0.3s ease;
        }

        .btn-expand {
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          width: 36px;
          height: 36px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-expand:hover {
          background: #545b62;
        }

        .layer-breakdown {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }

        .layer-breakdown h5 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .layer-detail {
          margin-bottom: 20px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .layer-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .layer-name {
          font-weight: 600;
          text-transform: capitalize;
          color: #333;
        }

        .layer-score {
          font-family: monospace;
          color: #007bff;
          font-weight: 600;
        }

        .layer-weight {
          color: #666;
          font-size: 13px;
        }

        .layer-bar-container {
          height: 16px;
          background: #e9ecef;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .layer-bar {
          height: 100%;
          background: linear-gradient(90deg, #007bff, #0056b3);
          transition: width 0.3s ease;
        }

        .skills-section {
          margin-top: 12px;
        }

        .skills-section strong {
          display: block;
          margin-bottom: 8px;
          color: #555;
          font-size: 13px;
        }

        .skill-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .skill-tag {
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
        }

        .skill-tag.matching {
          background: #d4edda;
          color: #155724;
        }

        .skill-tag.missing {
          background: #f8d7da;
          color: #721c24;
        }

        .dictionary-version {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #dee2e6;
          color: #666;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
};
