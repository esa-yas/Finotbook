
'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useBook, NewTransaction } from '@/contexts/BookContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/db';

interface BulkEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ParsedRow = {
  data: NewTransaction;
  errors: string[];
  originalRow: any;
};

// Function to convert Excel serial date to JS Date
const excelDateToJSDate = (serial: number) => {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);

  const fractional_day = serial - Math.floor(serial) + 0.0000001;

  let total_seconds = Math.floor(86400 * fractional_day);

  const seconds = total_seconds % 60;
  total_seconds -= seconds;

  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;

  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
};

export function BulkEntryDialog({ open, onOpenChange }: BulkEntryDialogProps) {
  const { bulkAddTransactions, bookCustomFields } = useBook();
  const { contacts, categories, paymentMethods, addCategory, addPaymentMethod, addContact, refreshData } = useBusiness();
  const { user } = useAuth();
  const userProfile = useLiveQuery(() => user ? db.profiles.get(user.id) : undefined, [user?.id]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const customFieldNames = useMemo(() => bookCustomFields.map(f => f.field_name.toLowerCase()), [bookCustomFields]);

  const resetState = () => {
    setFileName(null);
    setParsedData([]);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  const validateRow = useCallback((row: any): ParsedRow => {
    const errors: string[] = [];
    let transaction: Partial<NewTransaction> & { custom_fields?: Record<string, any> } = {};

    // Date and Time
    let transactionDate: Date | null = null;
    if (row.Date) {
        if (typeof row.Date === 'number') {
            transactionDate = excelDateToJSDate(row.Date);
        } else {
            transactionDate = new Date(row.Date);
        }

        if (row.Time) {
            let timePart = row.Time;
            if(typeof timePart === 'number') { // Excel time is a fraction of a day
                const totalSeconds = Math.round(timePart * 86400);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                transactionDate.setHours(hours, minutes);
            } else if (typeof timePart === 'string') {
                const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i;
                const match = timePart.match(timeRegex);
                if (match) {
                    let [_, hoursStr, minutesStr, ampm] = match;
                    let hours = parseInt(hoursStr, 10);
                    if (ampm && ampm.toUpperCase() === 'PM' && hours < 12) {
                        hours += 12;
                    }
                    if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) {
                        hours = 0;
                    }
                    transactionDate.setHours(hours, parseInt(minutesStr, 10));
                }
            }
        }
       transaction.date = transactionDate.toISOString();
    } else {
        errors.push("Date is required.");
    }

    // Remark
    transaction.description = row.Remark || '';
    if (!transaction.description) {
        errors.push("Remark is required.");
    }
    
    // Amount and Type
    const cashIn = parseFloat(row['Cash In']);
    const cashOut = parseFloat(row['Cash Out']);
    if (!isNaN(cashIn) && cashIn > 0) {
        transaction.amount = cashIn;
        transaction.type = 'credit';
    } else if (!isNaN(cashOut) && cashOut > 0) {
        transaction.amount = cashOut;
        transaction.type = 'debit';
    } else {
        errors.push("Either 'Cash In' or 'Cash Out' must have a positive value.");
    }

    // Optional Fields are now handled in the import function
    transaction.category = row.Category || undefined;
    transaction.payment_mode = row.Mode || 'Cash';
    transaction.contact_id = row.Party || undefined; // Temporary store name, will be resolved to ID
    
    // Custom Fields
    transaction.custom_fields = {};
    for (const key in row) {
      if (customFieldNames.includes(key.toLowerCase())) {
        if(row[key] !== null && row[key] !== undefined) {
           transaction.custom_fields[key] = row[key];
        }
      }
    }

    return {
      data: transaction as NewTransaction,
      errors,
      originalRow: row,
    };
  }, [customFieldNames]);


  const processFile = (file: File) => {
    setIsLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, codepage: 65001 });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const processedData = json.map(validateRow);
        setParsedData(processedData);

      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'File Read Error',
          description: 'Could not read or parse the Excel file. Please ensure it is a valid .xlsx file.',
        });
        resetState();
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        processFile(file);
    } else {
        toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please drop a valid .xlsx file.',
        });
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleImport = async () => {
    let validTransactions = parsedData.filter(p => p.errors.length === 0).map(p => p.data);
    
    if (validTransactions.length === 0) {
      toast({ variant: 'destructive', title: 'No valid transactions to import.' });
      return;
    }

    setIsLoading(true);

    try {
      // Create maps for existing items
      const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c]));
      const paymentMethodMap = new Map(paymentMethods.map(p => [p.name.toLowerCase(), p]));
      const contactMap = new Map(contacts.map(c => [c.name.toLowerCase(), c]));

      // Identify new items to create
      const newCategories = new Set<string>();
      const newPaymentMethods = new Set<string>();
      const newContacts = new Set<string>();

      for (const t of validTransactions) {
        if (t.category && !categoryMap.has(t.category.toLowerCase())) {
          newCategories.add(t.category);
        }
        if (t.payment_mode && !paymentMethodMap.has(t.payment_mode.toLowerCase())) {
          newPaymentMethods.add(t.payment_mode);
        }
        if (t.contact_id && !contactMap.has(t.contact_id.toLowerCase())) {
          newContacts.add(t.contact_id);
        }
      }

      // Create new items in parallel
      const creationPromises = [
        ...Array.from(newCategories).map(name => addCategory(name)),
        ...Array.from(newPaymentMethods).map(name => addPaymentMethod(name)),
        ...Array.from(newContacts).map(name => addContact(name)),
      ];

      await Promise.all(creationPromises);
      
      // Refresh data to get the latest items from the DB
      await refreshData();
      
      // We need to get the latest data from the context, which would have been updated by refreshData
      // A slight delay might be needed if context update is not immediate, or better, use the returned values.
      // For simplicity here, we'll refetch from db which is now synced.
      const latestContacts = await db.contacts.where({ business_id: contacts[0]?.business_id }).toArray();
      const newContactMap = new Map(latestContacts.map(c => [c.name.toLowerCase(), c]));
      const latestCategories = await db.categories.where({ business_id: contacts[0]?.business_id }).toArray();
      const newCategoryMap = new Map(latestCategories.map(c => [c.name.toLowerCase(), c]));
      const latestPaymentMethods = await db.paymentMethods.where({ business_id: contacts[0]?.business_id }).toArray();
      const newPaymentMethodMap = new Map(latestPaymentMethods.map(p => [p.name.toLowerCase(), p]));

      // Resolve names to IDs for transactions
      const finalTransactions = validTransactions.map(t => {
        const resolvedContact = t.contact_id ? newContactMap.get(t.contact_id.toLowerCase()) : undefined;
        return {
          ...t,
          contact_id: resolvedContact?.id,
          category: t.category && newCategoryMap.has(t.category.toLowerCase()) ? t.category : undefined,
          payment_mode: t.payment_mode && newPaymentMethodMap.has(t.payment_mode.toLowerCase()) ? t.payment_mode : 'Cash',
        };
      });

      const success = await bulkAddTransactions(finalTransactions);
      if (success) {
        await refreshData();
        handleOpenChange(false);
      }
    } catch (error) {
      console.error("Error during import process:", error);
      toast({ variant: 'destructive', title: 'Import Failed', description: 'An error occurred while preparing transactions for import.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const validCount = useMemo(() => {
    return parsedData.filter(row => row.errors.length === 0).length;
  }, [parsedData]);


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Entry from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx) with your transactions. Columns should be: Date, Time, Remark, Cash In, Cash Out, Party, Category, Mode, and any custom fields. New parties, categories, or modes will be created automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow flex flex-col min-h-0">
          {!fileName ? (
             <div 
                className={cn(
                    "flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors",
                    isDragOver ? "bg-primary/10 border-primary" : "border-border"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
             >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                />
                <Upload className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Select an Excel file to upload</h3>
                <p className="text-sm text-muted-foreground">or drag and drop it here</p>
                <Button type="button" onClick={() => fileInputRef.current?.click()} className="mt-6">
                    Browse File
                </Button>
            </div>
          ) : (
             <div className="flex-1 flex flex-col min-h-0 space-y-4">
                <div className="p-4 border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-primary" />
                        <div>
                            <p className="font-semibold">{fileName}</p>
                            <p className="text-sm text-muted-foreground">{parsedData.length} rows found.</p>
                        </div>
                    </div>
                     <div className="text-right">
                        <p className="font-semibold">{userProfile?.full_name || user?.email}</p>
                        <p className="text-sm text-muted-foreground">Importer</p>
                     </div>
                    <Button variant="outline" size="sm" onClick={resetState} disabled={isLoading}>
                        Upload New File
                    </Button>
                </div>
                
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                <>
                {parsedData.length > 0 && (
                  <div className="flex gap-4">
                     <div className="p-3 rounded-md border bg-muted text-sm font-semibold">
                        {validCount} rows ready for import.
                    </div>
                  </div>
                )}
                
                <ScrollArea className="flex-1 border rounded-md">
                   <Table>
                        <TableHeader className="sticky top-0 bg-muted">
                            <TableRow>
                                <TableHead>Remark</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.map((row, index) => (
                                <TableRow key={index} data-valid={row.errors.length === 0}>
                                    <TableCell>{row.data.description}</TableCell>
                                    <TableCell className={row.data.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                                        {row.data.amount?.toLocaleString()}
                                    </TableCell>
                                    <TableCell>{row.data.date ? format(new Date(row.data.date), 'dd-MMM-yy') : 'N/A'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                   </Table>
                </ScrollArea>
                </>
                )}
             </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={validCount === 0 || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {validCount} Transactions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
