import { redirect } from 'next/navigation';

export default function RootPage() {
  // The middleware ensures the user is logged in.
  // We redirect to the main dashboard route, which is inside the (dashboard)
  // layout group, ensuring the sidebar and header are always present.
  redirect('/dashboard');
}
