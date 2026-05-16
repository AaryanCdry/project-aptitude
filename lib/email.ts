import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Use your verified Resend domain in production.
// During development, Resend allows sending to your own email via onboarding@resend.dev.
const FROM = 'AptitudePro <onboarding@resend.dev>';

export interface EnrollmentEmailPayload {
  to: string;
  studentName: string;
  cohortName?: string;
  collegeName?: string;
  passwordSetupLink: string;
  tempPassword: string;
}

export async function sendEnrollmentEmail(payload: EnrollmentEmailPayload) {
  const { to, studentName, cohortName, collegeName, passwordSetupLink, tempPassword } = payload;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to AptitudePro</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; }
    .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .header { background: #3525cd; padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.75); font-size: 14px; }
    .body { padding: 40px; }
    .body p { margin: 0 0 16px; color: #3f3f46; font-size: 15px; line-height: 1.6; }
    .cohort-badge { display: inline-block; background: #ede9fe; color: #3525cd; font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 24px; }
    .cta-btn { display: block; background: #3525cd; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; text-align: center; padding: 14px 24px; border-radius: 8px; margin: 24px 0; }
    .credentials { background: #f8fafc; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px 20px; margin: 24px 0; }
    .credentials p { margin: 0 0 4px; font-size: 13px; color: #71717a; }
    .credentials code { font-family: 'Courier New', monospace; font-size: 15px; color: #18181b; font-weight: 600; }
    .divider { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
    .footer { padding: 24px 40px; text-align: center; }
    .footer p { margin: 0; font-size: 12px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>AptitudePro</h1>
        <p>Adaptive Aptitude Training Platform</p>
      </div>
      <div class="body">
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>You've been enrolled${collegeName ? ` by <strong>${collegeName}</strong>` : ''} and your account is ready.</p>
        ${cohortName ? `<span class="cohort-badge">📚 Cohort: ${cohortName}</span>` : ''}
        <p>Click the button below to set your password and access your dashboard:</p>
        <a class="cta-btn" href="${passwordSetupLink}">Set My Password & Get Started →</a>
        <p style="font-size:13px;color:#71717a;">Button not working? Copy this link into your browser:<br/>
          <a href="${passwordSetupLink}" style="color:#3525cd;word-break:break-all;">${passwordSetupLink}</a>
        </p>
        <div class="credentials">
          <p>Your temporary password (if login is needed before setting a new one):</p>
          <code>${tempPassword}</code>
        </div>
        <hr class="divider" />
        <p style="font-size:13px;color:#71717a;">
          Once inside, you'll see your assigned assessments and learning path.
          If you have any questions, contact your college administrator.
        </p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} AptitudePro · This email was sent because an admin enrolled you.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `You've been enrolled in AptitudePro${cohortName ? ` — ${cohortName}` : ''}`,
    html,
  });

  if (error) throw new Error(`Failed to send enrollment email: ${error.message}`);
  return data;
}
