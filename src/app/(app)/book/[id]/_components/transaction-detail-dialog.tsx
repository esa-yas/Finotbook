
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import type { Transaction } from '@/contexts/BookContext';

interface AttachmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: Transaction;
}

interface Attachment {
  name: string;
  url: string;
}

const getAttachments = (transaction: Transaction): Attachment[] => {
    const attachments: Attachment[] = [];
    if (transaction.attachment_url_1) attachments.push({ name: 'Attachment 1', url: transaction.attachment_url_1 });
    if (transaction.attachment_url_2) attachments.push({ name: 'Attachment 2', url: transaction.attachment_url_2 });
    if (transaction.attachment_url_3) attachments.push({ name: 'Attachment 3', url: transaction.attachment_url_3 });
    if (transaction.attachment_url_4) attachments.push({ name: 'Attachment 4', url: transaction.attachment_url_4 });
    return attachments;
}

export function AttachmentDialog({ open, onOpenChange, transaction }: AttachmentDialogProps) {
    const attachments = getAttachments(transaction);

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>View Attachment</DialogTitle>
                </DialogHeader>
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative w-full h-[70vh] bg-muted rounded-lg overflow-hidden">
                            {attachments[0]?.url.endsWith('.pdf') ? ( // Simplified to show first attachment for now in a larger view
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <FileText className="h-24 w-24" />
                                    <p className="mt-4">PDF Document</p>
                                     <Button asChild variant="outline" size="sm" className="mt-4">
                                        <a href={attachments[0].url} target="_blank" rel="noopener noreferrer">
                                            Open PDF in new tab
                                        </a>
                                    </Button>
                                </div>
                            ) : (
                                <Image
                                    src={attachments[0]?.url || ''}
                                    alt={attachments[0]?.name || 'Attachment'}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                                    style={{ objectFit: 'contain' }}
                                    data-ai-hint="document receipt"
                                />
                            )}
                        </div>
                        <div className="flex items-center justify-between w-full">
                            <span className="text-sm text-muted-foreground">{attachments[0]?.name}</span>
                            <Button asChild variant="outline" size="sm">
                            <a href={attachments[0]?.url} target="_blank" rel="noopener noreferrer" download>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
