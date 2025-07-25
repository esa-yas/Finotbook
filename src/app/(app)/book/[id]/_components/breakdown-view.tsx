
'use client';

import {
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
  Fragment,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
  Printer,
} from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useBusiness } from '@/contexts/BusinessContext';
import { useIsClient } from '@/hooks/use-is-client';
import { ReceiptDialog } from './receipt-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Profile } from '@/services/db';
import { TransactionDetailSheet } from './transaction-detail-sheet';

export function BreakdownView() {
  const {
    filteredTransactions,
    deleteTransaction,
    setTransactionToEdit,
    setIsSheetOpen,
    book,
    loading: bookLoading,
  } = useBook();
  const {
    currentBusiness,
    currentUserRole,
    getCurrencySymbol,
    contacts,
    loading: businessLoading,
  } = useBusiness();

  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const isClient = useIsClient();

  const allProfiles = useLiveQuery(
    () => db.profiles.toArray(),
    [],
    [] as Profile[]
  );
  const profilesMap = useMemo(
    () => new Map(allProfiles.map((p) => [p.id, p])),
    [allProfiles]
  );

  const isLoading =
    !isClient ||
    bookLoading ||
    businessLoading.contacts ||
    !filteredTransactions;
  const currencySymbol = getCurrencySymbol(book?.currency || 'USD');
  const canDeleteTransaction =
    currentUserRole === 'owner' || currentUserRole === 'admin';

  const contactsMap = useMemo(
    () => new Map(contacts.map((c) => [c.id, c.name])),
    [contacts]
  );

  const handleEdit = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsSheetOpen(true);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    await deleteTransaction(id);
    setIsDeleting(false);
  };

  const handleOpenReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsReceiptOpen(true);
  };

  const handleOpenDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailOpen(true);
  };

  const transactionsWithBalance = useMemo(() => {
    if (!filteredTransactions) return [];
    let runningBalance = 0;
    const transactionsToProcess = [...filteredTransactions].reverse();
    const result = transactionsToProcess.map((t) => {
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
    const groups = transactionsWithBalance.reduce(
      (acc, t) => {
        const date = format(new Date(t.date), 'dd MMMM yyyy');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(t);
        return acc;
      },
      {} as Record<string, typeof transactionsWithBalance>
    );

    // Flatten for virtualizer: [ {isHeader: true, date: '...'}, transaction, transaction, ... ]
    const flat: (
      | { isHeader: true; date: string }
      | { isHeader: false; transaction: Transaction & { balance: number } }
    )[] = [];
    for (const date in groups) {
      flat.push({ isHeader: true, date });
      groups[date].forEach((transaction) => {
        flat.push({ isHeader: false, transaction });
      });
    }
    return flat;
  }, [transactionsWithBalance]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: groupedTransactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) =>
      groupedTransactions[index].isHeader ? 44 : 124, // Estimate header height and card height
    overscan: 5,
  });

  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatCompactAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const getUserDisplayName = (userId: string) => {
    const profile = profilesMap.get(userId);
    return profile?.full_name || 'User';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(6)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-5 w-full" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        {filteredTransactions.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground font-medium md:hidden">
              Showing {filteredTransactions.length} entries
            </p>

            {/* Mobile Virtualized Card View */}
            <div
              ref={parentRef}
              className="md:hidden flex-1 overflow-y-auto space-y-3"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const item = groupedTransactions[virtualItem.index];
                  return (
                    <div
                      key={virtualItem.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      {item.isHeader ? (
                        <h3 className="text-sm font-semibold text-muted-foreground my-3 px-1">
                          {item.date}
                        </h3>
                      ) : (
                        <AlertDialog key={item.transaction.id}>
                          <Card
                            className="overflow-hidden cursor-pointer"
                            onClick={() => handleOpenDetail(item.transaction)}
                          >
                            <CardContent className="p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                  <div
                                    className={cn(
                                      'w-1.5 h-full rounded-full self-stretch',
                                      item.transaction.type === 'credit'
                                        ? 'bg-green-500'
                                        : 'bg-red-500'
                                    )}
                                  ></div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {item.transaction.payment_mode || 'Cash'}
                                      </Badge>
                                    </div>
                                    <p className="font-semibold mt-1.5">
                                      {item.transaction.description}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  <p
                                    className={cn(
                                      'text-lg font-bold',
                                      item.transaction.type === 'credit'
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                    )}
                                  >
                                    {formatAmount(item.transaction.amount)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Balance: {formatCompactAmount(item.transaction.balance)}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="bg-muted/50 text-xs text-muted-foreground px-3 py-1.5 flex justify-between items-center">
                              <p>
                                By{' '}
                                {getUserDisplayName(item.transaction.user_id)} at{' '}
                                {format(new Date(item.transaction.date), 'p')}
                              </p>
                               <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleOpenReceipt(item.transaction)
                                    }
                                  >
                                    <Printer className="mr-2 h-4 w-4" /> Print
                                    Receipt
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(item.transaction)}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                  {canDeleteTransaction && (
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" />{' '}
                                        Delete
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </CardFooter>
                          </Card>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete this transaction from your
                                records.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete(item.transaction.id)
                                }
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                              >
                                {isDeleting
                                  ? 'Deleting...'
                                  : 'Yes, delete it'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  );
                })}
              </div>
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
                      <TableRow className="cursor-pointer" onClick={() => handleOpenDetail(t)}>
                        <TableCell className="font-medium">
                          {format(new Date(t.date), 'dd MMM, yy')}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{t.description}</div>
                          <div className="text-xs text-muted-foreground space-x-2">
                            <span>By: {getUserDisplayName(t.user_id)}</span>
                            <span>|</span>
                            <span>Mode: {t.payment_mode || 'Cash'}</span>
                            {t.category && <span>| Category: {t.category}</span>}
                            {t.contact_id && contactsMap.has(t.contact_id) && (
                              <span>| Party: {contactsMap.get(t.contact_id)}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {t.type === 'credit' ? formatAmount(t.amount) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          {t.type === 'debit' ? formatAmount(t.amount) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(t.balance)}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => handleOpenDetail(t)}>
                                <FileText className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenReceipt(t)}>
                                <Printer className="mr-2 h-4 w-4" /> Print/View
                                Bill
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
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete this transaction from your records.
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
          <TransactionDetailSheet
            open={isDetailOpen}
            onOpenChange={setIsDetailOpen}
            transaction={selectedTransaction}
            currencySymbol={currencySymbol}
            contactName={
              selectedTransaction.contact_id
                ? contactsMap.get(selectedTransaction.contact_id)
                : undefined
            }
          />
          <ReceiptDialog
            open={isReceiptOpen}
            onOpenChange={setIsReceiptOpen}
            transaction={selectedTransaction}
            book={book}
            business={currentBusiness}
            currencySymbol={currencySymbol}
            contactName={
              selectedTransaction.contact_id
                ? contactsMap.get(selectedTransaction.contact_id)
                : undefined
            }
          />
        </>
      )}
    </>
  );
}
