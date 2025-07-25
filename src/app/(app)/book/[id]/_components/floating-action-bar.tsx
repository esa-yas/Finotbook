
'use client';

import { Button } from '@/components/ui/button';
import { useBook } from '@/contexts/BookContext';
import { Mic, Minus, Plus } from 'lucide-react';

export function FloatingActionBar() {
  const { setTransactionToEdit, setSheetDefaultType, setIsSheetOpen } = useBook();

  const handleAddNew = (type: 'credit' | 'debit') => {
    setTransactionToEdit(null);
    setSheetDefaultType(type);
    setIsSheetOpen(true);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background/80 backdrop-blur-sm p-3 border-t z-40">
      <div className="flex items-center justify-center gap-2 relative">
        <Button
          className="h-12 bg-green-600 hover:bg-green-700 flex-1 text-base font-bold shadow-lg"
          onClick={() => handleAddNew('credit')}
        >
          <Plus className="mr-2 h-5 w-5" />
          Cash In
        </Button>
        <div className="absolute left-1/2 -translate-x-1/2 -top-8">
            <Button
                size="icon"
                className="rounded-full bg-primary h-16 w-16 shadow-lg border-4 border-background"
                aria-label="Add entry with voice"
            >
                <Mic className="h-7 w-7" />
            </Button>
        </div>
        <Button
          className="h-12 bg-red-600 hover:bg-red-700 flex-1 text-base font-bold shadow-lg"
          onClick={() => handleAddNew('debit')}
        >
          <Minus className="mr-2 h-5 w-5" />
          Cash Out
        </Button>
      </div>
    </div>
  );
}
