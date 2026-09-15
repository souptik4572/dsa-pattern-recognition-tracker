import "server-only";

type Email = { to: string; subject: string; text: string };

/**
 * No email provider is wired up yet. In development the message is printed to
 * the server console so flows like password reset can be exercised locally.
 * Replace the body with your provider's SDK (Resend, SES, Postmark, ...) before
 * relying on email in production.
 */
export async function sendEmail({ to, subject, text }: Email): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    console.warn(`[email] No provider configured; dropped "${subject}" for ${to}.`);
    return;
  }
  console.info(`\n[email] To: ${to}\n[email] Subject: ${subject}\n${text}\n`);
}
