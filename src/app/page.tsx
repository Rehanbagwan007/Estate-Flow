import DashboardPage from "@/app/(dashboard)/dashboard/page";

export default function RootPage() {
  // Directly render the dashboard page content to avoid a client-side redirect.
  return <DashboardPage />;
}
