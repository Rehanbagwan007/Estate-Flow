'use client'

import type { Lead, Profile } from "@/lib/types"
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
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

interface LeadsTableProps {
  leads: (Lead & { profile: Profile | null })[]
}

export function LeadsTable({ leads }: LeadsTableProps) {
  
  const getStatusVariant = (status: Lead['status']) => {
    switch (status) {
      case 'Hot':
        return 'destructive'
      case 'Warm':
        return 'default'
      case 'Cold':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Contact</TableHead>
          <TableHead className="hidden md:table-cell">Assigned To</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell>
              <div className="font-medium">{lead.first_name} {lead.last_name}</div>
              <div className="hidden text-sm text-muted-foreground md:inline">
                {lead.email}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(lead.status)}>{lead.status}</Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">{lead.phone}</TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${lead.assigned_to}`} />
                  <AvatarFallback>{getInitials(lead.profile?.first_name, lead.profile?.last_name)}</AvatarFallback>
                </Avatar>
                <span>{lead.profile?.first_name} {lead.profile?.last_name}</span>
              </div>
            </TableCell>
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
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Add Note</DropdownMenuItem>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
