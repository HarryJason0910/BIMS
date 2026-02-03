/**
 * SkillDictionaryManager - Component for managing the skill dictionary
 * 
 * Features:
 * - Display canonical skills by category
 * - Add/edit/delete canonical skills
 * - Manage skill variations
 * - Export/import dictionary
 * - View dictionary version
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 2.4, 9.8-9.11, 10.1-10.6
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { TechLayer, LayerSkills } from '../api/types';

const TECH_LAYERS: TechLayer[] = ['frontend', 'backend', 'database', 'cloud', 'devops', 'others'];

export const SkillDictionaryManager: React.FC = () => {
  const [skills, setSkills] = useState<LayerSkills | null>(null);
  const [version, setVersion] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<TechLayer>('frontend');
  
  // Add skill form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<TechLayer>('frontend');
  
  // Add variation form state
  const [showVariationForm, setShowVariationForm] = useState<string | null>(null);
  const [newVariation, setNewVariation] = useState('');
  
  // Export/Import state
  const [showImportForm, setShowImportForm] = useState(false);
  const [importData, setImportData] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getAllSkills();
      setSkills(response.skills);
      setVersion(response.version);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) {
      alert('Please enter a skill name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiClient.addCanonicalSkill(newSkillName.trim(), newSkillCategory);
      await loadSkills();
      setNewSkillName('');
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSkill = async (skillName: string) => {
    if (!confirm(`Are you sure you want to remove "${skillName}" and all its variations?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiClient.removeCanonicalSkill(skillName);
      await loadSkills();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove skill');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariation = async (canonicalName: string) => {
    if (!newVariation.trim()) {
      alert('Please enter a variation');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiClient.addSkillVariation(newVariation.trim(), canonicalName);
      await loadSkills();
      setNewVariation('');
      setShowVariationForm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add variation');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.exportDictionary();
      const dataStr = JSON.stringify(response.dictionary, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `skill-dictionary-${version}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export dictionary');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      alert('Please paste dictionary JSON data');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const dictionaryData = JSON.parse(importData);
      await apiClient.importDictionary(dictionaryData, importMode, false);
      await loadSkills();
      setImportData('');
      setShowImportForm(false);
      alert('Dictionary imported successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import dictionary');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !skills) {
    return <div className="loading">Loading skill dictionary...</div>;
  }

  if (!skills) {
    return <div className="error">Failed to load skill dictionary</div>;
  }

  const getSkillsForLayer = (layer: TechLayer): Array<{ name: string; variations: string[] }> => {
    return skills[layer].map(sw => ({
      name: sw.skill,
      variations: [] // We'll need to fetch variations separately if needed
    }));
  };

  return (
    <div className="skill-dictionary-manager">
      <div className="header">
        <div>
          <h2>Skill Dictionary</h2>
          <div className="version-info">Version: {version}</div>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary">
            {showAddForm ? 'Cancel' : 'Add Skill'}
          </button>
          <button onClick={handleExport} className="btn-secondary">
            Export
          </button>
          <button onClick={() => setShowImportForm(!showImportForm)} className="btn-secondary">
            {showImportForm ? 'Cancel Import' : 'Import'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="add-skill-form">
          <h3>Add New Canonical Skill</h3>
          <div className="form-row">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Skill name (e.g., React)"
              className="form-input"
            />
            <select
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value as TechLayer)}
              className="form-select"
            >
              {TECH_LAYERS.map(layer => (
                <option key={layer} value={layer}>
                  {layer}
                </option>
              ))}
            </select>
            <button onClick={handleAddSkill} className="btn-add" disabled={loading}>
              Add
            </button>
          </div>
        </div>
      )}

      {showImportForm && (
        <div className="import-form">
          <h3>Import Dictionary</h3>
          <div className="form-group">
            <label>Import Mode:</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={(e) => setImportMode(e.target.value as 'replace' | 'merge')}
                />
                Replace (overwrite existing)
              </label>
              <label>
                <input
                  type="radio"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={(e) => setImportMode(e.target.value as 'replace' | 'merge')}
                />
                Merge (combine with existing)
              </label>
            </div>
          </div>
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste dictionary JSON here..."
            className="import-textarea"
            rows={10}
          />
          <button onClick={handleImport} className="btn-primary" disabled={loading}>
            Import
          </button>
        </div>
      )}

      <div className="layers-tabs">
        {TECH_LAYERS.map(layer => (
          <button
            key={layer}
            className={`layer-tab ${activeLayer === layer ? 'active' : ''}`}
            onClick={() => setActiveLayer(layer)}
          >
            {layer} ({skills[layer].length})
          </button>
        ))}
      </div>

      <div className="skills-list">
        {getSkillsForLayer(activeLayer).map((skill, index) => (
          <div key={index} className="skill-card">
            <div className="skill-header">
              <h4>{skill.name}</h4>
              <div className="skill-actions">
                <button
                  onClick={() => setShowVariationForm(showVariationForm === skill.name ? null : skill.name)}
                  className="btn-small"
                >
                  {showVariationForm === skill.name ? 'Cancel' : 'Add Variation'}
                </button>
                <button
                  onClick={() => handleRemoveSkill(skill.name)}
                  className="btn-delete-small"
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>

            {showVariationForm === skill.name && (
              <div className="variation-form">
                <input
                  type="text"
                  value={newVariation}
                  onChange={(e) => setNewVariation(e.target.value)}
                  placeholder="Variation (e.g., reactjs, react.js)"
                  className="form-input"
                />
                <button
                  onClick={() => handleAddVariation(skill.name)}
                  className="btn-add"
                  disabled={loading}
                >
                  Add
                </button>
              </div>
            )}

            {skill.variations.length > 0 && (
              <div className="variations">
                <strong>Variations:</strong>
                <div className="variation-tags">
                  {skill.variations.map((variation, vIndex) => (
                    <span key={vIndex} className="variation-tag">
                      {variation}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {getSkillsForLayer(activeLayer).length === 0 && (
          <div className="empty-state">
            No skills in this category yet.
          </div>
        )}
      </div>

      <style>{`
        .skill-dictionary-manager {
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

        .version-info {
          color: #666;
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .btn-primary, .btn-secondary {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-primary:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
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

        .add-skill-form, .import-form {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .add-skill-form h3, .import-form h3 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .form-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .form-input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          text-transform: capitalize;
        }

        .btn-add {
          padding: 10px 20px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-add:hover {
          background: #218838;
        }

        .btn-add:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
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

        .import-textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          margin-bottom: 16px;
        }

        .layers-tabs {
          display: flex;
          gap: 5px;
          margin-bottom: 24px;
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

        .skills-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .skill-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
        }

        .skill-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .skill-header h4 {
          margin: 0;
          color: #333;
        }

        .skill-actions {
          display: flex;
          gap: 8px;
        }

        .btn-small, .btn-delete-small {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        }

        .btn-small {
          background: #007bff;
          color: white;
        }

        .btn-small:hover {
          background: #0056b3;
        }

        .btn-delete-small {
          background: #dc3545;
          color: white;
        }

        .btn-delete-small:hover {
          background: #c82333;
        }

        .btn-delete-small:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .variation-form {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
        }

        .variations {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e9ecef;
        }

        .variations strong {
          display: block;
          margin-bottom: 8px;
          color: #666;
          font-size: 13px;
        }

        .variation-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .variation-tag {
          padding: 4px 8px;
          background: #e9ecef;
          border-radius: 4px;
          font-size: 12px;
          color: #495057;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .loading, .error {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 18px;
        }

        .error {
          color: #dc3545;
        }
      `}</style>
    </div>
  );
};
