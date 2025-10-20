import { createClient } from '@/lib/supabase/server';
import { TasksClient } from './client';

async function getTasks() {
    const supabase = createClient();
    const { data, error } = await (await supabase).from('tasks').select('*');
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
