const cards = [
  {
    title: "Secure multi-user foundation",
    text: "Each customer should manage their own gym, team, and planning data in a separated workspace.",
  },
  {
    title: "Constraint-driven planning",
    text: "Employees, areas, hours, qualifications, vacations, and shift rules should all feed into the scheduling engine.",
  },
  {
    title: "Docker-first deployment",
    text: "The app should run cleanly on a server with a reproducible Docker-based setup.",
  },
];

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Personal Staffing Rebuild</p>
        <h1>Clean web foundation for the staffing planner</h1>
        <p className="lead">
          This is the new application direction: secure login, gym-based workspaces,
          constraint-aware planning, and a deployable Docker setup.
        </p>
      </section>

      <section className="grid">
        {cards.map((card) => (
          <article key={card.title} className="card">
            <h2>{card.title}</h2>
            <p>{card.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
