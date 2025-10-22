
import { redirect } from 'next/navigation';

export default async function RootPage() {
  // Always redirect from the root to the dashboard.
  // The dashboard layout and middleware will handle authentication.
  redirect('/dashboard');
}
