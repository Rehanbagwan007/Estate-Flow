
import { redirect } from 'next/navigation';

export default function RootPage() {
  // The middleware will handle authentication.
  // This page simply redirects to the primary dashboard view.
  redirect('/dashboard');
}
