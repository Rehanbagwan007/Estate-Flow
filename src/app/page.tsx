import { redirect } from 'next/navigation';

// The root page is now just a redirect to the login page.
// The middleware will handle redirecting to the dashboard if the user is already logged in.
export default function RootPage() {
  redirect('/login');
}
