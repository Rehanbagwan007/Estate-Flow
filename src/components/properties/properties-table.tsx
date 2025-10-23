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
import { MoreHorizontal, MessageSquare } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import Image from "next/image"
import placeholderImages from '@/lib/placeholder-images.json';

interface PropertiesTableProps {
  properties: Property[]
}

export function PropertiesTable({ properties }: PropertiesTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  const handleWhatsAppShare = (property: Property) => {
    const agentPhone = "15551234567"; // Placeholder for agent's phone
    const message = `Hi, I'm interested in this property: ${property.title} located at ${property.address}. Price: ${formatCurrency(property.price)}. You can view it here: [link to property]`;
    window.open(`https://wa.me/${agentPhone}?text=${encodeURIComponent(message)}`, '_blank');
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
            <span className="sr-only">Actions</span>
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
                  src={placeholder.src}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/properties/${property.id}/edit`}>Edit</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleWhatsAppShare(property)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Share via WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
