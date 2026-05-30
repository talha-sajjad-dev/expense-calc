/** Map Supabase auth errors to clearer user-facing messages. */
export function authErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("email rate limit")) {
    return "Too many signup attempts. Wait about an hour, or disable “Confirm email” in Supabase → Authentication → Providers → Email for local testing.";
  }

  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "This email is already registered. Try logging in instead.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }

  if (lower.includes("email not confirmed")) {
    return "Check your inbox to confirm your email before logging in.";
  }

  return message;
}
