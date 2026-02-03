/**
 * JDSpecForm - Form component for creating/editing JD specifications
 * 
 * Allows users to input:
 * - Role
 * - Layer weights (must sum to 1.0)
 * - Skills per layer with weights (must sum to 1.0 per layer)
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 4.1-4.10
 */

import React, { useState } from 'react';
import { TechLayer, LayerWeights, LayerSkills, SkillWeight } from '../api/types';

interface JDSpecFormProps {
  onSubmit: (data: { role: string; layerWeights: LayerWeights; skills: LayerSkills }) => void;
  onCancel?: () => void;
  initialData?: {
    role: string;
    layerWeights: LayerWeights;
    skills: LayerSkills;
  };
}

const TECH_LAYERS: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];

export const JDSpecForm: React.FC<JDSpecFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [role, setRole] = useState(initialData?.role || '');
  const [layerWeights, setLayerWeights] = useState<LayerWeights>(
    initialData?.layerWeights || {
      frontend: 0.2,
      backend: 0.2,
      database: 0.2,
      cloud: 0.2,
      devops: 0.1,
      others: 0.1
    }
  );
  const [skills, setSkills] = useState<LayerSkills>(
    initialData?.skills || {
      frontend: [],
      backend: [],
      database: [],
      cloud: [],
      devops: [],
      others: []
    }
  );

  // Track which layer is being edited
  const [activeLayer, setActiveLayer] = useState<TechLayer | null>(null);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillWeight, setNewSkillWeight] = useState('');

  const calculateLayerWeightSum = (): number => {
    return Object.values(layerWeights).reduce((sum, weight) => sum + weight, 0);
  };

  const calculateSkillWeightSum = (layer: TechLayer): number => {
    return skills[layer].reduce((sum, skill) => sum + skill.weight, 0);
  };

  const handleLayerWeightChange = (layer: TechLayer, value: string) => {
    const numValue = parseFloat(value) || 0;
    setLayerWeights(prev => ({ ...prev, [layer]: numValue }));
  };

  const handleAddSkill = (layer: TechLayer) => {
    if (!newSkillName.trim() || !newSkillWeight) return;

    const weight = parseFloat(newSkillWeight);
    if (isNaN(weight) || weight <= 0 || weight > 1) {
      alert('Skill weight must be between 0 and 1');
      return;
    }

    const newSkill: SkillWeight = {
      skill: newSkillName.trim(),
      weight
    };

    setSkills(prev => ({
      ...prev,
      [layer]: [...prev[layer], newSkill]
    }));

    setNewSkillName('');
    setNewSkillWeight('');
  };

  const handleRemoveSkill = (layer: TechLayer, index: number) => {
    setSkills(prev => ({
      ...prev,
      [layer]: prev[layer].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!role.trim()) {
      alert('Please enter a role');
      return;
    }

    const layerWeightSum = calculateLayerWeightSum();
    if (Math.abs(layerWeightSum - 1.0) > 0.001) {
      alert(`Layer weights must sum to 1.0 (current sum: ${layerWeightSum.toFixed(3)})`);
      return;
    }

    // Check that each layer with non-zero weight has skills
    for (const layer of TECH_LAYERS) {
      if (layerWeights[layer] > 0 && skills[layer].length === 0) {
        alert(`Layer "${layer}" has weight ${layerWeights[layer]} but no skills defined`);
        return;
      }

      if (skills[layer].length > 0) {
        const skillWeightSum = calculateSkillWeightSum(layer);
        if (Math.abs(skillWeightSum - 1.0) > 0.001) {
          alert(`Skills in layer "${layer}" must sum to 1.0 (current sum: ${skillWeightSum.toFixed(3)})`);
          return;
        }
      }
    }

    onSubmit({ role, layerWeights, skills });
  };

  return (
    <form onSubmit={handleSubmit} className="jd-spec-form">
      <div className="form-section">
        <h3>Role</h3>
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g., Full Stack Engineer"
          className="form-input"
          required
        />
      </div>

      <div className="form-section">
        <h3>Layer Weights (must sum to 1.0)</h3>
        <div className="layer-weights-grid">
          {TECH_LAYERS.map(layer => (
            <div key={layer} className="layer-weight-item">
              <label>{layer}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={layerWeights[layer]}
                onChange={(e) => handleLayerWeightChange(layer, e.target.value)}
                className="form-input-small"
              />
            </div>
          ))}
        </div>
        <div className={`weight-sum ${Math.abs(calculateLayerWeightSum() - 1.0) < 0.001 ? 'valid' : 'invalid'}`}>
          Sum: {calculateLayerWeightSum().toFixed(3)}
        </div>
      </div>

      <div className="form-section">
        <h3>Skills by Layer</h3>
        <div className="layers-tabs">
          {TECH_LAYERS.map(layer => (
            <button
              key={layer}
              type="button"
              className={`layer-tab ${activeLayer === layer ? 'active' : ''}`}
              onClick={() => setActiveLayer(layer)}
            >
              {layer} ({skills[layer].length})
            </button>
          ))}
        </div>

        {activeLayer && (
          <div className="layer-skills-editor">
            <h4>{activeLayer} Skills</h4>
            
            <div className="skills-list">
              {skills[activeLayer].map((skill, index) => (
                <div key={index} className="skill-item">
                  <span className="skill-name">{skill.skill}</span>
                  <span className="skill-weight">{skill.weight.toFixed(3)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(activeLayer, index)}
                    className="btn-remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {skills[activeLayer].length > 0 && (
              <div className={`weight-sum ${Math.abs(calculateSkillWeightSum(activeLayer) - 1.0) < 0.001 ? 'valid' : 'invalid'}`}>
                Sum: {calculateSkillWeightSum(activeLayer).toFixed(3)}
              </div>
            )}

            <div className="add-skill-form">
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Skill name (e.g., React)"
                className="form-input"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={newSkillWeight}
                onChange={(e) => setNewSkillWeight(e.target.value)}
                placeholder="Weight (0-1)"
                className="form-input-small"
              />
              <button
                type="button"
                onClick={() => handleAddSkill(activeLayer)}
                className="btn-add"
              >
                Add Skill
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="form-actions">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary">
          Create JD Specification
        </button>
      </div>

      <style>{`
        .jd-spec-form {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }

        .form-section {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .form-section h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #333;
        }

        .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-input-small {
          width: 80px;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .layer-weights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 10px;
        }

        .layer-weight-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .layer-weight-item label {
          font-weight: 500;
          text-transform: capitalize;
          color: #555;
        }

        .weight-sum {
          text-align: right;
          font-weight: bold;
          padding: 10px;
          border-radius: 4px;
          margin-top: 10px;
        }

        .weight-sum.valid {
          background: #d4edda;
          color: #155724;
        }

        .weight-sum.invalid {
          background: #f8d7da;
          color: #721c24;
        }

        .layers-tabs {
          display: flex;
          gap: 5px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .layer-tab {
          padding: 10px 15px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          text-transform: capitalize;
          transition: all 0.2s;
        }

        .layer-tab:hover {
          background: #e9ecef;
        }

        .layer-tab.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .layer-skills-editor {
          background: white;
          padding: 20px;
          border-radius: 4px;
        }

        .layer-skills-editor h4 {
          margin-top: 0;
          margin-bottom: 15px;
          text-transform: capitalize;
        }

        .skills-list {
          margin-bottom: 15px;
        }

        .skill-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .skill-name {
          flex: 1;
          font-weight: 500;
        }

        .skill-weight {
          color: #666;
          font-family: monospace;
        }

        .btn-remove {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          padding: 0;
        }

        .btn-remove:hover {
          background: #c82333;
        }

        .add-skill-form {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .add-skill-form .form-input {
          flex: 1;
        }

        .btn-add {
          padding: 10px 20px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
        }

        .btn-add:hover {
          background: #218838;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 30px;
        }

        .btn-primary, .btn-secondary {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }
      `}</style>
    </form>
  );
};
