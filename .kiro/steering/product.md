# Product Overview

Job Bid and Interview Management System - A desktop application that automates job application tracking from bidding through interviews.

## Core Purpose

Automatically track job applications and interviews by receiving information from Microsoft Outlook emails via Microsoft Graph API, updating bid statuses and interview information without manual intervention.

## Key Features

- **Bid Management**: Track job applications with automatic status updates from email events
- **Interview Management**: Schedule and track interviews with eligibility validation based on company history
- **Duplication Detection**: Prevent duplicate bids based on link or company+role matching
- **Company History**: Track failed interviews and validate future interview eligibility (prevents interviewing with same recruiter/attendees)
- **Resume Checker**: Infer whether ATS or recruiters screen resumes based on rejection timing
- **Email Integration**: Automatic updates from Microsoft Outlook emails (rejection notifications, interview scheduling)
- **Dual Dashboards**: Separate dashboards for bids and interviews

## Architecture Philosophy

The system follows **clean architecture** and **domain-driven design** principles:

- Pure business logic in domain layer with no infrastructure dependencies
- Clear separation between domain, application, infrastructure, and presentation layers
- Domain objects are pure TypeScript classes without persistence annotations
- All correctness properties are validated using property-based testing (fast-check)
