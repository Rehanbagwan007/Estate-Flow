
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Task, Property, Profile } from '@/lib/types';
import { Building2, User, DollarSign, MapPin, Bed, Bath, Square } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';


interface EnrichedTask extends Task {
    property?: (Property & { property_media?: { file_path: string }[] }) | null;
    customer?: Profile | null;
}

interface TaskDetailsDialogProps {
    task: EnrichedTask | null;
    isOpen: boolean;
    onClose: () => void;
}

export function TaskDetailsDialog({ task, isOpen, onClose }: TaskDetailsDialogProps) {
    if (!task) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{task.title}</DialogTitle>
                    <DialogDescription>{task.description}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-6">
                    <div className="space-y-4 py-4">
                        {task.customer && (
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Customer</h4>
                                <p className="text-sm">{task.customer.first_name} {task.customer.last_name}</p>
                                <p className="text-sm text-muted-foreground">{task.customer.email}</p>
                                <p className="text-sm text-muted-foreground">{task.customer.phone}</p>
                            </div>
                        )}
                        {task.property && (
                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4" /> Property Details</h4>
                                {task.property.property_media && task.property.property_media.length > 0 && (
                                    <div className="aspect-video rounded-lg overflow-hidden relative">
                                        <Image
                                            src={task.property.property_media[0].file_path}
                                            alt={task.property.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <h5 className="font-medium">{task.property.title}</h5>
                                <p className="text-sm text-muted-foreground">{task.property.description}</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {task.property.city}, {task.property.state}</div>
                                    <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" /> {task.property.price.toLocaleString()}</div>
                                    <div className="flex items-center gap-2"><Bed className="h-4 w-4 text-muted-foreground" /> {task.property.bedrooms} Bedrooms</div>
                                    <div className="flex items-center gap-2"><Bath className="h-4 w-4 text-muted-foreground" /> {task.property.bathrooms} Bathrooms</div>
                                    <div className="flex items-center gap-2"><Square className="h-4 w-4 text-muted-foreground" /> {task.property.area_sqft} sqft</div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
