
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
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
            <DialogContent className="max-w-2xl p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>View Attachments</DialogTitle>
                </DialogHeader>
                <div className="p-6">
                    <Carousel className="w-full">
                        <CarouselContent>
                            {attachments.map((attachment, index) => (
                            <CarouselItem key={index}>
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                                        {attachment.url.endsWith('.pdf') ? (
                                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                                <FileText className="h-16 w-16" />
                                                <p className="mt-2">PDF Document</p>
                                            </div>
                                        ) : (
                                            <Image
                                                src={attachment.url}
                                                alt={attachment.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                style={{ objectFit: 'contain' }}
                                                data-ai-hint="document receipt"
                                            />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-sm text-muted-foreground">{attachment.name}</span>
                                        <Button asChild variant="outline" size="sm">
                                        <a href={attachment.url} target="_blank" rel="noopener noreferrer" download>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                        </a>
                                        </Button>
                                    </div>
                                </div>
                            </CarouselItem>
                            ))}
                        </CarouselContent>
                        {attachments.length > 1 && (
                            <>
                                <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2" />
                                <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2" />
                            </>
                        )}
                    </Carousel>
                </div>
            </DialogContent>
        </Dialog>
    )
}
