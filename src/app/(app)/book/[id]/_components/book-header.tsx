
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBook } from '@/contexts/BookContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Users, ArrowLeft, Download, Plus, Search, Pencil, FileText, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RenameBookDialog } from '../settings/_components/rename-book-dialog';
import { BulkEntryDialog } from './bulk-entry-dialog';
import { ExportDialog } from './export-dialog';


export function BookHeader() {
  const router = useRouter();
  const { book, bookMembers, loading, setTransactionToEdit, setIsSheetOpen, setSheetDefaultType, filters, setFilters } = useBook();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isBulkEntryDialogOpen, setIsBulkEntryDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const handleAddNew = (type: 'credit' | 'debit') => {
    setTransactionToEdit(null);
    setSheetDefaultType(type);
    setIsSheetOpen(true);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: event.target.value }));
  };


  const memberNames = bookMembers.map(m => m.email?.split('@')[0]).join(', ');

  if (loading) {
    return (
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Mobile Header */}
        <div className="flex items-center justify-between gap-4 md:hidden">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2" onClick={() => router.push('/books')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
                <div className="flex items-center gap-1">
                    <h1 className="text-lg font-bold truncate max-w-[150px]">{book?.name}</h1>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setIsRenameDialogOpen(true)}>
                        <Pencil className="h-3 w-3" />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{memberNames}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
             <Link href={`/book/${book?.id}/settings`}>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <UserPlus className="h-5 w-5" />
                </Button>
             </Link>
             <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsExportDialogOpen(true)}>
                <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.push('/books')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
                <h1 className="text-xl font-bold truncate">{book?.name}</h1>
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsRenameDialogOpen(true)}>
                    <Pencil className="h-4 w-4" />
                </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <Link href={`/book/${book?.id}/settings`}>
              <Button variant="outline" className="h-9">
                <Settings className="mr-2 h-4 w-4" /> Book Settings
              </Button>
            </Link>
             <Link href="/team">
                <Button variant="outline" className="h-9">
                    <Users className="mr-2 h-4 w-4" /> Team
                </Button>
             </Link>
          </div>
        </div>
        
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by remark or amount..."
            className="pl-10 h-11"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="hidden md:flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
                <Button variant="outline" className="h-11 flex-1 md:flex-auto" onClick={() => setIsBulkEntryDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4"/> Add Bulk Entries
                </Button>
                <Button variant="outline" className="h-11 flex-1 md:flex-auto" onClick={() => setIsExportDialogOpen(true)}>
                    <Download className="mr-2 h-4 w-4"/> Reports
                </Button>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <Button className="h-11 bg-green-600 hover:bg-green-700 flex-1 md:flex-auto" onClick={() => handleAddNew('credit')}>
                    Cash In
                </Button>
                 <Button className="h-11 bg-red-600 hover:bg-red-700 flex-1 md:flex-auto" onClick={() => handleAddNew('debit')}>
                    Cash Out
                </Button>
            </div>
        </div>
      </div>
      
      <RenameBookDialog 
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
      />
      <BulkEntryDialog
        open={isBulkEntryDialogOpen}
        onOpenChange={setIsBulkEntryDialogOpen}
      />
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />
    </>
  );
}
