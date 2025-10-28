
'use client';

import Link from 'next/link';
import {
  Home,
  Users,
  Building2,
  ListTodo,
  Award,
  Building,
  UserCheck,
  Settings,
  Heart,
  FileText,
  PlusCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/icons/logo';
import type { UserRole } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLeadStore } from '@/lib/store/lead-store';

interface SidebarProps {
  userRole: UserRole;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const leads = useLeadStore((state) => state.leads);
  const pendingLeadsCount = leads.filter(lead => lead.status === 'Warm').length;

  const navItems = [
    // Common items
    { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['super_admin', 'admin', 'agent', 'caller_1', 'caller_2', 'sales_manager', 'sales_executive_1', 'sales_executive_2', 'customer'] },
    { href: '/job-reports', label: 'Job Reports', icon: FileText, roles: ['super_admin', 'admin', 'agent', 'caller_1', 'caller_2', 'sales_manager', 'sales_executive_1', 'sales_executive_2'] },
    
    // Super Admin & Admin
    { href: '/admin/users', label: 'User Management', icon: UserCheck, roles: ['super_admin', 'admin'] },
    { href: '/admin/settings', label: 'Settings', icon: Settings, roles: ['super_admin', 'admin'] },
    
    // Properties (Admin, Agent)
    { href: '/properties', label: 'Properties', icon: Building2, roles: ['super_admin', 'admin', 'agent'] },
    { href: '/properties/new', label: 'Add Property', icon: Building, roles: ['super_admin', 'admin', 'agent'] },
    
    // Leads (Admin, Agent, Sales roles)
    { href: '/leads', label: 'Leads', icon: Users, roles: ['super_admin', 'admin', 'agent', 'sales_manager', 'sales_executive_1', 'sales_executive_2'], badge: pendingLeadsCount },
    
    // Tasks (Admin, Agent, Sales roles)
    { href: '/tasks', label: 'Tasks', icon: ListTodo, roles: ['super_admin', 'admin', 'agent', 'sales_manager', 'sales_executive_1', 'sales_executive_2'] },
    { href: '/tasks/new', label: 'New Task', icon: PlusCircle, roles: ['super_admin', 'admin', 'sales_manager'] },
        
    // Sales Management
    { href: '/sales/team', label: 'Sales Team', icon: Award, roles: ['super_admin', 'admin', 'sales_manager'] },
    
    // Customer specific
    { href: '/my-interests', label: 'My Interests', icon: Heart, roles: ['customer'] },
  ];

  const isActive = (href: string) => {
    // Exact match for dashboard, startsWith for others
    if (href === '/dashboard' || href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="hidden border-r bg-card md:block">
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
              .map(({ href, label, icon: Icon, badge }) => (
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
                  {badge !== undefined && badge > 0 && (
                     <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                       {badge}
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
