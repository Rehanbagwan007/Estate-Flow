import { redirect } from 'next/navigation';

export default function RootPage() {
  // Always redirect from the root to the dashboard.
  // The dashboard layout will handle authentication.
  return redirect('/dashboard');
}
