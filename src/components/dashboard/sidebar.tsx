'use client';

import Link from 'next/link';
import {
  Home,
  Users,
  Building2,
  ListTodo,
  BarChart3,
  Users2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/icons/logo';
import type { UserRole } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole: UserRole;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home, roles: ['admin', 'agent'] },
    { href: '/properties', label: 'Properties', icon: Building2, roles: ['admin', 'agent'] },
    { href: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'agent'] },
    { href: '/tasks', label: 'Tasks', icon: ListTodo, roles: ['admin', 'agent'] },
    { href: '/agents', label: 'Agents', icon: Users2, roles: ['admin'] },
    { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
  ];

  const isActive = (href: string) => {
    return href === '/' ? pathname === href : pathname.startsWith(href);
  };

  return (
    <div className="hidden border-r bg-card md:block sticky">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo className="h-6 w-6 text-primary" />
            <span className="">EstateFlow</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems
              .filter(item => item.roles.includes(userRole))
              .map(({ href, label, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    isActive(href) && 'bg-muted text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {label === 'Leads' && (
                     <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                       6
                     </Badge>
                  )}
                </Link>
              ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
