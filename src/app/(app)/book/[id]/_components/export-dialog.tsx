
'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useBook } from '@/contexts/BookContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, Loader2, FileUp, FileText } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { format } from 'date-fns';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const { filteredTransactions, book, bookCustomFields, filters } = useBook();
  const { contacts } = useBusiness();
  const [includeFiltered, setIncludeFiltered] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const contactsMap = new Map(contacts.map(c => [c.id, c.name]));

  const getExportData = () => {
    const dataToExport = includeFiltered ? filteredTransactions : [];
    const customFieldHeaders = bookCustomFields.map(cf => cf.field_name);

    return dataToExport.map(t => {
      const customFieldValues: { [key: string]: any } = {};
      customFieldHeaders.forEach(header => {
        customFieldValues[header] = t.custom_fields?.[header] || '';
      });

      return {
        'Date': format(new Date(t.date), 'yyyy-MM-dd'),
        'Time': format(new Date(t.date), 'HH:mm'),
        'Remark': t.description,
        'Party': contactsMap.get(t.contact_id || '') || '',
        'Category': t.category || '',
        'Mode': t.payment_mode || '',
        'Entry By': t.user_email,
        'Cash In': t.type === 'credit' ? t.amount : '',
        'Cash Out': t.type === 'debit' ? t.amount : '',
        ...customFieldValues,
      };
    });
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    const excelData = getExportData();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    
    // Auto-size columns
    const cols = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.max(15, key.length, ...excelData.map(row => String(row[key as keyof typeof row] || '').length))
    }));
    worksheet['!cols'] = cols;

    XLSX.writeFile(workbook, `${book?.name || 'Export'}-Transactions.xlsx`);

    setIsExporting(false);
    onOpenChange(false);
  };
  
  const handleExportPdf = () => {
    setIsExporting(true);
    const doc = new jsPDF();
    const exportData = getExportData();

    // Title
    doc.setFontSize(18);
    doc.text(`Transactions for: ${book?.name || 'Book'}`, 14, 22);

    // Subtitle with date range
    doc.setFontSize(11);
    let dateRangeText = 'Date Range: All Time';
    if(typeof filters.date !== 'string') {
        dateRangeText = `Date Range: ${format(filters.date.from, 'dd LLL, yyyy')} - ${format(filters.date.to, 'dd LLL, yyyy')}`;
    }
    doc.text(dateRangeText, 14, 30);
    
    const head = [Object.keys(exportData[0] || {})];
    const body = exportData.map(row => Object.values(row));
    
    (doc as any).autoTable({
        head: head,
        body: body,
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [34, 34, 34] }, // Dark grey header
        styles: { fontSize: 8 },
        columnStyles: {
            // Adjust column widths as needed
            'Cash In': { halign: 'right' },
            'Cash Out': { halign: 'right' },
        }
    });

    doc.save(`${book?.name || 'Export'}-Transactions.pdf`);
    setIsExporting(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Transactions</DialogTitle>
          <DialogDescription>
            Download your transaction data as an Excel (.xlsx) or PDF file.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
           <div className="flex items-center space-x-2">
            <Checkbox
                id="include-filtered"
                checked={includeFiltered}
                onCheckedChange={(checked) => setIncludeFiltered(!!checked)}
            />
            <Label htmlFor="include-filtered" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Export currently filtered view ({filteredTransactions.length} entries)
            </Label>
           </div>
            <div className="flex items-center space-x-2 opacity-50">
                <Checkbox id="include-all" disabled />
                <Label htmlFor="include-all">Export all transactions (coming soon)</Label>
           </div>
        </div>
        <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
          <Button onClick={handleExportExcel} disabled={isExporting || !includeFiltered || filteredTransactions.length === 0}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            Download as Excel
          </Button>
           <Button variant="outline" onClick={handleExportPdf} disabled={isExporting || !includeFiltered || filteredTransactions.length === 0}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Download as PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
