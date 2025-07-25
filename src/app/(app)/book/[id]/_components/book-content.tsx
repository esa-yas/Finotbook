
'use client';

import { useBook } from '@/contexts/BookContext';
import { DashboardView } from './dashboard-view';
import { BreakdownView } from './breakdown-view';
import { BookHeader } from './book-header';
import dynamic from 'next/dynamic';
import { FloatingActionBar } from './floating-action-bar';
import { FilterBar } from './filter-bar';

const AddTransactionSheet = dynamic(() => 
  import('./add-transaction-sheet').then(mod => mod.AddTransactionSheet), 
  { ssr: false }
);

export function BookContent() {
  const { isSheetOpen, setIsSheetOpen, transactionToEdit, setTransactionToEdit, sheetDefaultType } = useBook();

  return (
    // Add pb-24 for padding at the bottom to not overlap with the fixed action bar on mobile
    <div className="flex flex-col h-full space-y-6 pb-24 md:pb-0">
      <BookHeader />
      <FilterBar />
      <DashboardView />
      <BreakdownView />
      
      {isSheetOpen && (
        <AddTransactionSheet
          open={isSheetOpen}
          onOpenChange={(open) => {
            if (!open) {
              setTransactionToEdit(null);
            }
            setIsSheetOpen(open);
          }}
          defaultType={sheetDefaultType}
          transactionToEdit={transactionToEdit}
        />
      )}
      <FloatingActionBar />
    </div>
  );
}
