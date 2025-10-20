'use client';

import Link from 'next/link';
import {
  Home,
  Users,
  Building2,
  ListTodo,
  Menu,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import type { Profile } from '@/lib/types';
import { logout } from '@/lib/actions';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface HeaderProps {
  user: User | null;
  profile: Profile | null;
}

export function Header({ user, profile }: HeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home, roles: ['admin', 'agent'] },
    { href: '/properties', label: 'Properties', icon: Building2, roles: ['admin', 'agent'] },
    { href: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'agent'] },
    { href: '/tasks', label: 'Tasks', icon: ListTodo, roles: ['admin', 'agent'] },
  ];

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };
  
  const isActive = (href: string) => {
    return href === '/' ? pathname === href : pathname.startsWith(href);
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
            {navItems.map(({ href, label, icon: Icon }) => (
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
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action={logout} className="w-full">
              <button type="submit" className="w-full text-left">
                <Link href="/login" className="w-full">
                Logout
                </Link>
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
