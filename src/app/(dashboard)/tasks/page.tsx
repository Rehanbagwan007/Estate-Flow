
import { createClient } from '@/lib/supabase/server';
import { TasksClient } from './client';
import { redirect } from 'next/navigation';
import type { Profile } from '@/lib/types';

async function getTasksForUser(userId: string, userRole: Profile['role']) {
    const supabase = createClient();
    
    // Corrected query: ALL users should only see tasks assigned directly to them.
    // A separate "Team Tasks" view would be needed for managers to see subordinate tasks,
    // but the current page should respect direct assignment.
    const { data, error } = await supabase
        .from('tasks')
        .select('*, customer:related_customer_id(*), task_media(*), property:related_property_id(*)')
        .eq('assigned_to', userId)
        .order('created_at', { ascending: false });

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
