# AptiLead Product Requirements Document

**Status:** Product reference based on the implemented codebase  
**Primary audience:** Digital marketing, product, sales enablement, and internal stakeholders  
**Product:** AptiLead  
**Document date:** June 19, 2026

## 1. Purpose

This document describes AptiLead’s product vision, users, current capabilities, principal workflows, functional requirements, boundaries, and code-evidenced future direction. It is intended to give non-engineering teams a detailed and reliable product reference.

This is a descriptive PRD for the current product rather than a commitment to delivery dates. Future items are included only when the codebase explicitly indicates them.

## 2. Status Definitions

| Status | Meaning |
|---|---|
| **Available** | A working user flow is implemented in the application code. |
| **Partially Available** | Some functionality exists, but it is incomplete, configuration-dependent, or represented by a non-persistent interface. |
| **Planned** | The code explicitly identifies a disabled feature, placeholder, future integration, or unimplemented capability. |

## 3. Product Summary

AptiLead is a multi-role employability platform that connects student aptitude development with institutional assessment and recruitment.

The product supports:

- Individual adaptive aptitude practice
- College-assigned assessments and final exams
- Question-bank creation and administration
- Student performance analytics
- Institution, staff, class, and learner management
- Proctoring-related behavioural signals
- Tiered and verifiable certificates
- Degree-aware external job discovery
- Direct recruitment through partner-company job postings
- Multi-college platform administration

The product’s central lifecycle is:

> **Assess → Diagnose → Improve → Validate → Connect**

## 4. Product Vision

Enable colleges to build measurable student employability, enable students to demonstrate readiness, and enable employers to access more structured early-career candidate information through a shared digital platform.

## 5. Product Objectives

1. Provide students with personalised, measurable aptitude practice.
2. Give colleges a structured system for operating aptitude programs at scale.
3. Give mentors actionable visibility into learner progress and risk.
4. Produce credible, verifiable evidence of assessment outcomes.
5. Connect student readiness data with job discovery and employer opportunities.
6. Support multiple institutions with clear role and data boundaries.

## 6. Non-Goals and Boundaries

The current product should not be represented as:

- A complete learning management system for all academic subjects
- An automated hiring-decision engine
- A guaranteed placement service
- A video-interview platform
- A payroll, applicant-tracking, or employee-management system
- A formally accredited certification authority
- A fully implemented webcam proctoring system
- A public app-store product unless distribution is confirmed separately

## 7. User Roles and Access Model

### 7.1 Student

Students can access their own aptitude, assessment, certificate, job, and profile experiences.

### 7.2 Mentor

Mentors can monitor students assigned to their classes, review performance, manage questions, observe assessments and proctoring flags, and review certificate status.

### 7.3 HOD/Sub-admin

HODs operate within a department. Their views and management actions are scoped to their department and its classes, mentors, and students.

### 7.4 Principal/Admin

Principals manage the college’s departments, classes, staff, students, assessments, reports, settings, batches, and academic years.

### 7.5 Super Admin

Super Admins manage the platform’s colleges and view platform-wide activity and analytics.

### 7.6 Company

Company users create company profiles, publish job opportunities, receive applications, and update candidate statuses.

### 7.7 Role access requirement

The system must route authenticated users to their role-specific dashboard. Role decisions must be based on trusted server-side profile data rather than client-editable account metadata.

**Status:** Available

## 8. Product Modules

## 8.1 Authentication and Account Access

### Requirements

- Users must be able to sign in and sign out.
- Password-recovery and password-reset workflows must be available.
- Students may sign up through the student-facing flow where permitted.
- Companies must have a dedicated signup flow.
- Company provisioning must reject an email already attached to a non-company account.
- Dashboard routes must enforce role access on the server.
- Missing or invalid roles must not silently default to student access.

**Status:** Available

## 8.2 College and Academic Structure

### Requirements

- Super Admins must be able to create colleges and inspect college records.
- The platform must support multiple colleges.
- College admins must be able to organise:
  - Departments
  - Classes
  - Batches
  - Academic years
- Classes may contain year and section information.
- Classes may be associated with departments, batches, and academic years.
- HODs must remain scoped to their assigned department.
- Mentors may be assigned to one or more classes.

**Status:** Available

### Business value

This structure allows AptiLead to reflect how colleges actually organise students and staff, enabling assessment assignment and reporting at useful institutional levels.

## 8.3 Student Enrolment and Staff Management

### Student requirements

- Admins must be able to enrol students manually.
- Admins must be able to upload students in bulk from spreadsheets.
- Student records may include name, email, registration ID, department, class, section, semester, batch, and academic year.
- Admins must be able to edit or remove students.
- Admins must be able to reset student passwords.
- Student lists must support search and filtering.

### Staff requirements

- Principals must be able to create HOD accounts.
- Principals and HODs must be able to create mentor accounts within their allowed scope.
- Admins must be able to assign mentors to classes.
- Principals must be able to remove staff.

**Status:** Available

## 8.4 Question Bank

### Requirements

- Authorised college staff must be able to create questions manually.
- Questions must support:
  - Question text
  - Multiple answer options
  - Correct answer or correct option index
  - Explanation
  - Aptitude domain
  - Difficulty level
  - Optional question imagery
- Staff must be able to edit, activate/deactivate, and delete questions.
- The system must support bulk question entry.
- The system must support selecting existing question-bank items for assessments.
- AI-assisted question generation must be available when the relevant model credentials are configured.
- PDF question extraction must be available when its required AI integration is configured.
- Explanation generation must be available for supported questions.

**Status:** Available; AI features are configuration-dependent.

## 8.5 Adaptive Self-Practice

### Core behaviour

- A student may have one active self-practice test at a time.
- A standard self-practice test contains up to 25 questions.
- A self-practice session uses an overall expiration time.
- Question selection must consider:
  - The student’s prior answers in the active test
  - The target aptitude domain
  - The current domain difficulty level
  - Available questions at or near the target difficulty
  - Recently answered questions
- Correct answers raise the current domain level by one.
- Incorrect answers lower the current domain level by one.
- Difficulty must remain between Level 1 and Level 10.
- If an exact difficulty is unavailable, the closest available difficulty may be served.
- The system should reduce repetition of questions answered correctly in recent completed self-tests.
- When no domain is selected, the system should favour the least-attempted available domain to encourage broad coverage.
- A domain-specific practice flow may lock questions to the chosen domain.

**Status:** Available

### Timing

Question time allowances decrease as difficulty increases:

| Difficulty | Time allowance |
|---|---:|
| 1 | 90 seconds |
| 2 | 80 seconds |
| 3 | 70 seconds |
| 4 | 60 seconds |
| 5 | 50 seconds |
| 6 | 45 seconds |
| 7 | 40 seconds |
| 8 | 35 seconds |
| 9 | 30 seconds |
| 10 | 25 seconds |

### Feedback

- The student receives correctness feedback.
- The correct answer and explanation may be shown.
- The student can review question-level results after completion.

## 8.6 Scheduled Assessments

### Requirements

- Authorised staff must be able to create assessment drafts.
- Assessments may be scheduled for classes or cohorts.
- Assessment creation must support:
  - Title
  - Domain
  - Schedule
  - Duration or expiration
  - Instructions or notes
  - Curated question IDs
- Staff must be able to choose questions manually or from the question bank.
- Staff must be able to view upcoming tests.
- Staff must be able to edit, reschedule, and cancel assessments where permitted.
- Students must see assigned assessments on their dashboard.
- Students must be able to start and complete assigned tests.

**Status:** Available

## 8.7 Final Exams

### Requirements

- Admins must be able to create final-exam drafts.
- Final exams must be assignable to eligible classes.
- Admins must be able to update, schedule, reschedule, or cancel final exams.
- Students must see scheduled final exams.
- Students must be able to start or resume a final exam.
- Final exams must produce the same result detail needed for institutional review.
- Certificate eligibility must be determined when a final exam is completed.

**Status:** Available

## 8.8 Scoring, Percentiles, Levels, and Points

### Scoring requirements

- The system must calculate the percentage of correct answers for the completed test.
- The system must calculate per-domain accuracy.
- The system must store an overall score and domain-level scores.
- Percentiles must be calculated relative to existing recorded scores in the same domain.
- When no comparison population exists, the current implementation uses a neutral fallback percentile.

### Progression requirements

- Correct answers to higher-difficulty questions may advance the student’s level.
- A qualifying final-exam certificate may produce an additional level increase.
- Correct answers earn points based on difficulty.
- Faster correct answers may earn a speed bonus.
- Wrong or skipped answers earn no points.

**Status:** Available

### Important product note

The current completion flow stores simple percentage accuracy as the displayed test and domain score. A separate weighted-score utility exists in the codebase but is not the primary persisted completion score. Marketing must not claim that all displayed results are difficulty-weighted.

## 8.9 Student Dashboard and Progress

### Requirements

The student dashboard must surface:

- Current student level
- Total points
- Average aptitude score
- Recent tests
- Domain-level performance
- Score trend
- Domain mastery
- Assigned assessments
- Scheduled final exams
- Learning-path stage
- Degree-relevant job opportunities

Additional student pages must support:

- Test history
- Weekly, monthly, and all-time leaderboard views
- Detailed result and answer review
- Profile editing
- Certificate access
- Job discovery and application tracking

**Status:** Available

## 8.10 Learning Path

The product contains a four-stage learning path driven by average score:

| Stage | Name | Unlock threshold |
|---|---|---:|
| 1 | Foundation | Always available |
| 2 | Intermediate | 50% average |
| 3 | Advanced | 65% average |
| 4 | Expert | 80% average |

Each stage communicates the type of aptitude development associated with that level and links students back into practice.

**Status:** Available

## 8.11 Analytics and Reporting

### Student analytics

- Average score
- Domain performance
- Score trend
- Percentile
- Test history
- Question-level review

### Mentor analytics

- Assigned student count
- Active learners
- At-risk learners
- Average class score
- Student roster performance
- Top performers
- Recent test activity

### College analytics

- Enrolment counts
- Assessment activity
- Class, department, batch, and academic-year views
- Student performance tables
- At-risk and top-performing students
- Assessment and exam analytics
- Report export

### Platform analytics

- Total colleges
- Total students
- Tests completed
- Cross-college activity and leaderboard views

**Status:** Available

### At-risk rule

The product surfaces students with low performance as at risk. Interfaces and notification copy use a score below 50% as the relevant threshold.

## 8.12 Proctoring and Integrity Signals

### Current requirements

- The assessment client may record:
  - Tab switches
  - Page visibility changes
  - Focus loss
  - Audio spikes
  - Average response time
- A session may be flagged after repeated tab switching or audio anomalies.
- Proctoring logs must be stored against the relevant test.
- Mentors and authorised staff must be able to review flagged sessions.

**Status:** Partially Available

### Current limitations

- Face presence is currently stored using a default value.
- Webcam-based face detection is explicitly not implemented.
- Audio spike handling exists in client utilities, while the platform settings describe expanded audio anomaly detection as disabled.
- These signals assist review; they do not independently prove misconduct.

## 8.13 Certificates and Badges

### Certificate requirements

- Certificates must be issued automatically after qualifying final-exam performance.
- Certificate tiers are:

| Final-exam score | Tier | Grade label |
|---|---|---|
| 90–100 | Advanced | A |
| 80–89 | Intermediate | B |
| 70–79 | Basic | C |
| Below 70 | No certificate | — |

- Each certificate must have a unique verification code.
- A public verification page must validate a certificate.
- Authorised staff must be able to revoke a certificate.
- The student must be able to view issued certificates.
- A badge may be stored alongside a qualifying certificate.

**Status:** Available

### Product clarification

The code automatically issues certificates from final-exam outcomes. A platform-settings label still refers to mentor-issued certificates, but the manual-issuance action has intentionally been removed. Marketing should describe automatic outcome-based issuance, not manual mentor issuance.

## 8.14 Leaderboards and Gamification

### Requirements

- Students must accumulate points from correct answers.
- Students may advance through student levels.
- Leaderboards must support weekly, monthly, and all-time views.
- Badges and certificate tiers must reinforce achievement.
- Student dashboards must display relevant progress indicators.

**Status:** Available

## 8.15 External Job Discovery

### Requirements

- Students must be able to view external job listings when the job provider is configured.
- Default job recommendations should use the student’s course or degree type when available.
- Students must be able to search by keyword, degree, and location.
- External applications must open the provider’s application link.
- Searches must be rate-limited.
- Search results may be cached.
- The interface must explain when the external job provider is not configured.

**Status:** Available when a third-party API key is configured.

### Current provider

The current implementation uses JSearch through RapidAPI and defaults searches to India-oriented opportunities.

## 8.16 Partner Recruitment

### Company profile requirements

- Companies must have a dedicated signup experience.
- A company profile must support:
  - Company name
  - Industry
  - Website
  - Description

### Job-posting requirements

- Company users must be able to create and manage job postings.
- A job posting may include:
  - Title
  - Description
  - Requirements
  - Eligible degree types
  - Minimum aptitude score
  - Compensation/package
  - Location
  - Job type
  - Application deadline
- Supported job types are Full Time, Internship, and Contract.
- Companies must be able to activate, deactivate, update, and delete their own postings.

### Student application requirements

- Students must be able to see active partner postings.
- Students must be able to apply once per posting.
- An application must preserve a student snapshot containing relevant academic and aptitude information at application time.
- Students must be able to see the status of their applications.

### Recruiter requirements

- Recruiters must see posting and application statistics.
- Recruiters must see recent applications.
- Recruiters must be able to filter applications by job.
- Recruiters must be able to mark candidates as applied, shortlisted, or rejected.
- Recruiters must only manage applications associated with their own company’s postings.

**Status:** Available in application code; requires deployment of the company-recruitment database migration.

### Current limitation

The minimum aptitude score is captured on the posting and shared with students, but the current application action does not automatically block applicants who fall below that score. It should be described as recruiter criteria, not automated eligibility enforcement.

## 8.17 Mobile and Responsive Access

### Requirements

- Primary dashboards and assessment interfaces must be responsive.
- The project must support native Android and iOS packaging through Capacitor.
- Packaged apps may load the deployed web application.

**Status:** Partially Available

### Current limitation

Mobile packaging and Android project files are present. App-store publication, release status, and iOS build status are not established by the repository and must be confirmed separately.

## 9. Principal End-to-End Workflows

## 9.1 Adaptive practice workflow

1. Student starts or resumes an active self-test.
2. The platform loads prior attempts and current expiry.
3. The platform chooses the least-covered or selected domain.
4. The platform calculates the current domain level.
5. The nearest available question is selected.
6. The student answers within the allotted time.
7. The response is evaluated and stored.
8. The domain level adjusts for the next question.
9. The test completes at the question limit, curated-pool limit, expiry, or pool exhaustion.
10. Scores, percentiles, points, and progression are stored.

## 9.2 College assessment workflow

1. Admin or mentor creates a draft.
2. Questions are generated, entered, or selected from the bank.
3. The assessment is assigned to a class or cohort.
4. Students see the assignment.
5. Students complete the assessment.
6. Results become available to authorised staff.
7. Staff review performance, risk, and question-level outcomes.

## 9.3 Certificate workflow

1. Admin schedules a final exam.
2. Student completes the final exam.
3. The platform calculates the final score.
4. A score of at least 70% maps to Basic, Intermediate, or Advanced.
5. The platform creates a certificate and badge.
6. The student receives access to the certificate.
7. A third party can verify the certificate through its public code.
8. Authorised staff may revoke it if required.

## 9.4 Partner recruitment workflow

1. Company completes signup and profile setup.
2. Recruiter creates and activates a posting.
3. Students view the opportunity.
4. Student applies.
5. The platform saves a student snapshot with the application.
6. Recruiter reviews the application.
7. Recruiter updates the candidate status.
8. Student sees the updated status.

## 10. Data and Integrations Overview

### Application stack

- Next.js 16 application
- React 19 user interfaces
- Supabase authentication and PostgreSQL data layer
- Server-side actions for protected operations
- Tailwind CSS-based responsive styling
- Capacitor for Android and iOS packaging

### External integrations

- Supabase for authentication and application data
- Google Gemini integration for AI-assisted question operations
- JSearch/RapidAPI for external job discovery
- Resend for email-related workflows
- Vercel Analytics and Speed Insights
- PDF and spreadsheet processing libraries for question and enrolment operations

### Configuration dependencies

Some functions require environment-level credentials. The presence of an interface does not guarantee that every external integration is configured in each deployment.

## 11. Security and Privacy Requirements

- Authentication must be validated on the server for protected operations.
- Role access must use trusted application profile data.
- Users must not gain access to another role’s dashboard.
- College and department operations must be scoped to the caller’s allowed institution structure.
- Mentors must only access assigned students or classes.
- Students must only apply as themselves.
- Companies must only manage their own postings and related applications.
- Sensitive server credentials must remain server-side.
- Public certificate verification must reveal only the data required to validate a credential.
- Recruitment snapshots must be treated as student data and handled accordingly.

### Database note

The company recruitment tables enable row-level security. Current application workflows use protected server actions and an administrative database client with explicit application-level ownership checks. Before exposing those tables directly through a client data API, deployment-specific grants and row-level policies must be reviewed.

## 12. Error and Empty-State Behaviour

The product should:

- Redirect unauthenticated users to login.
- Reject unauthorised role access.
- Explain when no students, assessments, tests, jobs, applications, or certificates exist.
- Prevent duplicate applications.
- Explain when the external jobs provider is not configured.
- Present rate-limit feedback for excessive job searches.
- Preserve company signup consistency when profile creation fails.
- Return a safe empty state when third-party job APIs fail.
- Prevent users from editing records outside their permitted scope.

## 13. Product Success Indicators

The codebase does not define commercial targets. The following product indicators are suitable for internal measurement once analytics definitions are approved:

### Student activation

- Percentage of enrolled students completing a first assessment
- Median time from enrolment to first completed assessment
- Percentage returning for a second practice session

### Learning engagement

- Assessments completed per active student
- Weekly active learners
- Learning-stage progression
- Change in average score over time
- Domain improvement by cohort

### College adoption

- Active colleges
- Active mentors and admins
- Assessments scheduled per college
- Percentage of students assigned to classes and batches
- Report and analytics usage

### Outcomes

- Final-exam participation and pass rate
- Certificates issued and verified
- At-risk students improving above the risk threshold

### Recruitment

- Active company profiles
- Active partner postings
- Applications per posting
- Shortlist rate
- Student-to-opportunity conversion

These are measurement recommendations, not current performance claims.

## 14. Current Limitations and Marketing Implications

| Limitation | Marketing implication |
|---|---|
| Advanced face detection is not implemented | Describe current proctoring as behavioural/integrity signals, not AI webcam proctoring |
| External jobs require API configuration | Qualify job discovery as available in configured deployments |
| Partner recruitment requires its migration | Confirm deployment before demonstrating or selling the workflow |
| Minimum aptitude criteria are not automatically enforced | Describe them as recruiter-defined criteria |
| Some settings pages are non-persistent interfaces | Do not advertise complete self-service platform configuration |
| Mobile app-store release is unconfirmed | Say “mobile packaging support,” not “available in app stores” |
| Current displayed scores use percentage accuracy | Avoid unsupported claims about psychometric or weighted-score sophistication |
| Certificates are platform-issued outcomes | Do not call them accredited unless accreditation is established outside the codebase |

## 15. Code-Evidenced Future Capabilities

The following items are explicitly indicated in interfaces, comments, or disabled settings:

### 15.1 Face-detection proctoring

The platform settings include a disabled webcam-based face-detection flag, and the proctoring utility states that face detection remains to be implemented.

**Status:** Planned

### 15.2 Expanded audio anomaly detection

Basic audio-spike signals exist, while a platform-level audio anomaly feature is shown as disabled. This indicates a future, more controlled implementation.

**Status:** Planned expansion

### 15.3 Persisted global feature flags

The Super Admin settings interface displays feature controls, but the current page does not persist those controls.

**Status:** Planned

### 15.4 Platform-wide announcements

The Super Admin interface contains announcement-banner controls without an implemented persistence or publishing workflow.

**Status:** Planned

### 15.5 Notification preferences and alerts

The college settings interface presents preferences for new enrolments, test completion, and at-risk alerts, but persistent notification behaviour is not connected.

**Status:** Planned

### 15.6 Expanded college-profile controls

The college profile section is explicitly marked as requiring integration and Super Admin approval.

**Status:** Planned

### 15.7 Persisted API-key administration

The platform settings interface contains API-key fields, but the current interface is not connected to secure credential persistence.

**Status:** Planned

### 15.8 Broader platform commercial settings

The Super Admin navigation references pricing alongside API keys and feature flags, while no complete pricing-management workflow is implemented.

**Status:** Planned

## 16. Assumptions

- Colleges are the principal organisational unit in the platform.
- Students belong to an academic structure managed by a participating college.
- Recruiters represent one company profile.
- Aptitude results are useful readiness indicators but do not replace a complete hiring evaluation.
- Third-party integrations are enabled only when the required credentials are configured.
- Deployment teams apply required database migrations before releasing associated features.

## 17. Glossary

| Term | Meaning |
|---|---|
| Adaptive assessment | A test in which subsequent difficulty responds to prior answers |
| Cohort assessment | An assessment assigned to a defined student group or class |
| Final exam | An institution-assigned assessment that can produce certificate eligibility |
| Partner job | A job posted directly by a company registered on AptiLead |
| External job | A listing retrieved from a third-party job-search provider |
| Student snapshot | Academic and aptitude information preserved with a job application |
| HOD/Sub-admin | A department-level administrator |
| Proctoring flag | A behavioural or audio-related signal requiring human review |
| RLS | Database row-level security |

## 18. Product Narrative for Internal Teams

AptiLead is strongest when described as a connected employability system rather than only an aptitude-test product. The adaptive assessment engine generates useful evidence, the college layer turns that evidence into an organised development program, the certificate layer validates achievement, and the recruitment layer gives the development journey a direct route to opportunity.

