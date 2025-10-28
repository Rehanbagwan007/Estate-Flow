
'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { Task, Property, Profile, TaskMedia, TaskStatus } from '@/lib/types';
import { Building2, User, MapPin, Bed, Bath, Square, Phone, Link as LinkIcon, Camera, Loader2, Eye, FileText } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updateTaskStatus } from '@/app/(dashboard)/tasks/actions';
import { Label } from '@/components/ui/label';
import { TaskReportDialog } from './task-report-dialog';
import { formatCurrency } from '@/lib/utils';

interface EnrichedTask extends Task {
    property?: (Property & { property_media?: { file_path: string }[] }) | null;
    customer?: Profile | null;
    task_media?: TaskMedia[] | null;
}

interface TaskDetailsDialogProps {
    task: EnrichedTask | null;
    isOpen: boolean;
    onClose: () => void;
    onCall: (target: { customerId: string; customerPhone: string; customerName: string }) => void;
    onUpdate: () => void;
}

export function TaskDetailsDialog({ task, isOpen, onClose, onCall, onUpdate }: TaskDetailsDialogProps) {
    const { toast } = useToast();
    const [isUpdating, startTransition] = useTransition();
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

    if (!task) return null;
    
    const customerName = task.customer ? `${task.customer.first_name} ${task.customer.last_name}` : 'the customer';
    const effectiveCustomerPhone = task.customer?.phone || task.customer_phone;


    const handleCallClick = () => {
        if (effectiveCustomerPhone) {
            onCall({
                customerId: task.customer?.id || 'unknown',
                customerPhone: effectiveCustomerPhone,
                customerName: customerName
            });
            onClose();
        }
    };
    
    const handleStatusChange = (newStatus: TaskStatus) => {
        startTransition(async () => {
            const result = await updateTaskStatus(task.id, newStatus);
            if (result.success) {
                toast({ title: 'Success', description: 'Task status updated.' });
                onUpdate();
                onClose();
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        });
    };

    const handleReportSuccess = () => {
        setIsReportDialogOpen(false);
        onUpdate();
        onClose();
        toast({ title: 'Success', description: 'Report submitted and task marked as complete.' });
    };

    return (
        <>
        <TaskReportDialog 
            isOpen={isReportDialogOpen}
            onClose={() => setIsReportDialogOpen(false)}
            task={task}
            onSuccess={handleReportSuccess}
        />
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg grid-rows-[auto_1fr_auto]">
                <DialogHeader>
                    <DialogTitle>{task.title}</DialogTitle>
                    <DialogDescription>{task.description}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-6 -mr-6">
                    <div className="space-y-4 py-4">
                        {task.customer && (
                            <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Customer</h4>
                                <p className="text-sm">{customerName}</p>
                                <p className="text-sm text-muted-foreground">{task.customer.email}</p>
                                <p className="text-sm text-muted-foreground">{effectiveCustomerPhone}</p>
                            </div>
                        )}
                        {!task.customer && effectiveCustomerPhone && (
                             <div className="space-y-2">
                                <h4 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Customer Contact</h4>
                                <p className="text-sm text-muted-foreground">{effectiveCustomerPhone}</p>
                            </div>
                        )}
                        {task.property && (
                            <div className="space-y-4 pt-4 border-t">
                                <h4 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4" /> Property Details</h4>
                                {task.property.property_media && task.property.property_media.length > 0 && (
                                    <div className="aspect-video rounded-lg overflow-hidden relative">
                                        <Image
                                            src={task.property.property_media[0].file_path}
                                            alt={task.property.title || 'Property image'}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <h5 className="font-medium">{task.property.title}</h5>
                                <p className="text-sm text-muted-foreground">{task.property.description}</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {task.property.city}, {task.property.state}</div>
                                    <div className="flex items-center gap-2">{formatCurrency(task.property.price)}</div>
                                    <div className="flex items-center gap-2"><Bed className="h-4 w-4 text-muted-foreground" /> {task.property.bedrooms} Bedrooms</div>
                                    <div className="flex items-center gap-2"><Bath className="h-4 w-4 text-muted-foreground" /> {task.property.bathrooms} Bathrooms</div>
                                    <div className="flex items-center gap-2"><Square className="h-4 w-4 text-muted-foreground" /> {task.property.area_sqft} sqft</div>
                                </div>
                            </div>
                        )}
                         {task.location_address && (
                            <div className="space-y-2 pt-4 border-t">
                                <h4 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</h4>
                                <a href={task.location_address} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-2">
                                    <LinkIcon className="h-4 w-4" />
                                    <span>Open in Google Maps</span>
                                </a>
                            </div>
                         )}
                         {task.task_media && task.task_media.length > 0 && (
                            <div className="space-y-2 pt-4 border-t">
                                <h4 className="font-semibold flex items-center gap-2"><Camera className="h-4 w-4" /> Attachments</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {task.task_media.map((media) => (
                                        <a key={media.id} href={media.file_path} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-md overflow-hidden group">
                                            <Image src={media.file_path} alt={`Task attachment`} fill className="object-cover" />
                                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Eye className="text-white h-6 w-6" />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                         )}
                         <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="status">Task Status</Label>
                            <div className="flex gap-2">
                                <Select defaultValue={task.status} onValueChange={(value: TaskStatus) => handleStatusChange(value)}>
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Set status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Todo">To Do</SelectItem>
                                    <SelectItem value="InProgress">In Progress</SelectItem>
                                    <SelectItem value="Done">Done</SelectItem>
                                </SelectContent>
                                </Select>
                                {task.status !== 'Done' && (
                                    <Button onClick={() => handleStatusChange('Done')} disabled={isUpdating}>
                                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Mark as Complete
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                     {task.task_type === 'Call' && effectiveCustomerPhone && (
                        <Button
                            onClick={handleCallClick}
                            disabled={task.status === 'Done'}
                        >
                            <Phone className="mr-2 h-4 w-4" />
                            Call Customer
                        </Button>
                    )}
                     {task.task_type === 'Site Visit' && (
                        <Button
                            onClick={() => setIsReportDialogOpen(true)}
                            disabled={task.status === 'Done'}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Submit Report
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}

    

    
