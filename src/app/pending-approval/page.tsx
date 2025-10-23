import { redirect } from 'next/navigation';

export default function PendingApprovalPage() {
  // This page is no longer used and is pending deletion.
  // All users are approved by default when created by an admin.
  return redirect('/dashboard');
}
