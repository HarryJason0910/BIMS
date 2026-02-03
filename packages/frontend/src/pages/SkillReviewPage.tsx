/**
 * SkillReviewPage - Page for reviewing unknown skills
 * 
 * Part of: enhanced-skill-matching feature
 * Requirements: 5.3-5.6, 9.12, 9.13
 */

import React from 'react';
import { SkillReviewQueue } from '../components/SkillReviewQueue';

export const SkillReviewPage: React.FC = () => {
  return (
    <div className="skill-review-page">
      <SkillReviewQueue />
    </div>
  );
};
