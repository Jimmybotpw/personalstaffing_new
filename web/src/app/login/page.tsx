import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const error = params.error;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Personal Staffing</p>
        <h1>Sign in to your workspace</h1>
        <p>
          First real auth step for the rebuild: database-backed user lookup, hashed passwords, and
          gym-scoped sessions.
        </p>
        <form action={loginAction} className="form-grid auth-form">
          <label>
            <span>Email</span>
            <input name="email" type="email" defaultValue="owner@example.com" required />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password" defaultValue="demo1234" required />
          </label>
          {error ? <p className="error-text">Invalid login. Please try again.</p> : null}
          <button className="button-primary" type="submit">Sign in</button>
        </form>
      </section>
    </main>
  );
}
