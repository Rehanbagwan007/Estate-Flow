// This file is intentionally left blank. The public signup page has been removed.
// All users are created by an administrator.
import { redirect } from 'next/navigation';

export default function SignupPage() {
  redirect('/login');
}
