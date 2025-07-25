
'use client';

import { useBook } from '@/contexts/BookContext';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, MinusCircle, Scale } from 'lucide-react';
import { useMemo } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import ChatView from './chat-view';

export function DashboardView() {
  const { transactions, book } = useBook(); // Use all transactions for accurate totals
  const { getCurrencySymbol } = useBusiness();
  const currencySymbol = getCurrencySymbol(book?.currency || 'USD');

  const { totalCredit, totalDebit, netBalance } = useMemo(() => {
    const credit = transactions
      .filter((t) => t.type === 'credit')
      .reduce((acc, t) => acc + t.amount, 0);

    const debit = transactions
      .filter((t) => t.type === 'debit')
      .reduce((acc, t) => acc + t.amount, 0);

    const balance = credit - debit;

    return { totalCredit: credit, totalDebit: debit, netBalance: balance };
  }, [transactions]); // Depend on the full transaction list

  const formatAmount = (amount: number) => {
      return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50">
              <div className="bg-white p-3 rounded-full border border-green-200">
                  <PlusCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash In</p>
                <p className="text-2xl font-bold text-green-600">{formatAmount(totalCredit)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-lg bg-red-50">
              <div className="bg-white p-3 rounded-full border border-red-200">
                  <MinusCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash Out</p>
                <p className="text-2xl font-bold text-red-600">{formatAmount(totalDebit)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-blue-50">
              <div className="bg-white p-3 rounded-full border border-blue-200">
                  <Scale className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Balance</p>
                <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-destructive'}`}>
                  {formatAmount(netBalance)}
                </p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
      <ChatView />
    </div>
  );
}
