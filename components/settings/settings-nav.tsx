"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOptionalCurrentProfile } from "@/components/app/current-user-context";
import { canManageTeams, canManageUsers } from "@/lib/permissions";
import { cn } from "@/lib/cn";
import { uiFocusRingInset, uiTransition } from "@/lib/ui-classes";

type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
};

function isGeneralSettings(path: string): boolean {
  return path === "/app/settings";
}

export function SettingsNav() {
  const pathname = usePathname() ?? "";
  const me = useOptionalCurrentProfile();
  const role = me?.role ?? "operator";

  const items: NavItem[] = [
    {
      href: "/app/settings",
      label: "Generale",
      match: isGeneralSettings,
    },
  ];

  if (canManageUsers(role)) {
    items.push({
      href: "/app/settings/users",
      label: "Utenti",
      match: (path) => path === "/app/settings/users",
    });
  }

  if (canManageTeams(role)) {
    items.push({
      href: "/app/settings/teams",
      label: "Team",
      match: (path) => path === "/app/settings/teams",
    });
  }

  return (
    <nav
      aria-label="Sezioni impostazioni"
      className="border-b border-line-default"
    >
      <ul className="flex flex-wrap gap-1 pb-2.5">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  uiTransition,
                  uiFocusRingInset,
                  "inline-flex rounded-md px-3 py-1.5 text-sm font-medium",
                  active
                    ? "bg-elevated text-fg-primary"
                    : "text-fg-secondary hover:bg-elevated/70 hover:text-fg-primary",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
