import { redirect } from 'next/navigation';

// The middleware now handles routing, so this page can simply redirect
// to the most logical starting point.
export default async function RootPage() {
  redirect('/dashboard');
}
