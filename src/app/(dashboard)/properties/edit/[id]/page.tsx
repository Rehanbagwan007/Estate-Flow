
import { PropertyForm } from "@/components/properties/property-form";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: {user} } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['super_admin', 'admin', 'agent'].includes(profile.role)) redirect('/dashboard');
  
  const { data: property, error } = await supabase
    .from('properties')
    .select('*, property_media(*)')
    .eq('id', params.id)
    .single();

  if (error || !property) {
    console.error("Failed to fetch property for editing:", error);
    redirect('/properties');
  }
  
  return (
    <div className="space-y-6">
       <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/properties">Properties</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
           <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/properties/${property.id}`}>{property.title}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PropertyForm property={property as Property} />
    </div>
  );
}
