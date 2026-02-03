/**
 * UserGuidePage - Comprehensive guide for using the Job Bid & Interview Manager
 * 
 * Provides step-by-step instructions, feature explanations, and best practices
 */

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WorkIcon from '@mui/icons-material/Work';
import EventIcon from '@mui/icons-material/Event';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import DescriptionIcon from '@mui/icons-material/Description';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import RateReviewIcon from '@mui/icons-material/RateReview';
import BarChartIcon from '@mui/icons-material/BarChart';

export const UserGuidePage: React.FC = () => {
  const [expanded, setExpanded] = useState<string | false>('overview');

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Typography variant="h3" gutterBottom>
          User Guide
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Learn how to use the Job Bid & Interview Management System effectively
        </Typography>
      </Paper>

      {/* Overview */}
      <Accordion expanded={expanded === 'overview'} onChange={handleChange('overview')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">📖 Overview</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography paragraph>
              The Job Bid & Interview Management System is a desktop application designed to help you track job applications 
              and interviews efficiently. It features:
            </Typography>
            <ul>
              <li><strong>Bid Management:</strong> Track job applications with automatic status updates</li>
              <li><strong>Interview Tracking:</strong> Schedule and manage interviews with eligibility validation</li>
              <li><strong>Enhanced Skill Matching:</strong> Match resumes to job descriptions using canonical skills</li>
              <li><strong>Analytics:</strong> Gain insights into your job search performance</li>
              <li><strong>Company History:</strong> Track past interactions to avoid duplicate applications</li>
            </ul>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Bids Section */}
      <Accordion expanded={expanded === 'bids'} onChange={handleChange('bids')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <WorkIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Bids Dashboard</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="h6" gutterBottom>Creating a Bid</Typography>
            <Typography paragraph>
              1. Click the <strong>"Create New Bid"</strong> button<br/>
              2. Fill in the required information:
            </Typography>
            <ul>
              <li><strong>Link:</strong> Job posting URL (used for duplication detection)</li>
              <li><strong>Company:</strong> Company name</li>
              <li><strong>Client:</strong> End client (if different from company)</li>
              <li><strong>Role:</strong> Select seniority level, job title, and Full Stack modifier (if applicable)</li>
              <li><strong>Main Stacks:</strong> Paste weighted skills JSON from ChatGPT (see format below)</li>
              <li><strong>Layer Weights:</strong> Optionally customize the importance of each technology layer</li>
              <li><strong>Job Description:</strong> Full JD text</li>
              <li><strong>Resume:</strong> Upload a new resume or select from history</li>
              <li><strong>Origin:</strong> Where you found the job (LinkedIn, Bid, etc.)</li>
              <li><strong>Recruiter:</strong> Recruiter name (required for LinkedIn origin)</li>
            </ul>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Role Selection</Typography>
            <Typography paragraph>
              The role determines default layer weights for match rate calculation:
            </Typography>
            <ul>
              <li><strong>Seniority:</strong> Junior, Mid, Senior, Lead, Staff</li>
              <li><strong>Title:</strong> Software Engineer, Backend Engineer, Frontend Developer, Full Stack Engineer, etc.</li>
              <li><strong>Full Stack Modifier:</strong> Balanced, Frontend Heavy, or Backend Heavy (only for Full Stack Engineer)</li>
            </ul>
            <Typography paragraph>
              Example: "Senior Frontend Heavy Full Stack Engineer"
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Weighted Skills Format</Typography>
            <Typography paragraph>
              Skills must be provided as a JSON object with weights per layer. Each skill has a weight indicating 
              its importance (weights must sum to 1.0 per layer):
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.100', fontFamily: 'monospace', fontSize: '0.85rem', overflow: 'auto' }}>
              {`{
  "frontend": [
    { "skill": "react", "weight": 0.5 },
    { "skill": "typescript", "weight": 0.3 },
    { "skill": "javascript", "weight": 0.2 }
  ],
  "backend": [
    { "skill": "python", "weight": 0.4 },
    { "skill": "fastapi", "weight": 0.6 }
  ],
  "database": [
    { "skill": "postgresql", "weight": 1.0 }
  ],
  "cloud": [
    { "skill": "aws", "weight": 1.0 }
  ],
  "devops": [],
  "others": []
}`}
            </Paper>
            <Typography paragraph sx={{ mt: 1 }}>
              <strong>Rules:</strong>
            </Typography>
            <ul>
              <li>Must include all 6 layers: frontend, backend, database, cloud, devops, others</li>
              <li>Skill weights within each layer must sum to 1.0 (±0.001 tolerance)</li>
              <li>Empty layers are allowed (use empty array [])</li>
              <li>Skill names are case-insensitive</li>
            </ul>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Layer Weights Customization</Typography>
            <Typography paragraph>
              Each role has predefined layer weights (e.g., Frontend Developer: 70% frontend, 10% backend, etc.). 
              You can customize these weights if the defaults don't match the job requirements. Weights must sum to 1.0.
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Finding Similar Bids</Typography>
            <Typography paragraph>
              Click the <strong>"Similar"</strong> button on any bid to find similar job applications using weighted match rate calculation:
            </Typography>
            <ul>
              <li><strong>Overall Match Rate:</strong> Percentage similarity based on skills and layer weights</li>
              <li><strong>Layer Breakdown:</strong> Match rate for each technology layer</li>
              <li><strong>Matching Skills:</strong> Skills present in both bids (green chips)</li>
              <li><strong>Missing Skills:</strong> Skills in current bid but not in matched bid (red chips)</li>
            </ul>
            <Typography paragraph>
              <strong>Match Rate Formula:</strong> For each layer, calculate sum of (currentWeight × matchedWeight) for matching skills, 
              then multiply by layer weight and sum across all layers.
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Bid Statuses</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip label="Submitted" color="default" size="small" />
              <Chip label="Rejected" color="error" size="small" />
              <Chip label="Interview Scheduled" color="primary" size="small" />
            </Box>
            
            <Typography variant="h6" gutterBottom>Key Features</Typography>
            <ul>
              <li><strong>Duplication Detection:</strong> System prevents duplicate bids based on link or company+role</li>
              <li><strong>Resume Selection:</strong> Choose from previously used resumes with stack matching</li>
              <li><strong>Auto-Rejection:</strong> Bids older than 2 weeks are automatically marked as rejected</li>
              <li><strong>Rebidding:</strong> Submit a new resume for the same job</li>
            </ul>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Interviews Section */}
      <Accordion expanded={expanded === 'interviews'} onChange={handleChange('interviews')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <EventIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Interviews Dashboard</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="h6" gutterBottom>Scheduling an Interview</Typography>
            <Typography paragraph>
              1. Click <strong>"Schedule Interview"</strong><br/>
              2. Select the associated bid<br/>
              3. Enter interview details:
            </Typography>
            <ul>
              <li><strong>Date & Time:</strong> When the interview is scheduled</li>
              <li><strong>Attendees:</strong> Names of interviewers (comma-separated)</li>
              <li><strong>Interview Type:</strong> Phone, Video, In-person, etc.</li>
            </ul>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Interview Statuses</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip label="Scheduled" color="primary" size="small" />
              <Chip label="Attended" color="info" size="small" />
              <Chip label="Passed" color="success" size="small" />
              <Chip label="Failed" color="error" size="small" />
              <Chip label="Cancelled" color="warning" size="small" />
            </Box>
            
            <Typography variant="h6" gutterBottom>Eligibility Validation</Typography>
            <Typography paragraph>
              The system prevents scheduling interviews if you've previously failed with:
            </Typography>
            <ul>
              <li>The same company and role</li>
              <li>The same recruiter</li>
              <li>Any of the same attendees</li>
            </ul>
            
            <Typography variant="h6" gutterBottom>Completing an Interview</Typography>
            <Typography paragraph>
              After attending an interview, mark it as complete and specify the outcome (Passed/Failed).
              If failed, provide a reason - this helps with future eligibility checks.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* JD Specifications Section */}
      <Accordion expanded={expanded === 'jd-specs'} onChange={handleChange('jd-specs')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <DescriptionIcon sx={{ mr: 1 }} />
          <Typography variant="h6">JD Specifications</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography paragraph>
              JD Specifications convert raw job descriptions into structured, canonical skill requirements.
            </Typography>
            
            <Typography variant="h6" gutterBottom>Creating a JD Spec</Typography>
            <Typography paragraph>
              1. Enter the <strong>Role</strong> (e.g., "Full Stack Developer")<br/>
              2. Set <strong>Layer Weights</strong> to indicate importance of each tech layer:<br/>
              &nbsp;&nbsp;&nbsp;- Frontend, Backend, Database, Cloud, DevOps, Others<br/>
              &nbsp;&nbsp;&nbsp;- Weights must sum to 1.0<br/>
              3. Add <strong>Skills</strong> for each layer with weights (must sum to 1.0 per layer)
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Unknown Skills</Typography>
            <Typography paragraph>
              If you enter a skill not in the dictionary, it will be flagged as "unknown" and added to the 
              Skill Review Queue for approval.
            </Typography>
            
            <Typography variant="h6" gutterBottom>Correlation Analysis</Typography>
            <Typography paragraph>
              Compare two JD specs to see how similar they are. Useful for identifying similar roles 
              or tracking how requirements change over time.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Skill Dictionary Section */}
      <Accordion expanded={expanded === 'dictionary'} onChange={handleChange('dictionary')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <LibraryBooksIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Skill Dictionary</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography paragraph>
              The Skill Dictionary maintains a canonical list of skills organized by technology layer.
            </Typography>
            
            <Typography variant="h6" gutterBottom>Managing Skills</Typography>
            <ul>
              <li><strong>Add Canonical Skill:</strong> Create a new skill in a specific category</li>
              <li><strong>Add Variation:</strong> Link alternative names to canonical skills (e.g., "React.js" → "React")</li>
              <li><strong>Remove Skill:</strong> Delete a skill and all its variations</li>
            </ul>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>Technology Layers</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip label="Frontend" color="primary" size="small" />
              <Chip label="Backend" color="secondary" size="small" />
              <Chip label="Database" color="success" size="small" />
              <Chip label="Cloud" color="info" size="small" />
              <Chip label="DevOps" color="warning" size="small" />
              <Chip label="Others" color="default" size="small" />
            </Box>
            
            <Typography variant="h6" gutterBottom>Import/Export</Typography>
            <Typography paragraph>
              - <strong>Export:</strong> Download the dictionary as JSON for backup<br/>
              - <strong>Import:</strong> Load a dictionary (replace or merge with existing)
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Skill Review Section */}
      <Accordion expanded={expanded === 'review'} onChange={handleChange('review')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <RateReviewIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Skill Review Queue</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography paragraph>
              When creating JD specs, unknown skills are automatically added to the review queue.
            </Typography>
            
            <Typography variant="h6" gutterBottom>Reviewing Skills</Typography>
            <Typography paragraph>
              For each unknown skill, you can:
            </Typography>
            <ul>
              <li><strong>Approve as Canonical:</strong> Add it as a new canonical skill (select category)</li>
              <li><strong>Approve as Variation:</strong> Link it to an existing canonical skill</li>
              <li><strong>Reject:</strong> Remove it from the queue with a reason</li>
            </ul>
            
            <Typography variant="h6" gutterBottom>Queue Information</Typography>
            <Typography paragraph>
              Each skill shows:
            </Typography>
            <ul>
              <li>Frequency: How many times it's been used</li>
              <li>First/Last Seen: When it was first and last detected</li>
              <li>Sources: Which JD specs contain this skill</li>
            </ul>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Skill Statistics Section */}
      <Accordion expanded={expanded === 'statistics'} onChange={handleChange('statistics')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <BarChartIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Skill Statistics</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography paragraph>
              View usage statistics for skills across all JD specifications.
            </Typography>
            
            <Typography variant="h6" gutterBottom>Available Metrics</Typography>
            <ul>
              <li><strong>Frequency:</strong> How often each skill appears in JD specs</li>
              <li><strong>Category Distribution:</strong> Skills grouped by technology layer</li>
              <li><strong>Trending Skills:</strong> Most commonly requested skills</li>
              <li><strong>Date Filtering:</strong> View statistics for specific time periods</li>
            </ul>
            
            <Typography paragraph>
              Use this data to understand market demand and tailor your skill development.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Analytics Section */}
      <Accordion expanded={expanded === 'analytics'} onChange={handleChange('analytics')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <AnalyticsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Analytics Dashboard</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography paragraph>
              Comprehensive analytics to track your job search performance.
            </Typography>
            
            <Typography variant="h6" gutterBottom>Available Analytics</Typography>
            <ul>
              <li><strong>Overview:</strong> Total bids, interviews, success rates</li>
              <li><strong>Bid Performance:</strong> Acceptance rates, rejection reasons</li>
              <li><strong>Interview Performance:</strong> Pass/fail rates, interview types</li>
              <li><strong>Tech Stack Analysis:</strong> Which stacks get the most responses</li>
              <li><strong>Company Performance:</strong> Success rates by company</li>
              <li><strong>Time Trends:</strong> Application and interview patterns over time</li>
              <li><strong>Recruiter Performance:</strong> Which recruiters lead to interviews</li>
              <li><strong>Origin Comparison:</strong> Which job boards are most effective</li>
            </ul>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Best Practices */}
      <Accordion expanded={expanded === 'best-practices'} onChange={handleChange('best-practices')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">💡 Best Practices</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="h6" gutterBottom>Bid Management</Typography>
            <ul>
              <li>Always include the job posting link to enable duplication detection</li>
              <li>Be specific with company and role names for accurate tracking</li>
              <li>Use the resume selector to maintain consistency across applications</li>
              <li>Review auto-rejected bids periodically to ensure accuracy</li>
            </ul>
            
            <Typography variant="h6" gutterBottom>Interview Tracking</Typography>
            <ul>
              <li>Record attendee names accurately for future eligibility checks</li>
              <li>Always complete interviews with outcomes to build company history</li>
              <li>Provide detailed failure reasons to improve future applications</li>
            </ul>
            
            <Typography variant="h6" gutterBottom>Skill Management</Typography>
            <ul>
              <li>Review unknown skills regularly to keep the dictionary up-to-date</li>
              <li>Use variations to normalize different names for the same skill</li>
              <li>Export the dictionary periodically as a backup</li>
              <li>Check skill statistics to align your skills with market demand</li>
            </ul>
            
            <Typography variant="h6" gutterBottom>Analytics Usage</Typography>
            <ul>
              <li>Review analytics weekly to identify patterns</li>
              <li>Use tech stack analysis to focus on in-demand technologies</li>
              <li>Track time trends to optimize application timing</li>
              <li>Compare origin performance to focus on effective job boards</li>
            </ul>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Troubleshooting */}
      <Accordion expanded={expanded === 'troubleshooting'} onChange={handleChange('troubleshooting')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">🔧 Troubleshooting</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="h6" gutterBottom>Common Issues</Typography>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              <strong>Cannot create duplicate bid</strong>
            </Typography>
            <Typography paragraph>
              The system detected a duplicate based on link or company+role. Check existing bids 
              or use the rebid feature if you want to submit a different resume.
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
              <strong>Cannot schedule interview</strong>
            </Typography>
            <Typography paragraph>
              You may have previously failed an interview with the same company, recruiter, or attendees. 
              Check company history to verify eligibility.
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
              <strong>Unknown skills in JD spec</strong>
            </Typography>
            <Typography paragraph>
              Skills not in the dictionary are flagged as unknown. Go to the Skill Review Queue to 
              approve them as canonical skills or variations.
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
              <strong>Layer weights don't sum to 1.0</strong>
            </Typography>
            <Typography paragraph>
              When creating JD specs, ensure layer weights and skill weights within each layer sum to exactly 1.0.
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
