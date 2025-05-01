import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Building2,
  Wallet,
  Settings,
  BarChart3,
  PiggyBank,
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: BarChart3,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Stokvela Groups",
    href: "/admin/stokvela-groups",
    icon: Building2,
  },
  {
    title: "Investments",
    href: "/admin/investments",
    icon: PiggyBank,
  },
  {
    title: "Transactions",
    href: "/admin/transactions",
    icon: Wallet,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-800/50 hover:text-white",
            pathname === item.href
              ? "bg-gray-800/50 text-white"
              : "text-gray-400"
          )}
        >
          <item.icon className="mr-2 h-4 w-4" />
          <span>{item.title}</span>
        </Link>
      ))}
    </nav>
  );
} 