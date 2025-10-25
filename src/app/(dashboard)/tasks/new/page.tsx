import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";
import { CreateTaskForm } from './create-task-form';
import type { Profile } from '@/lib/types';

async function getTeamMembers(): Promise<Profile[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, role');
    if (error) {
        console.error("Error fetching team members:", error);
        return [];
    }
    return data;
}


export default async function NewTaskPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  
  if (!profile || !['super_admin', 'admin', 'sales_manager'].includes(profile.role)) {
    return redirect('/dashboard');
  }

  const teamMembers = await getTeamMembers();

  return (
    <div className="space-y-6">
       <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/tasks">Tasks</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Task</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <CreateTaskForm teamMembers={teamMembers} />
    </div>
  );
}
