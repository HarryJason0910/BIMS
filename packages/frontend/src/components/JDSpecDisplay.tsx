/**
 * JDSpecDisplay - Component for displaying JD specifications
 * 
 * Shows:
 * - Role
 * - Layer weights with visual bars
 * - Skills per layer with weights
 * - Dictionary version used
 * - Creation date
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 4.1-4.10
 */

import React, { useState } from 'react';
import { CanonicalJDSpec, TechLayer } from '../api/types';

interface JDSpecDisplayProps {
  jdSpec: CanonicalJDSpec;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TECH_LAYERS: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];

export const JDSpecDisplay: React.FC<JDSpecDisplayProps> = ({ jdSpec, onEdit, onDelete }) => {
  const [expandedLayer, setExpandedLayer] = useState<TechLayer | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleLayer = (layer: TechLayer) => {
    setExpandedLayer(expandedLayer === layer ? null : layer);
  };

  return (
    <div className="jd-spec-display">
      <div className="spec-header">
        <div>
          <h2>{jdSpec.role}</h2>
          <div className="spec-meta">
            <span>Dictionary Version: {jdSpec.dictionaryVersion}</span>
            <span>Created: {formatDate(jdSpec.createdAt)}</span>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="spec-actions">
            {onEdit && (
              <button onClick={onEdit} className="btn-edit">
                Edit
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="btn-delete">
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      <div className="layer-weights-section">
        <h3>Layer Weights</h3>
        <div className="layer-weights-list">
          {TECH_LAYERS.map(layer => {
            const weight = jdSpec.layerWeights[layer];
            const skillCount = jdSpec.skills[layer].length;
            
            return (
              <div key={layer} className="layer-weight-row">
                <div className="layer-info">
                  <span className="layer-name">{layer}</span>
                  <span className="layer-weight">{(weight * 100).toFixed(1)}%</span>
                  <span className="skill-count">({skillCount} skills)</span>
                </div>
                <div className="weight-bar-container">
                  <div 
                    className="weight-bar" 
                    style={{ width: `${weight * 100}%` }}
                  />
                </div>
                {skillCount > 0 && (
                  <button
                    onClick={() => toggleLayer(layer)}
                    className="btn-expand"
                  >
                    {expandedLayer === layer ? '▼' : '▶'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {expandedLayer && jdSpec.skills[expandedLayer].length > 0 && (
        <div className="skills-section">
          <h3>{expandedLayer} Skills</h3>
          <div className="skills-list">
            {jdSpec.skills[expandedLayer]
              .sort((a, b) => b.weight - a.weight)
              .map((skill, index) => (
                <div key={index} className="skill-row">
                  <span className="skill-name">{skill.skill}</span>
                  <div className="skill-weight-info">
                    <span className="skill-weight">{(skill.weight * 100).toFixed(1)}%</span>
                    <div className="skill-bar-container">
                      <div 
                        className="skill-bar" 
                        style={{ width: `${skill.weight * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <style>{`
        .jd-spec-display {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .spec-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #e9ecef;
        }

        .spec-header h2 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .spec-meta {
          display: flex;
          gap: 20px;
          color: #666;
          font-size: 14px;
        }

        .spec-actions {
          display: flex;
          gap: 10px;
        }

        .btn-edit, .btn-delete {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-edit {
          background: #007bff;
          color: white;
        }

        .btn-edit:hover {
          background: #0056b3;
        }

        .btn-delete {
          background: #dc3545;
          color: white;
        }

        .btn-delete:hover {
          background: #c82333;
        }

        .layer-weights-section {
          margin-bottom: 24px;
        }

        .layer-weights-section h3 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .layer-weights-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .layer-weight-row {
          display: grid;
          grid-template-columns: 200px 1fr auto;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .layer-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .layer-name {
          font-weight: 600;
          text-transform: capitalize;
          color: #333;
        }

        .layer-weight {
          font-family: monospace;
          color: #007bff;
          font-weight: 600;
        }

        .skill-count {
          color: #666;
          font-size: 13px;
        }

        .weight-bar-container {
          height: 24px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .weight-bar {
          height: 100%;
          background: linear-gradient(90deg, #007bff, #0056b3);
          transition: width 0.3s ease;
        }

        .btn-expand {
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          width: 32px;
          height: 32px;
          cursor: pointer;
          font-size: 12px;
        }

        .btn-expand:hover {
          background: #545b62;
        }

        .skills-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-top: 16px;
        }

        .skills-section h3 {
          margin: 0 0 16px 0;
          color: #333;
          text-transform: capitalize;
        }

        .skills-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skill-row {
          display: grid;
          grid-template-columns: 200px 1fr;
          align-items: center;
          gap: 16px;
          padding: 10px;
          background: white;
          border-radius: 4px;
        }

        .skill-name {
          font-weight: 500;
          color: #333;
        }

        .skill-weight-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .skill-weight {
          font-family: monospace;
          color: #28a745;
          font-weight: 600;
          min-width: 50px;
        }

        .skill-bar-container {
          flex: 1;
          height: 20px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .skill-bar {
          height: 100%;
          background: linear-gradient(90deg, #28a745, #1e7e34);
          transition: width 0.3s ease;
        }
      `}</style>
    </div>
  );
};
