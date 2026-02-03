/**
 * JDSpecificationPage - Page for managing JD specifications
 * 
 * Features:
 * - Create new JD specifications
 * - View existing JD specifications
 * - Display unknown skills detected during creation
 * - Link to skill review queue
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 4.1-4.10
 */

import React, { useState, useEffect } from 'react';
import { JDSpecForm } from '../components/JDSpecForm';
import { JDSpecDisplay } from '../components/JDSpecDisplay';
import { apiClient } from '../api/client';
import { CanonicalJDSpec, CreateJDSpecRequest } from '../api/types';

export const JDSpecificationPage: React.FC = () => {
  const [jdSpecs, setJdSpecs] = useState<CanonicalJDSpec[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [unknownSkills, setUnknownSkills] = useState<string[]>([]);

  useEffect(() => {
    loadJDSpecs();
  }, []);

  const loadJDSpecs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getAllJDSpecs();
      setJdSpecs(response.jdSpecs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load JD specifications');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJDSpec = async (data: CreateJDSpecRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.createJDSpec(data);
      
      // Show unknown skills if any were detected
      if (response.unknownSkills.length > 0) {
        setUnknownSkills(response.unknownSkills);
      }

      // Reload the list
      await loadJDSpecs();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create JD specification');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJDSpec = async (id: string) => {
    if (!confirm('Are you sure you want to delete this JD specification?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiClient.deleteJDSpec(id);
      await loadJDSpecs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete JD specification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jd-specification-page">
      <div className="page-header">
        <h1>JD Specifications</h1>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn-primary"
        >
          {showForm ? 'Cancel' : 'Create New JD Spec'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {unknownSkills.length > 0 && (
        <div className="alert alert-warning">
          <h4>Unknown Skills Detected</h4>
          <p>The following skills were not found in the dictionary and have been queued for review:</p>
          <ul>
            {unknownSkills.map((skill, index) => (
              <li key={index}>{skill}</li>
            ))}
          </ul>
          <button 
            onClick={() => setUnknownSkills([])} 
            className="btn-dismiss"
          >
            Dismiss
          </button>
        </div>
      )}

      {showForm && (
        <div className="form-container">
          <JDSpecForm 
            onSubmit={handleCreateJDSpec}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {loading && <div className="loading">Loading...</div>}

      <div className="jd-specs-list">
        {jdSpecs.length === 0 && !loading && !showForm && (
          <div className="empty-state">
            <p>No JD specifications yet. Create your first one!</p>
          </div>
        )}

        {jdSpecs.map(spec => (
          <div key={spec.id} className="jd-spec-item">
            <JDSpecDisplay 
              jdSpec={spec}
              onDelete={() => handleDeleteJDSpec(spec.id)}
            />
          </div>
        ))}
      </div>

      <style>{`
        .jd-specification-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .page-header h1 {
          margin: 0;
          color: #333;
        }

        .btn-primary {
          padding: 12px 24px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
        }

        .btn-primary:hover {
          background: #0056b3;
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

        .alert-warning {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        .alert h4 {
          margin: 0 0 8px 0;
        }

        .alert p {
          margin: 8px 0;
        }

        .alert ul {
          margin: 8px 0;
          padding-left: 24px;
        }

        .btn-dismiss {
          margin-top: 12px;
          padding: 8px 16px;
          background: #856404;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-dismiss:hover {
          background: #6c4f03;
        }

        .form-container {
          margin-bottom: 32px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 18px;
        }

        .jd-specs-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .jd-spec-item {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .empty-state p {
          font-size: 18px;
          margin: 0;
        }
      `}</style>
    </div>
  );
};
