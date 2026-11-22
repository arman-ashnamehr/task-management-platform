import Link from "next/link";

import { UserMenu } from "@/features/auth/components/user-menu";
import { AppMobileNavigation } from "./app-mobile-navigation";

export type AppHeaderUser = {
  name: string;
  email: string;
};

type AppHeaderProps = {
  user: AppHeaderUser;
};

// This remains a Server Component.
// It can render Client Components without becoming one.
export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4 md:px-6">
      <div className="flex items-center gap-3">
        <AppMobileNavigation />

        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          TaskFlow
        </Link>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden text-sm text-slate-400 sm:block">
          Application Workspace
        </div>

        <UserMenu user={user} />
      </div>
    </header>
  );
}
