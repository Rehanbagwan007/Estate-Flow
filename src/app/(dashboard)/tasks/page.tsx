
import { createClient } from '@/lib/supabase/server';
import { TasksClient } from './client';
import { redirect } from 'next/navigation';
import type { Profile } from '@/lib/types';

async function getTasks(userId: string, userRole: Profile['role']) {
    const supabase = createClient();
    let query = supabase
        .from('tasks')
        .select('*, customer:related_customer_id(*), property:related_property_id(*), assigned_to_profile:assigned_to(*)');

    // Managers/Admins see all tasks; others see only their own.
    if (!['super_admin', 'admin', 'sales_manager'].includes(userRole)) {
        query = query.eq('assigned_to', userId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching tasks:", error.message);
        return [];
    }
    return data;
}

async function getTeamMembers(): Promise<Profile[]> {
    const supabase = createClient();
    // Fetch users who can be assigned tasks
    const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .in('role', ['agent', 'sales_executive_1', 'sales_executive_2', 'caller_1', 'caller_2', 'sales_manager', 'admin']);
    
    if (error) {
        console.error("Error fetching team members for tasks:", error);
        return [];
    }
    return data;
}


export default async function TasksPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    
    if (!profile) {
        return redirect('/login');
    }

    const tasks = await getTasks(user.id, profile.role);
    const teamMembers = await getTeamMembers();
    
    return <TasksClient 
                initialTasks={tasks} 
                userRole={profile.role} 
                userId={user.id} 
                teamMembers={teamMembers}
            />;
}
