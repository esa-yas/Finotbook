
'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AttachmentDialog } from "./attachment-dialog";
import type { Transaction } from '@/contexts/BookContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
    Minus,
    Plus,
    CheckCircle2,
    Hash,
    User,
} from 'lucide-react';

interface TransactionDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  currencySymbol: string;
  contactName?: string;
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
};

export function TransactionDetailSheet({ open, onOpenChange, transaction, currencySymbol, contactName }: TransactionDetailSheetProps) {
  const attachments = getAttachments(transaction);
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [selectedTransactionForAttachment, setSelectedTransactionForAttachment] = useState<Transaction | null>(null);

  const handleOpenAttachmentViewer = (transaction: Transaction) => {
    setSelectedTransactionForAttachment(transaction);
    setIsAttachmentViewerOpen(true);
  }

  if (!open) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle>Entry Details</SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Main Transaction Info */}
              <div className="p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <div className={cn(
                    "flex items-center gap-2 font-semibold",
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {transaction.type === 'credit' ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                    <span>{transaction.type === 'credit' ? 'Cash In' : 'Cash Out'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{format(new Date(transaction.date), 'dd MMM yyyy, p')}</span>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                </div>

                <p className={cn(
                  "text-4xl font-bold",
                  transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                )}>
                  {currencySymbol}{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>

                <div className="mt-4 space-y-2">
                  <p className="text-sm text-muted-foreground">Remark</p>
                  <p className="font-medium break-words">{transaction.description}</p>
                </div>
                
                {attachments.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {attachments.map((att, index) => (
                      <button key={index} className="relative aspect-square w-full rounded-md overflow-hidden border hover:opacity-80 transition-opacity" onClick={() => handleOpenAttachmentViewer(transaction)}>
                          <Image src={att.url} alt={att.name} fill style={{objectFit: "cover"}} data-ai-hint="receipt document" />
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 flex flex-wrap gap-2">
                    {transaction.payment_mode && <Badge variant="secondary">{transaction.payment_mode}</Badge>}
                    {transaction.category && <Badge variant="secondary">{transaction.category}</Badge>}
                    {contactName && <Badge variant="secondary">{contactName}</Badge>}
                </div>
              </div>

              {/* Custom Fields */}
              {transaction.custom_fields && Object.keys(transaction.custom_fields).length > 0 && (
                <div className="p-4 rounded-lg border">
                    <h4 className="text-sm font-semibold mb-4 text-muted-foreground">Additional Details</h4>
                    <div className="space-y-3">
                        {Object.entries(transaction.custom_fields).map(([key, value]) => (
                            <div key={key} className="flex items-center text-sm">
                                <p className="w-1/3 text-muted-foreground capitalize">{key}</p>
                                <p className="font-medium">{String(value)}</p>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {/* Activities */}
              <div>
                <h4 className="text-sm font-semibold mb-4">Activities</h4>
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="bg-muted rounded-full p-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="text-sm">
                    <p>
                        Created by <span className="font-semibold">{transaction.user_full_name || transaction.user_email.split('@')[0]}</span>
                    </p>
                    <p className="text-muted-foreground">{format(new Date(transaction.created_at), 'dd MMM yyyy, p')}</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
       {selectedTransactionForAttachment && (
        <AttachmentDialog 
          open={isAttachmentViewerOpen} 
          onOpenChange={setIsAttachmentViewerOpen}
          transaction={selectedTransactionForAttachment}
        />
      )}
    </>
  );
}
