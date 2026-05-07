import Link from "next/link";

const links = [
  { href: "/app", label: "Overview" },
  { href: "/app/employees", label: "Employees" },
  { href: "/app/areas", label: "Areas" },
  { href: "/app/constraints", label: "Constraints" },
  { href: "/app/schedules", label: "Schedules" },
];

export function AppNav() {
  return (
    <nav className="app-nav" aria-label="Application navigation">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="nav-link">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
