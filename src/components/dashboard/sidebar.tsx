'use client';

import Link from 'next/link';
import {
  Home,
  Users,
  Building2,
  ListTodo,
  BarChart3,
  Users2,
  Phone,
  Settings,
  Heart,
  Calendar,
  Target,
  Award,
  Building,
  UserCheck,
  Bell
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
    // Common items
    { href: '/', label: 'Dashboard', icon: Home, roles: ['super_admin', 'admin', 'agent', 'caller_1', 'caller_2', 'sales_manager', 'sales_executive_1', 'sales_executive_2', 'customer'] },
    
    // Super Admin & Admin
    { href: '/admin/users', label: 'User Management', icon: UserCheck, roles: ['super_admin', 'admin'] },
    { href: '/admin/approvals', label: 'Pending Approvals', icon: Bell, roles: ['super_admin', 'admin'] },
    { href: '/admin/assignments', label: 'Agent Assignments', icon: Target, roles: ['super_admin', 'admin'] },
    { href: '/admin/call-recordings', label: 'Call Recordings', icon: Phone, roles: ['super_admin', 'admin'] },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, roles: ['super_admin', 'admin'] },
    { href: '/admin/settings', label: 'Settings', icon: Settings, roles: ['super_admin', 'admin'] },
    
    // Properties (Admin, Agent, Customer)
    { href: '/properties', label: 'Properties', icon: Building2, roles: ['super_admin', 'admin', 'agent', 'customer'] },
    { href: '/properties/new', label: 'Add Property', icon: Building, roles: ['super_admin', 'admin', 'agent'] },
    
    // Leads (Admin, Agent, Sales roles)
    { href: '/leads', label: 'Leads', icon: Users, roles: ['super_admin', 'admin', 'agent', 'sales_manager', 'sales_executive_1', 'sales_executive_2'] },
    { href: '/leads/new', label: 'Add Lead', icon: Users2, roles: ['super_admin', 'admin', 'agent'] },
    
    // Tasks (Admin, Agent, Sales roles)
    { href: '/tasks', label: 'Tasks', icon: ListTodo, roles: ['super_admin', 'admin', 'agent', 'sales_manager', 'sales_executive_1', 'sales_executive_2'] },
    
    // Calls (Caller roles, Admin, Agent)
    { href: '/calls', label: 'Call Center', icon: Phone, roles: ['super_admin', 'admin', 'caller_1', 'caller_2', 'agent'] },
    { href: '/calls/history', label: 'Call History', icon: Phone, roles: ['super_admin', 'admin', 'caller_1', 'caller_2', 'agent'] },
    
    // Sales Management
    { href: '/sales/team', label: 'Sales Team', icon: Award, roles: ['super_admin', 'admin', 'sales_manager'] },
    { href: '/sales/performance', label: 'Performance', icon: BarChart3, roles: ['super_admin', 'admin', 'sales_manager', 'sales_executive_1', 'sales_executive_2'] },
    
    // Customer specific
    { href: '/my-interests', label: 'My Interests', icon: Heart, roles: ['customer'] },
    { href: '/my-appointments', label: 'My Appointments', icon: Calendar, roles: ['customer'] },
    
    // Agent specific
    { href: '/agent/assignments', label: 'My Assignments', icon: Target, roles: ['agent', 'sales_executive_1', 'sales_executive_2'] },
    { href: '/agent/customers', label: 'My Customers', icon: Users, roles: ['agent', 'sales_executive_1', 'sales_executive_2'] },
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
