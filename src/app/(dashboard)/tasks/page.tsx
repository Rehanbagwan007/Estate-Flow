import { createClient } from '@/lib/supabase/server';
import { TasksClient } from './client';
import { redirect } from 'next/navigation';
import type { Profile } from '@/lib/types';

async function getTasksForUser(userId: string, userRole: Profile['role']) {
    const supabase = createClient();
    
    let query = supabase.from('tasks').select('*, customer:related_customer_id(*), task_media(*)');

    if (userRole === 'super_admin' || userRole === 'admin' || userRole === 'sales_manager') {
        // Managers see their own tasks and their team's tasks
        const { data: team } = await supabase.from('profiles').select('id').in('role', ['sales_executive_1', 'sales_executive_2', 'agent']);
        const teamIds = team?.map(t => t.id) || [];
        query = query.in('assigned_to', [userId, ...teamIds]);
    } else {
        // Regular users see only tasks assigned to them
        query = query.eq('assigned_to', userId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching tasks:", error.message);
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

    const tasks = await getTasksForUser(user.id, profile.role);
    
    return <TasksClient initialTasks={tasks} userRole={profile.role} userId={user.id} />;
}
