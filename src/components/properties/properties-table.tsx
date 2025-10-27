
'use client'

import type { Property } from "@/lib/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, MessageSquare, Trash2, Edit } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import Image from "next/image"
import placeholderImages from '@/lib/placeholder-images.json';
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
import { deleteProperty } from "@/app/(dashboard)/properties/actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface PropertiesTableProps {
  properties: Property[]
}

export function PropertiesTable({ properties }: PropertiesTableProps) {
  const { toast } = useToast();
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  const getStatusVariant = (status: Property['status']) => {
    switch (status) {
      case 'Available':
        return 'default'
      case 'Sold':
        return 'secondary'
      case 'Rented':
        return 'outline'
      case 'Upcoming':
        return 'destructive' // This should be a distinct color
      default:
        return 'default'
    }
  }

  const handleDelete = async (propertyId: string, propertyCreatorId: string) => {
      const result = await deleteProperty(propertyId, propertyCreatorId);
      if (result.success) {
          toast({
              title: "Success",
              description: result.message,
          });
      } else {
          toast({
              title: "Error",
              description: result.error,
              variant: "destructive",
          });
      }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Price</TableHead>
          <TableHead className="hidden md:table-cell">Location</TableHead>
          <TableHead>
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {properties.map((property, index) => {
          const placeholder = placeholderImages.property_thumbnails[index % placeholderImages.property_thumbnails.length];
          return (
            <TableRow key={property.id}>
              <TableCell className="hidden sm:table-cell">
                <Image
                  alt="Property image"
                  className="aspect-square rounded-md object-cover"
                  height="64"
                  src={property.property_media?.[0]?.file_path || placeholder.src}
                  width="64"
                  data-ai-hint={placeholder.hint}
                />
              </TableCell>
              <TableCell className="font-medium">{property.title}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(property.status)}>{property.status}</Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">{formatCurrency(property.price)}</TableCell>
              <TableCell className="hidden md:table-cell">{property.city}, {property.state}</TableCell>
              <TableCell>
                 <Button onClick={() => router.push(`/properties/${property.id}`)}>
                    Manage Property
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
