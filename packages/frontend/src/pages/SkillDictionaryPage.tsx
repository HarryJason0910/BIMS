/**
 * SkillDictionaryPage - Page for managing the skill dictionary
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 2.4, 9.8-9.11, 10.1-10.6
 */

import React from 'react';
import { SkillDictionaryManager } from '../components/SkillDictionaryManager';

export const SkillDictionaryPage: React.FC = () => {
  return (
    <div className="skill-dictionary-page">
      <SkillDictionaryManager />
    </div>
  );
};
