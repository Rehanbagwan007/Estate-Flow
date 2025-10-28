
'use client';

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PropertyInterestForm } from '@/components/properties/property-interest-form';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PropertyInterest } from '@/lib/types';


interface PropertyCustomerActionsProps {
    propertyId: string;
    propertyTitle: string;
    isAlreadyInterested: boolean;
}

export function PropertyCustomerActions({ propertyId, propertyTitle, isAlreadyInterested }: PropertyCustomerActionsProps) {
    const router = useRouter();
    
    const handleSuccess = (interest: PropertyInterest) => {
        router.push('/my-interests');
        router.refresh();
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full" size="lg" disabled={isAlreadyInterested}>
                    <Heart className="mr-2" />
                    {isAlreadyInterested ? "Already Interested" : "I'm Interested"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <PropertyInterestForm
                    propertyId={propertyId}
                    propertyTitle={propertyTitle}
                    onSuccess={handleSuccess}
                />
            </DialogContent>
        </Dialog>
    );
}
