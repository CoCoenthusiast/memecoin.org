import { Resend } from "resend";

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const resend = getResendClient();
  const verifyUrl = `${getAppUrl()}/verify-email?token=${token}`;

  await resend.emails.send({
    from: "degenscult <noreply@degenscult.com>",
    to: email,
    subject: "Verify your email - degenscult",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Welcome to degenscult!</h2>
        <p style="color: #4a4a6a; line-height: 1.6; margin-bottom: 24px;">
          Thanks for creating your account. Please verify your email address by clicking the button below:
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background: #00ff88; color: #1a1a2e; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 24px;">
          Verify Email
        </a>
        <p style="color: #888; font-size: 13px; line-height: 1.5;">
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resend = getResendClient();
  const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;

  await resend.emails.send({
    from: "degenscult <noreply@degenscult.com>",
    to: email,
    subject: "Reset your password - degenscult",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Password Reset</h2>
        <p style="color: #4a4a6a; line-height: 1.6; margin-bottom: 24px;">
          You requested a password reset. Click the button below to set a new password:
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #00ff88; color: #1a1a2e; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-bottom: 24px;">
          Reset Password
        </a>
        <p style="color: #888; font-size: 13px; line-height: 1.5;">
          This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
