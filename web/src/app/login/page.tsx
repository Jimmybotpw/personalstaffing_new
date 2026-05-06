import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Personal Staffing</p>
        <h1>Login foundation for the rebuild</h1>
        <p>
          This is the first auth placeholder. The final version will use a proper
          user database, password hashing, and gym-scoped sessions.
        </p>
        <form action={loginAction}>
          <button className="button-primary" type="submit">Enter demo workspace</button>
        </form>
      </section>
    </main>
  );
}
