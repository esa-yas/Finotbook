
'use client';

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Transaction, Book } from '@/contexts/BookContext';
import { Business } from '@/contexts/BusinessContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2, Download, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: Transaction;
    book: Book;
    business: Business;
    currencySymbol: string;
    contactName?: string;
}

const FinotBookLogo = () => (
    <div className="flex items-center justify-center gap-2">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="12" fill="url(#paint0_linear_1_2)"/>
            <path d="M12.9412 11.2354H18.1471V26.2354H20.7353V11.2354H25.9412V8.88242H12.9412V11.2354Z" fill="white"/>
            <path d="M18.1471 28.5883H12.9412V30.9412H25.9412V28.5883H20.7353V13.5883H18.1471V28.5883Z" fill="white"/>
            <defs>
                <linearGradient id="paint0_linear_1_2" x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4A80F0"/>
                    <stop offset="1" stopColor="#2D68EE"/>
                </linearGradient>
            </defs>
        </svg>
        <div className="text-center">
            <p className="font-bold text-base text-blue-600 leading-tight">FinotBook</p>
            <p className="text-xs text-gray-500 leading-tight">Smart. Simple. Secure.</p>
        </div>
    </div>
);


const TransactionReceipt: React.FC<Omit<ReceiptDialogProps, 'open'|'onOpenChange'>> = 
    ({ transaction, book, business, currencySymbol, contactName }) => {
    
    const transactionDate = format(new Date(transaction.date), 'dd MMM, yyyy');
    const transactionTime = format(new Date(transaction.date), 'hh:mm a');
    
    return (
        <div 
            className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-sm mx-auto font-sans border-2 border-dashed border-gray-300"
            style={{
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                fontSize: '14px',
                lineHeight: '1.5'
            }}
        >
            <div className="p-6">
                {/* Header */}
                <div className="text-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{business.name}</h2>
                    <p className="text-sm text-gray-600 mb-4">({book.name})</p>
                    
                    <div className="flex justify-center items-center">
                        <div className={cn(
                            "text-sm font-semibold",
                            transaction.type === 'credit' 
                                ? 'text-green-700'
                                : 'text-red-700'
                        )}>
                            {transaction.type === 'credit' ? 'CASH IN RECEIPT' : 'CASH OUT RECEIPT'}
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-300 my-4" />

                {/* Transaction Details */}
                <div className="space-y-4 text-sm mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Date:</span>
                        <span className="text-gray-900 font-semibold">{transactionDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Time:</span>
                        <span className="text-gray-900 font-semibold">{transactionTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Payment:</span>
                        <span className="text-gray-900 font-semibold">{transaction.payment_mode || 'Cash'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Entry By:</span>
                        <span className="text-gray-900 font-semibold" title={transaction.user_email}>
                           {transaction.user_full_name || transaction.user_email.split('@')[0]}
                        </span>
                    </div>
                </div>
                
                {/* Divider */}
                <div className="border-t border-dashed border-gray-300 my-4" />
                
                {/* Transaction Amount Section */}
                <div className="mb-6">
                    <div className="mb-4">
                        <span className="text-sm text-gray-600">Description:</span>
                        <p className="text-lg font-bold text-gray-900 mt-2 leading-relaxed break-words">
                            {transaction.description}
                        </p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <span className="text-lg font-bold text-gray-700">Total Amount:</span>
                        <div className="text-right">
                            <p className={cn(
                                "text-2xl font-bold",
                                transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                            )}>
                                {currencySymbol}{transaction.amount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2
                                })}
                            </p>
                            <p className={cn(
                                "text-sm font-medium mt-1",
                                transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                            )}>
                                {transaction.type === 'credit' ? 'Received' : 'Paid'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 pt-6">
                    <div className="text-center mb-4">
                        <FinotBookLogo />
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            Generated on {format(new Date(), 'dd MMM, yyyy hh:mm a')}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            This is a computer generated receipt
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ReceiptDialog(props: ReceiptDialogProps) {
    const { open, onOpenChange, transaction } = props;
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleDownload = async () => {
        if (!receiptRef.current) return;
        setIsProcessing(true);

        try {
            const canvas = await html2canvas(receiptRef.current, { 
                scale: 3,
                backgroundColor: '#f9fafb', // light gray background
                useCORS: true,
                logging: false,
            });
            
            const dataUrl = canvas.toDataURL('image/png');
            
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `FinotBook-Receipt-${transaction.id}-${format(new Date(), 'yyyyMMdd-HHmmss')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: 'Receipt Downloaded',
                description: 'Receipt image saved successfully.',
            });

        } catch (error: any) {
            console.error('Error downloading receipt:', error);
            toast({
                variant: 'destructive',
                title: 'Download Failed',
                description: 'Could not generate receipt image. Please try again.'
            });
        } finally {
            setIsProcessing(false);
        }
    };


    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        Transaction Receipt
                    </DialogTitle>
                </DialogHeader>
                
                <div className="overflow-y-auto max-h-[60vh] bg-gray-50 -mx-6 px-6 py-4">
                    <div ref={receiptRef}>
                        <TransactionReceipt {...props} />
                    </div>
                </div>
                
                <DialogFooter className="gap-2">
                    <Button 
                        onClick={handleDownload} 
                        disabled={isProcessing} 
                        className="flex-1"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Download Bill
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
