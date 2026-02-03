/**
 * SkillStatisticsPage - Page for skill usage statistics
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 11.1-11.6
 */

import React from 'react';
import { SkillStatisticsDashboard } from '../components/SkillStatisticsDashboard';

export const SkillStatisticsPage: React.FC = () => {
  return (
    <div className="skill-statistics-page">
      <SkillStatisticsDashboard />
    </div>
  );
};
