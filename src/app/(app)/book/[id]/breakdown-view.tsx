
'use client';

import { useBook, Transaction } from '@/contexts/BookContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Paperclip, Pencil, Trash2, Download, FileText, Printer } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Image from 'next/image';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsClient } from '@/hooks/use-is-client';
import { ReceiptDialog } from './_components/receipt-dialog';
import { AttachmentDialog } from './_components/attachment-dialog';

export function BreakdownView() {
  const { filteredTransactions, deleteTransaction, setTransactionToEdit, setIsSheetOpen, book, loading: bookLoading } = useBook();
  const { currentBusiness, currentUserRole, getCurrencySymbol, contacts, loading: businessLoading } = useBusiness();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const isClient = useIsClient();

  const isLoading = !isClient || bookLoading || businessLoading.contacts;

  const currencySymbol = isLoading ? '' : getCurrencySymbol(book?.currency || 'USD');
  const canDeleteTransaction = currentUserRole === 'owner' || currentUserRole === 'admin';
  
  const contactsMap = useMemo(() => new Map(contacts.map(c => [c.id, c.name])), [contacts]);

  const handleEdit = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsSheetOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    await deleteTransaction(id);
    setIsDeleting(false);
  }

  const handleOpenAttachmentViewer = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsAttachmentViewerOpen(true);
  }

  const handleOpenReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsReceiptOpen(true);
  }

  const transactionsWithBalance = useMemo(() => {
    let runningBalance = 0;
    const transactionsToProcess = [...filteredTransactions].reverse();
    const result = transactionsToProcess.map(t => {
      if (t.type === 'credit') {
        runningBalance += t.amount;
      } else {
        runningBalance -= t.amount;
      }
      return { ...t, balance: runningBalance };
    });
    return result.reverse();
  }, [filteredTransactions]);

  const groupedTransactions = useMemo(() => {
    return transactionsWithBalance.reduce((acc, t) => {
      const date = format(new Date(t.date), 'dd MMMM yyyy');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(t);
      return acc;
    }, {} as Record<string, typeof transactionsWithBalance>);
  }, [transactionsWithBalance]);
  
  const formatAmount = (amount: number) => {
      return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  
  const formatCompactAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(amount)
  }
  
  const getAttachments = (transaction: Transaction): { name: string, url: string }[] => {
    const attachments = [];
    if (transaction.attachment_url_1) attachments.push({ name: 'Attachment 1', url: transaction.attachment_url_1 });
    if (transaction.attachment_url_2) attachments.push({ name: 'Attachment 2', url: transaction.attachment_url_2 });
    if (transaction.attachment_url_3) attachments.push({ name: 'Attachment 3', url: transaction.attachment_url_3 });
    if (transaction.attachment_url_4) attachments.push({ name: 'Attachment 4', url: transaction.attachment_url_4 });
    return attachments;
  }
  
  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {[...Array(6)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
  }

  return (
    <>
       <div className="space-y-4">
        {filteredTransactions.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground font-medium md:hidden">Showing {filteredTransactions.length} entries</p>
            
            {/* Mobile Card View */}
            <div className="space-y-4 md:hidden">
              {Object.entries(groupedTransactions).map(([date, transactionsOnDate]) => (
                <div key={date}>
                  <h3 className="text-sm font-semibold text-muted-foreground my-3">{date}</h3>
                  <div className="space-y-3">
                    {transactionsOnDate.map(t => {
                      const attachments = getAttachments(t);
                      return (
                        <AlertDialog key={t.id}>
                          <Card className="overflow-hidden">
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                  <div className={cn("w-1.5 h-full rounded-full self-stretch", t.type === 'credit' ? 'bg-green-500' : 'bg-red-500')}></div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                       <Badge variant="outline" className="text-xs">{t.payment_mode || 'Cash'}</Badge>
                                    </div>
                                    <p className="font-semibold mt-1.5">{t.description}</p>
                                     {attachments.length > 0 && (
                                        <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1.5 text-muted-foreground" onClick={() => handleOpenAttachmentViewer(t)}>
                                            <Paperclip className="w-3 h-3"/>
                                            <span>{attachments.length} Attachment{attachments.length > 1 ? 's' : ''}</span>
                                        </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className={cn("text-lg font-bold", t.type === 'credit' ? 'text-green-600' : 'text-red-600')}>
                                    {formatAmount(t.amount)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Balance: {formatCompactAmount(t.balance)}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="bg-muted/50 text-xs text-muted-foreground px-3 py-1.5 flex justify-between items-center">
                              <p>
                                By {t.user_full_name || t.user_email?.split('@')[0]} at {format(new Date(t.date), 'p')}
                              </p>
                              <div className="flex items-center">
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => handleOpenReceipt(t)}>
                                      <Printer className="h-4 w-4" />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(t)}>
                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        {canDeleteTransaction && (
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                              </div>
                            </CardFooter>
                          </Card>
                           <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this
                                  transaction from your records.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                  onClick={() => handleDelete(t.id)}
                                  disabled={isDeleting}
                                  className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                                  >
                                  {isDeleting ? 'Deleting...' : 'Yes, delete it'}
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead className="text-right">Cash In</TableHead>
                            <TableHead className="text-right">Cash Out</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactionsWithBalance.map((t) => (
                             <AlertDialog key={t.id}>
                                <TableRow>
                                    <TableCell className="font-medium">{format(new Date(t.date), 'dd MMM, yy')}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{t.description}</div>
                                        <div className="text-xs text-muted-foreground space-x-2">
                                            <span>By: {t.user_full_name || t.user_email?.split('@')[0]}</span>
                                            <span>|</span>
                                            <span>Mode: {t.payment_mode || 'Cash'}</span>
                                            {t.category && <span>| Category: {t.category}</span>}
                                            {t.contact_id && contactsMap.has(t.contact_id) && <span>| Party: {contactsMap.get(t.contact_id)}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-green-600">
                                        {t.type === 'credit' ? formatAmount(t.amount) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-red-600">
                                        {t.type === 'debit' ? formatAmount(t.amount) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">{formatAmount(t.balance)}</TableCell>
                                    <TableCell className="text-center">
                                       <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenReceipt(t)}>
                                                    <Printer className="mr-2 h-4 w-4" /> Print/View Bill
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleOpenAttachmentViewer(t)} disabled={getAttachments(t).length === 0}>
                                                    <Paperclip className="mr-2 h-4 w-4" /> View Attachments
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEdit(t)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                {canDeleteTransaction && (
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this
                                        transaction from your records.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                        onClick={() => handleDelete(t.id)}
                                        disabled={isDeleting}
                                        className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                                        >
                                        {isDeleting ? 'Deleting...' : 'Yes, delete it'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </>
        ) : (
          <div className="flex h-[40vh] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card">
            <FileText className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">No Transactions Found</h2>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your filters or add a new entry.
            </p>
          </div>
        )}
      </div>

       {isClient && selectedTransaction && book && currentBusiness && (
          <>
            <AttachmentDialog 
                open={isAttachmentViewerOpen}
                onOpenChange={setIsAttachmentViewerOpen}
                transaction={selectedTransaction}
            />
            <ReceiptDialog
                open={isReceiptOpen}
                onOpenChange={setIsReceiptOpen}
                transaction={selectedTransaction}
                book={book}
                business={currentBusiness}
                currencySymbol={currencySymbol}
                contactName={selectedTransaction.contact_id ? contactsMap.get(selectedTransaction.contact_id) : undefined}
            />
          </>
       )}
    </>
  );
}
