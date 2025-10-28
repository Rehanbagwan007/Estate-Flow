
'use client';

import Link from 'next/link';
import {
  Home,
  Users,
  Building2,
  ListTodo,
  Menu,
  Search,
  Award,
  Building,
  Heart,
  UserCheck,
  Settings,
  FileText,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/icons/logo';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import type { User } from '@supabase/supabase-js';
import type { Profile, UserRole } from '@/lib/types';
import { logout } from '@/lib/actions';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface HeaderProps {
  user: User | null;
  profile: Profile | null;
}

export function Header({ user, profile }: HeaderProps) {
  const pathname = usePathname();

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
    { href: '/leads', label: 'Leads', icon: Users, roles: ['super_admin', 'admin', 'agent', 'sales_manager', 'sales_executive_1', 'sales_executive_2']},
    
    // Tasks (Admin, Agent, Sales roles)
    { href: '/tasks', label: 'Tasks', icon: ListTodo, roles: ['super_admin', 'admin', 'agent', 'sales_manager', 'sales_executive_1', 'sales_executive_2'] },
    { href: '/tasks/new', label: 'New Task', icon: PlusCircle, roles: ['super_admin', 'admin', 'sales_manager'] },
        
    // Sales Management
    { href: '/sales/team', label: 'Sales Team', icon: Award, roles: ['super_admin', 'admin', 'sales_manager'] },
    
    // Customer specific
    { href: '/my-interests', label: 'My Interests', icon: Heart, roles: ['customer'] },
  ];

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };
  
  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-semibold mb-4"
            >
              <Logo className="h-6 w-6 text-primary" />
              <span>EstateFlow</span>
            </Link>
            {profile && navItems
              .filter(item => item.roles.includes(profile.role))
              .map(({ href, label, icon: Icon, badge }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                  isActive(href) && "bg-muted text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
                {badge !== undefined && badge > 0 && (
                     <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                       {badge}
                     </Badge>
                  )}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        <form>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search properties, leads..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
            />
          </div>
        </form>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar>
               <AvatarImage src={`https://i.pravatar.cc/150?u=${user?.id}`} />
              <AvatarFallback>
                {getInitials(profile?.first_name ?? '', profile?.last_name ?? '')}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action={logout}>
              <button type="submit" className="w-full text-left">
                Logout
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
