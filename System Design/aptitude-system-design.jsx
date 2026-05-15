import { useState } from "react";

const colors = {
  bg: "#0a0a0f",
  surface: "#12121a",
  card: "#1a1a26",
  border: "#2a2a3d",
  accent: "#6c63ff",
  accentSoft: "#6c63ff22",
  green: "#22c55e",
  yellow: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  text: "#e8e8f0",
  muted: "#6b6b8a",
};

const roles = ["Super Admin", "College Admin", "Sub Admin", "Mentor", "Student"];

const roleColors = {
  "Super Admin": "#ef4444",
  "College Admin": "#f59e0b",
  "Sub Admin": "#6c63ff",
  "Mentor": "#3b82f6",
  "Student": "#22c55e",
};

const pages = {
  "Super Admin": [
    {
      name: "Super Dashboard",
      path: "/super/dashboard",
      desc: "Overview of all colleges, total students, revenue, active tests",
      features: ["All colleges list", "Platform-wide analytics", "Revenue tracker", "Alert flags"],
    },
    {
      name: "College Management",
      path: "/super/colleges",
      desc: "Add/remove colleges, assign college admins, view per-college stats",
      features: ["Add college", "Assign admin", "College stats", "Suspend college"],
    },
    {
      name: "Platform Settings",
      path: "/super/settings",
      desc: "Global configs, pricing, AI API keys, domain settings",
      features: ["API key management", "Pricing tiers", "Feature flags", "Announcement banner"],
    },
    {
      name: "Global Analytics",
      path: "/super/analytics",
      desc: "Cross-college aptitude trends, top performers, weak spots",
      features: ["Cross-college leaderboard", "Domain heat map", "Engagement charts"],
    },
  ],
  "College Admin": [
    {
      name: "Admin Dashboard",
      path: "/admin/dashboard",
      desc: "College-level overview — active students, recent tests, department stats",
      features: ["Student count", "Test completion rate", "Department breakdown", "Flagged students"],
    },
    {
      name: "Department Setup",
      path: "/admin/departments",
      desc: "Create departments, assign course types (MBA/BCA/BE), define semesters",
      features: ["Add department", "Course type", "Semester count", "Specializations"],
    },
    {
      name: "Class & Section",
      path: "/admin/classes",
      desc: "Create classes within departments, add sections/batches",
      features: ["Create class", "Add section", "Assign sub-admin", "View roster"],
    },
    {
      name: "Bulk Student Upload",
      path: "/admin/students/upload",
      desc: "CSV upload → auto-generate student IDs and passwords",
      features: ["CSV template download", "Bulk upload", "Auto ID generation", "Email credentials"],
    },
    {
      name: "Mentor Management",
      path: "/admin/mentors",
      desc: "Add mentors, assign to classes/sections",
      features: ["Add mentor", "Assign class", "View mentor activity", "Remove mentor"],
    },
    {
      name: "Reports & Export",
      path: "/admin/reports",
      desc: "Generate and download college-wide or class-wise reports",
      features: ["PDF export", "CSV export", "Class-wise filter", "Semester filter"],
    },
    {
      name: "Admin Settings",
      path: "/admin/settings",
      desc: "College profile, branding, notification prefs",
      features: ["College profile", "Logo upload", "Notification settings"],
    },
  ],
  "Sub Admin": [
    {
      name: "Department Dashboard",
      path: "/subadmin/dashboard",
      desc: "View only their department's data — students, mentors, scores",
      features: ["Dept student list", "Mentor list", "Avg domain scores", "Flagged attempts"],
    },
    {
      name: "Class Management",
      path: "/subadmin/classes",
      desc: "Manage classes within their department only",
      features: ["View classes", "Assign mentors", "View class analytics"],
    },
    {
      name: "Department Reports",
      path: "/subadmin/reports",
      desc: "Export reports for their department only",
      features: ["Filter by class", "Domain breakdown", "Export PDF/CSV"],
    },
  ],
  "Mentor": [
    {
      name: "Mentor Dashboard",
      path: "/mentor/dashboard",
      desc: "Overview of assigned students, active sessions, alerts",
      features: ["Active students", "Recent test results", "Risk flags", "Quick actions"],
    },
    {
      name: "Live Proctoring",
      path: "/mentor/proctor",
      desc: "Real-time monitoring of ongoing tests — tab switches, face detection, timing",
      features: ["Active student grid", "Tab switch count", "Face detection", "Audio anomaly", "Time per Q"],
    },
    {
      name: "Student Progress",
      path: "/mentor/students",
      desc: "Individual student performance across all domains and tests",
      features: ["Domain scores", "Level progress", "Test history", "Weak areas"],
    },
    {
      name: "Question Bank",
      path: "/mentor/questions",
      desc: "Add/edit questions, tag by domain and difficulty",
      features: ["Add question", "Tag domain", "Set difficulty", "AI generate (future)", "Preview"],
    },
    {
      name: "Assessments",
      path: "/mentor/assessments",
      desc: "Create scheduled tests, set time limits, assign to classes",
      features: ["Create test", "Schedule", "Assign class", "Set timer", "Center-based flag"],
    },
    {
      name: "Certificates",
      path: "/mentor/certificates",
      desc: "Issue certificates to students who cross threshold scores",
      features: ["Eligibility filter", "Issue certificate", "QR code", "Revoke"],
    },
  ],
  "Student": [
    {
      name: "Student Home",
      path: "/student/home",
      desc: "Personal dashboard — level, streak, next test, quick stats",
      features: ["Current level", "Streak", "Pending tests", "Domain ring chart"],
    },
    {
      name: "Take Test",
      path: "/student/test",
      desc: "Adaptive MCQ test — timer, no back navigation, anti-cheat",
      features: ["Adaptive difficulty", "Timer per Q", "No back nav", "Submit flow", "Anti-cheat detect"],
    },
    {
      name: "Results",
      path: "/student/results/:id",
      desc: "Post-test breakdown — correct/wrong, domain scores, explanations",
      features: ["Score summary", "Domain breakdown", "Wrong answers review", "30-sec video/text explanation"],
    },
    {
      name: "Progress",
      path: "/student/progress",
      desc: "Long-term progress charts — domain levels over time, percentile",
      features: ["Domain level chart", "Percentile rank", "Test history", "Improvement delta"],
    },
    {
      name: "Leaderboard",
      path: "/student/leaderboard",
      desc: "Class and college leaderboard — anonymous percentile option",
      features: ["Class rank", "College rank", "Domain rank", "Weekly/monthly toggle"],
    },
    {
      name: "My Certificates",
      path: "/student/certificates",
      desc: "View and share earned certificates with QR verification",
      features: ["View certificate", "Download PDF", "QR code", "Share link"],
    },
    {
      name: "Profile",
      path: "/student/profile",
      desc: "Personal info, password reset, college link",
      features: ["Edit profile", "Change password", "College info", "Account merge request"],
    },
  ],
};

const dbTables = [
  { name: "users", cols: ["id", "name", "email", "role", "college_id", "created_at"], color: colors.accent },
  { name: "colleges", cols: ["id", "name", "code", "admin_id", "status"], color: colors.yellow },
  { name: "departments", cols: ["id", "college_id", "name", "course_type", "semester_count"], color: colors.blue },
  { name: "classes", cols: ["id", "dept_id", "year", "section", "sub_admin_id"], color: colors.green },
  { name: "student_college", cols: ["student_id", "college_id", "dept_id", "class_id", "semester"], color: "#a78bfa" },
  { name: "questions", cols: ["id", "domain", "difficulty", "text", "options[]", "answer", "explanation"], color: "#f472b6" },
  { name: "tests", cols: ["id", "student_id", "type", "class_id", "scheduled_at", "completed_at"], color: colors.yellow },
  { name: "test_attempts", cols: ["id", "test_id", "question_id", "answer", "is_correct", "time_ms"], color: colors.red },
  { name: "domain_progress", cols: ["id", "student_id", "domain", "level", "updated_at"], color: colors.green },
  { name: "proctoring_logs", cols: ["id", "test_id", "tab_switches", "face_detected", "audio_flag", "avg_time_ms"], color: colors.accent },
  { name: "scores", cols: ["id", "student_id", "test_id", "domain", "score", "percentile"], color: colors.blue },
  { name: "certificates", cols: ["id", "student_id", "issued_by", "qr_code", "issued_at", "revoked"], color: "#f472b6" },
];

const flows = [
  {
    title: "College Onboarding Flow",
    color: colors.yellow,
    steps: [
      "Super Admin creates college entry + college code",
      "College Admin receives credentials via email",
      "Admin logs in → creates Departments",
      "Admin creates Classes & Sections within each dept",
      "Admin assigns Sub-Admins (HODs) to departments",
      "Admin assigns Mentors to classes",
      "Admin downloads CSV template → fills student data",
      "Admin uploads CSV → system generates IDs + passwords",
      "System emails/exports credentials to admin",
      "Admin distributes credentials to students",
      "Students log in → reset passwords → ready",
    ],
  },
  {
    title: "Student Test Flow",
    color: colors.green,
    steps: [
      "Student logs in → sees Home dashboard",
      "Student clicks 'Take Test' → selects domain (or mixed)",
      "System checks domain_progress → sets difficulty level",
      "Checkpoint enforced: all domains must be within 1 level of each other",
      "Test starts → adaptive questions served from DB",
      "Timer per question (higher levels = tighter timer)",
      "Proctoring: tab switch, face detection, audio logged",
      "Student submits → system calculates score + updates domain_progress",
      "Results page: domain breakdown + explanations",
      "If score crosses threshold → certificate eligible",
    ],
  },
  {
    title: "Adaptive Difficulty Logic",
    color: colors.accent,
    steps: [
      "Student begins at Level 1 for each domain",
      "2 consecutive correct answers → bump to next level",
      "2 consecutive wrong answers → drop to previous level",
      "Level cap enforced by checkpoint (all domains balanced)",
      "At high levels → timer added (simulate UPSC/banking style)",
      "Center-based test score gets 2x weighting vs self-assessment",
      "Combined score = (self_avg × 0.4) + (center_avg × 0.6)",
      "Final grade: Below Avg / Average / Above Avg / Excellent",
    ],
  },
  {
    title: "Certificate Issuance Flow",
    color: "#f472b6",
    steps: [
      "Student completes required number of tests (self + center)",
      "System calculates weighted combined score",
      "If score ≥ threshold → marked 'Certificate Eligible'",
      "Mentor/Admin reviews and clicks 'Issue Certificate'",
      "System generates PDF with unique QR code",
      "QR links to public verification page with full test history",
      "Student can download PDF and share link",
      "Employer/institution scans QR → sees authentic score breakdown",
    ],
  },
];

const apiRoutes = [
  { method: "POST", path: "/api/auth/login", desc: "Login for all roles" },
  { method: "POST", path: "/api/colleges", desc: "Create college (Super Admin)" },
  { method: "POST", path: "/api/colleges/:id/upload-students", desc: "Bulk CSV student upload" },
  { method: "GET", path: "/api/colleges/:id/dashboard", desc: "College admin dashboard data" },
  { method: "POST", path: "/api/departments", desc: "Create department" },
  { method: "POST", path: "/api/classes", desc: "Create class/section" },
  { method: "GET", path: "/api/students/:id/progress", desc: "Student domain progress" },
  { method: "POST", path: "/api/tests/start", desc: "Start adaptive test session" },
  { method: "POST", path: "/api/tests/:id/submit", desc: "Submit test, get results" },
  { method: "GET", path: "/api/tests/:id/results", desc: "Full result breakdown" },
  { method: "GET", path: "/api/leaderboard/:classId", desc: "Class leaderboard" },
  { method: "POST", path: "/api/questions", desc: "Add question to bank" },
  { method: "GET", path: "/api/questions/adaptive", desc: "Fetch next adaptive question" },
  { method: "POST", path: "/api/proctor/log", desc: "Log proctoring event" },
  { method: "POST", path: "/api/certificates/issue", desc: "Issue certificate" },
  { method: "GET", path: "/api/certificates/verify/:qr", desc: "Public QR verification" },
  { method: "GET", path: "/api/reports/college/:id", desc: "Generate college report" },
];

export default function SystemDesign() {
  const [activeTab, setActiveTab] = useState("pages");
  const [activeRole, setActiveRole] = useState("Student");
  const [expandedFlow, setExpandedFlow] = useState(0);

  const tabs = [
    { id: "pages", label: "📄 Pages" },
    { id: "db", label: "🗄️ Database" },
    { id: "flows", label: "🔄 Flows" },
    { id: "api", label: "🔌 API Routes" },
    { id: "arch", label: "🏗️ Architecture" },
  ];

  return (
    <div style={{ background: colors.bg, minHeight: "100vh", fontFamily: "'IBM Plex Mono', monospace", color: colors.text, padding: "24px" }}>
      
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: colors.muted, letterSpacing: 4, marginBottom: 8 }}>APTITUDE PLATFORM</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "#fff" }}>System Design</h1>
        <div style={{ fontSize: 13, color: colors.muted, marginTop: 6 }}>Pages · Database · Flows · API · Architecture</div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: `1px solid ${activeTab === t.id ? colors.accent : colors.border}`,
              background: activeTab === t.id ? colors.accentSoft : "transparent",
              color: activeTab === t.id ? colors.accent : colors.muted,
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* PAGES TAB */}
      {activeTab === "pages" && (
        <div>
          {/* Role Selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {roles.map(r => (
              <button
                key={r}
                onClick={() => setActiveRole(r)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1px solid ${activeRole === r ? roleColors[r] : colors.border}`,
                  background: activeRole === r ? roleColors[r] + "22" : "transparent",
                  color: activeRole === r ? roleColors[r] : colors.muted,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "inherit",
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Role hierarchy indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24, overflowX: "auto", paddingBottom: 8 }}>
            {roles.map((r, i) => (
              <div key={r} style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  background: r === activeRole ? roleColors[r] + "33" : "transparent",
                  border: `1px solid ${r === activeRole ? roleColors[r] : colors.border}`,
                  fontSize: 11,
                  color: r === activeRole ? roleColors[r] : colors.muted,
                  whiteSpace: "nowrap",
                }}>
                  {r}
                </div>
                {i < roles.length - 1 && (
                  <div style={{ color: colors.border, fontSize: 12, padding: "0 4px" }}>→</div>
                )}
              </div>
            ))}
          </div>

          {/* Pages Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {(pages[activeRole] || []).map((page, i) => (
              <div key={i} style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                padding: 20,
                borderLeft: `3px solid ${roleColors[activeRole]}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{page.name}</div>
                  <div style={{ fontSize: 10, color: colors.muted, background: colors.surface, padding: "2px 8px", borderRadius: 4, marginLeft: 8, whiteSpace: "nowrap" }}>
                    {page.path}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: colors.muted, marginBottom: 14, lineHeight: 1.6 }}>{page.desc}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {page.features.map((f, j) => (
                    <span key={j} style={{
                      fontSize: 10,
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: roleColors[activeRole] + "15",
                      color: roleColors[activeRole],
                      border: `1px solid ${roleColors[activeRole]}30`,
                    }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Page count summary */}
          <div style={{ marginTop: 24, padding: 16, background: colors.surface, borderRadius: 8, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 11, color: colors.muted, marginBottom: 12 }}>TOTAL PAGES BREAKDOWN</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {roles.map(r => (
                <div key={r} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: roleColors[r] }} />
                  <span style={{ fontSize: 12, color: colors.muted }}>{r}</span>
                  <span style={{ fontSize: 12, color: roleColors[r], fontWeight: 600 }}>{pages[r]?.length} pages</span>
                </div>
              ))}
              <div style={{ fontSize: 12, color: colors.text, marginLeft: "auto" }}>
                Total: <span style={{ color: colors.accent, fontWeight: 700 }}>
                  {Object.values(pages).reduce((a, b) => a + b.length, 0)} pages
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DB TAB */}
      {activeTab === "db" && (
        <div>
          <div style={{ fontSize: 11, color: colors.muted, marginBottom: 20, letterSpacing: 2 }}>SUPABASE / POSTGRES SCHEMA — {dbTables.length} TABLES</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {dbTables.map((table, i) => (
              <div key={i} style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "12px 16px",
                  background: table.color + "18",
                  borderBottom: `1px solid ${table.color}30`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: table.color }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: table.color }}>{table.name}</span>
                </div>
                <div style={{ padding: "12px 16px" }}>
                  {table.cols.map((col, j) => (
                    <div key={j} style={{
                      fontSize: 11,
                      color: j === 0 ? colors.yellow : colors.muted,
                      padding: "3px 0",
                      borderBottom: j < table.cols.length - 1 ? `1px solid ${colors.border}` : "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}>
                      {j === 0 && <span style={{ color: colors.yellow, fontSize: 9 }}>PK</span>}
                      {col.includes("_id") && j > 0 && <span style={{ color: colors.blue, fontSize: 9 }}>FK</span>}
                      {col}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Key Relations */}
          <div style={{ marginTop: 24, padding: 20, background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 11, color: colors.muted, marginBottom: 16, letterSpacing: 2 }}>KEY RELATIONSHIPS</div>
            {[
              "users.college_id → colleges.id",
              "departments.college_id → colleges.id",
              "classes.dept_id → departments.id",
              "student_college.student_id → users.id",
              "questions.domain → [verbal, logical, quantitative, spatial]",
              "tests.student_id → users.id",
              "test_attempts.test_id → tests.id",
              "test_attempts.question_id → questions.id",
              "domain_progress.student_id → users.id",
              "proctoring_logs.test_id → tests.id",
              "certificates.student_id → users.id",
            ].map((rel, i) => (
              <div key={i} style={{ fontSize: 12, color: colors.muted, padding: "5px 0", borderBottom: `1px solid ${colors.border}`, fontFamily: "monospace" }}>
                <span style={{ color: colors.accent }}>{rel.split("→")[0]}</span>
                <span style={{ color: colors.border }}> → </span>
                <span style={{ color: colors.green }}>{rel.split("→")[1]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FLOWS TAB */}
      {activeTab === "flows" && (
        <div>
          {flows.map((flow, i) => (
            <div key={i} style={{ marginBottom: 16, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden" }}>
              <button
                onClick={() => setExpandedFlow(expandedFlow === i ? -1 : i)}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: flow.color }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{flow.title}</span>
                  <span style={{ fontSize: 11, color: colors.muted }}>{flow.steps.length} steps</span>
                </div>
                <span style={{ color: colors.muted, fontSize: 16 }}>{expandedFlow === i ? "−" : "+"}</span>
              </button>
              {expandedFlow === i && (
                <div style={{ padding: "0 20px 20px" }}>
                  {flow.steps.map((step, j) => (
                    <div key={j} style={{ display: "flex", gap: 16, marginBottom: 12, alignItems: "flex-start" }}>
                      <div style={{
                        minWidth: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: flow.color + "22",
                        border: `1px solid ${flow.color}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        color: flow.color,
                        fontWeight: 700,
                      }}>
                        {j + 1}
                      </div>
                      <div style={{ fontSize: 13, color: colors.muted, lineHeight: 1.7, paddingTop: 4 }}>{step}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* API TAB */}
      {activeTab === "api" && (
        <div>
          <div style={{ fontSize: 11, color: colors.muted, marginBottom: 20, letterSpacing: 2 }}>REST API ROUTES — {apiRoutes.length} ENDPOINTS</div>
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, overflow: "hidden" }}>
            {apiRoutes.map((route, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 20px",
                borderBottom: i < apiRoutes.length - 1 ? `1px solid ${colors.border}` : "none",
                flexWrap: "wrap",
              }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 4,
                  minWidth: 48,
                  textAlign: "center",
                  background: route.method === "GET" ? colors.green + "22" : route.method === "POST" ? colors.blue + "22" : colors.red + "22",
                  color: route.method === "GET" ? colors.green : route.method === "POST" ? colors.blue : colors.red,
                  border: `1px solid ${route.method === "GET" ? colors.green : route.method === "POST" ? colors.blue : colors.red}30`,
                }}>
                  {route.method}
                </span>
                <span style={{ fontSize: 12, color: colors.accent, fontFamily: "monospace", flex: 1, minWidth: 200 }}>{route.path}</span>
                <span style={{ fontSize: 12, color: colors.muted }}>{route.desc}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, padding: 16, background: colors.surface, borderRadius: 8, border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 11, color: colors.muted, marginBottom: 12, letterSpacing: 2 }}>MIDDLEWARE STACK</div>
            {[
              { name: "authMiddleware", desc: "Verifies Supabase JWT token on every protected route" },
              { name: "roleGuard(roles[])", desc: "Checks user role against allowed roles for the route" },
              { name: "collegeScope", desc: "Ensures admin/mentor only access their college's data" },
              { name: "rateLimiter", desc: "Prevents brute force on auth and test submission routes" },
              { name: "proctorLogger", desc: "Logs tab events, face detection results to proctoring_logs" },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 16, padding: "8px 0", borderBottom: i < 4 ? `1px solid ${colors.border}` : "none" }}>
                <span style={{ fontSize: 12, color: colors.yellow, fontFamily: "monospace", minWidth: 180 }}>{m.name}</span>
                <span style={{ fontSize: 12, color: colors.muted }}>{m.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ARCHITECTURE TAB */}
      {activeTab === "arch" && (
        <div>
          {/* Stack */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
            {[
              { layer: "Frontend", tech: "Next.js 14 (App Router)", detail: "SSR + client components", color: colors.blue },
              { layer: "Styling", tech: "Tailwind CSS + shadcn/ui", detail: "Utility-first + component lib", color: colors.accent },
              { layer: "Backend", tech: "Next.js API Routes", detail: "No separate Express needed", color: colors.green },
              { layer: "Database", tech: "Supabase (Postgres)", detail: "Managed, free tier, RLS", color: "#10b981" },
              { layer: "Auth", tech: "Supabase Auth", detail: "JWT + role claims", color: colors.yellow },
              { layer: "AI (MVP)", tech: "Google Gemini API", detail: "Free tier, question gen", color: "#f472b6" },
              { layer: "AI (v2)", tech: "OpenAI GPT-4o-mini", detail: "After first revenue", color: "#f97316" },
              { layer: "Hosting", tech: "Vercel", detail: "Auto-deploy from GitHub", color: colors.accent },
              { layer: "File Storage", tech: "Supabase Storage", detail: "CSV uploads, PDFs", color: "#10b981" },
              { layer: "Charts", tech: "Recharts", detail: "Analytics visualizations", color: colors.blue },
            ].map((item, i) => (
              <div key={i} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16, borderTop: `3px solid ${item.color}` }}>
                <div style={{ fontSize: 10, color: colors.muted, marginBottom: 6, letterSpacing: 2 }}>{item.layer}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: item.color, marginBottom: 4 }}>{item.tech}</div>
                <div style={{ fontSize: 11, color: colors.muted }}>{item.detail}</div>
              </div>
            ))}
          </div>

          {/* Folder Structure */}
          <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: colors.muted, marginBottom: 16, letterSpacing: 2 }}>FOLDER STRUCTURE</div>
            <pre style={{ fontSize: 12, color: colors.muted, lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap" }}>
{`/app
  /api
    /auth/route.js          ← login/logout
    /colleges/route.js      ← CRUD colleges
    /students/upload/route.js ← CSV bulk upload
    /tests/route.js         ← start/submit test
    /questions/route.js     ← question bank
    /proctor/route.js       ← log proctoring events
    /certificates/route.js  ← issue/verify certs
    /reports/route.js       ← export reports

  /(auth)
    /login/page.jsx
    /signup/page.jsx

  /(super)                  ← Super Admin pages
    /dashboard/page.jsx
    /colleges/page.jsx
    /analytics/page.jsx
    /settings/page.jsx

  /(admin)                  ← College Admin pages
    /dashboard/page.jsx
    /departments/page.jsx
    /classes/page.jsx
    /students/upload/page.jsx
    /mentors/page.jsx
    /reports/page.jsx

  /(subadmin)               ← Sub Admin pages
    /dashboard/page.jsx
    /classes/page.jsx
    /reports/page.jsx

  /(mentor)                 ← Mentor pages
    /dashboard/page.jsx
    /proctor/page.jsx
    /students/page.jsx
    /questions/page.jsx
    /assessments/page.jsx
    /certificates/page.jsx

  /(student)                ← Student pages
    /home/page.jsx
    /test/page.jsx
    /results/[id]/page.jsx
    /progress/page.jsx
    /leaderboard/page.jsx
    /certificates/page.jsx
    /profile/page.jsx

/components
  /ui/                      ← shadcn components
  /charts/                  ← recharts wrappers
  /test/                    ← MCQ, timer, proctoring
  /admin/                   ← admin-specific components

/lib
  /supabase.js              ← DB client
  /auth.js                  ← auth helpers + role utils
  /adaptive.js              ← difficulty algorithm
  /proctor.js               ← tab/face detection logic
  /reports.js               ← PDF generation

/middleware.js              ← route protection by role`}
            </pre>
          </div>

          {/* Security Notes */}
          <div style={{ padding: 20, background: colors.surface, borderRadius: 10, border: `1px solid ${colors.red}30` }}>
            <div style={{ fontSize: 11, color: colors.red, marginBottom: 16, letterSpacing: 2 }}>SECURITY CHECKLIST</div>
            {[
              ["Supabase RLS", "Row Level Security on all tables — users only see their college's data"],
              ["Role Claims", "JWT contains role + college_id — validated server-side on every request"],
              ["Cheat Detection", "Time per question logged — sub-8s average flagged automatically"],
              ["Center Test Weight", "Center-based scores weighted 60% — reduces online cheating impact"],
              ["Rate Limiting", "Auth endpoints rate limited — prevent brute force attacks"],
              ["CSV Validation", "Bulk uploads validated server-side — no malicious data injection"],
              ["QR Cert Verification", "Public verify page reads from DB — certificates cannot be faked"],
            ].map(([title, desc], i) => (
              <div key={i} style={{ display: "flex", gap: 16, padding: "8px 0", borderBottom: i < 6 ? `1px solid ${colors.border}` : "none" }}>
                <span style={{ fontSize: 12, color: colors.red, minWidth: 160 }}>✓ {title}</span>
                <span style={{ fontSize: 12, color: colors.muted }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${colors.border}`, fontSize: 11, color: colors.muted, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span>Aptitude Platform · System Design v1.0</span>
        <span>{Object.values(pages).reduce((a, b) => a + b.length, 0)} pages · {dbTables.length} tables · {apiRoutes.length} endpoints · {flows.length} flows</span>
      </div>
    </div>
  );
}
