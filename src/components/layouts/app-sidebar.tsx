import { AppNavLink } from "./app-nav-link";

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-800 p-6 md:block">
      <nav aria-label="Application navigation" className="space-y-4 text-sm">
        <AppNavLink href="/dashboard">Dashboard</AppNavLink>
      </nav>
    </aside>
  );
}
