import { redirect } from 'next/navigation';

export default function RootPage() {
  // The middleware ensures the user is logged in and will redirect to /login if not.
  // We can safely redirect to the main dashboard route.
  redirect('/dashboard');
}
