import { createClient } from '@/lib/supabase/server';
import { TasksClient } from './client';
import { cookies } from 'next/headers';

async function getTasks() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) {
        console.error("Error fetching tasks:", error.message);
        return [];
    }
    return data;
}

export default async function TasksPage() {
  const tasks = await getTasks();
  return <TasksClient initialTasks={tasks} />;
}
