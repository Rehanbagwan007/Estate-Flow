import { redirect } from 'next/navigation';

export default function SignupPage() {
  // Public signup is disabled. Users are created by admins.
  // Redirect any direct access attempts to the login page.
  redirect('/login');
}
