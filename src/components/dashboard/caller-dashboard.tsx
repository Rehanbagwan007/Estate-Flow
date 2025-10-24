import { createClient } from '@/lib/supabase/server';
import { ExotelCallInterface } from '../calls/exotel-call-interface';

interface CallerDashboardProps {
  userId: string;
}

export async function CallerDashboard({ userId }: CallerDashboardProps) {
  const supabase = createClient();

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', userId)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {userProfile?.first_name}!</h1>
        <p className="text-muted-foreground">
          Here's your call center dashboard for today.
        </p>
      </div>

      <ExotelCallInterface agentId={userId} />
      
    </div>
  );
}
