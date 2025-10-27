
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
    DollarSign, 
    Bed, 
    Bath, 
    Square, 
    MapPin,
    Edit,
    Trash2,
    Share2
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";
import Image from "next/image";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { SocialSharesList } from "./social-shares-list";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { deleteProperty } from "../actions";

async function getPropertyData(id: string) {
    const supabase = createClient();
    const { data: property, error } = await supabase
        .from('properties')
        .select('*, property_media(*), property_shares(*)')
        .eq('id', id)
        .single();

    if (error) {
        console.error("Error fetching property details:", error);
        return null;
    }
    return property;
}


export default async function PropertyDetailsPage({ params }: { params: { id: string } }) {
    const property = await getPropertyData(params.id);

    if (!property) {
        notFound();
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/dashboard">Dashboard</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/properties">Properties</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{property.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-4">
                                <CardTitle className="text-3xl">{property.title}</CardTitle>
                                <Badge variant="outline" className="text-base">{property.status}</Badge>
                            </div>
                            <CardDescription className="flex items-center gap-2 mt-2">
                                <MapPin className="h-4 w-4" />
                                {property.address}, {property.city}, {property.state} {property.zip_code}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href={`/properties/edit/${property.id}`}>
                                    <Edit className="mr-2" /> Edit
                                </Link>
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <Trash2 className="mr-2" /> Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the property, its media, and all associated social media posts. This action cannot be undone.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <form action={async () => {
                                        "use server";
                                        await deleteProperty(property.id, property.created_by || '');
                                        redirect('/properties');
                                    }}>
                                        <AlertDialogAction type="submit" className="bg-destructive hover:bg-destructive/90">
                                            Yes, delete everything
                                        </AlertDialogAction>
                                    </form>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {property.property_media && property.property_media.length > 0 && (
                        <Carousel className="w-full max-w-4xl mx-auto mb-6">
                            <CarouselContent>
                                {property.property_media.map((media) => (
                                <CarouselItem key={media.id}>
                                    <div className="aspect-video relative">
                                    <Image
                                        src={media.file_path}
                                        alt={property.title || 'Property image'}
                                        fill
                                        className="object-cover rounded-md"
                                    />
                                    </div>
                                </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2">Property Details</h3>
                            <div className="flex items-center justify-between text-lg">
                                <span className="text-muted-foreground">Price</span>
                                <span className="font-bold flex items-center gap-2">
                                    <DollarSign className="text-green-600" />
                                    {formatCurrency(property.price)}
                                </span>
                            </div>
                             <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2"><Bed className="text-muted-foreground"/> <span>{property.bedrooms} Bedrooms</span></div>
                                <div className="flex items-center gap-2"><Bath className="text-muted-foreground"/> <span>{property.bathrooms} Bathrooms</span></div>
                                <div className="flex items-center gap-2"><Square className="text-muted-foreground"/> <span>{property.area_sqft} sqft</span></div>
                                <div className="flex items-center gap-2"><Building2 className="text-muted-foreground"/> <span>{property.property_type}</span></div>
                            </div>
                            <Separator />
                            <p className="text-muted-foreground text-sm">
                                {property.description}
                            </p>
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                                <Share2 className="h-5 w-5" />
                                Social Media Shares
                            </h3>
                             <SocialSharesList shares={property.property_shares || []} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

