
'use client';

import { useState, useTransition } from 'react';
import type { PropertyShare } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { deleteSocialPost } from '../actions';
import { Loader2, Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { OlxLogo, NinetyNineAcresLogo } from '@/components/icons/platforms';
import { FaFacebook, FaInstagram } from 'react-icons/fa';

interface SocialSharesListProps {
    shares: PropertyShare[];
}

const platformIcons: { [key: string]: React.ReactNode } = {
    'Facebook': <FaFacebook className="h-5 w-5 text-blue-600" />,
    'Instagram': <FaInstagram className="h-5 w-5 text-pink-600" />,
    'OLX': <OlxLogo className="h-5 w-5" />,
    '99acres': <NinetyNineAcresLogo className="h-5 w-5" />,
};

export function SocialSharesList({ shares: initialShares }: SocialSharesListProps) {
    const [shares, setShares] = useState(initialShares);
    const [isDeleting, startTransition] = useTransition();
    const { toast } = useToast();

    const handleDelete = (shareId: string) => {
        startTransition(async () => {
            const result = await deleteSocialPost(shareId);
            if (result.success) {
                setShares(prev => prev.filter(s => s.id !== shareId));
                toast({
                    title: 'Success!',
                    description: 'Social media post has been deleted.',
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                });
            }
        });
    };

    if (shares.length === 0) {
        return <p className="text-sm text-muted-foreground">This property hasn't been shared on any social platforms yet.</p>;
    }

    return (
        <div className="space-y-3">
            {shares.map(share => (
                <div key={share.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                        {platformIcons[share.platform] || <Share2 className="h-5 w-5" />}
                        <div>
                            <p className="font-medium">{share.platform}</p>
                            <Link href={share.post_url || '#'} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline line-clamp-1">
                                View Post
                            </Link>
                        </div>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Delete this social media post?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will attempt to delete the post from {share.platform}. This action might not be recoverable.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(share.id)} className="bg-destructive hover:bg-destructive/90">
                                Yes, Delete Post
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            ))}
        </div>
    );
}

