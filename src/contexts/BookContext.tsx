
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Transaction, type BookCustomField, type Book, type BusinessMember } from '@/services/db';
import type { User } from '@supabase/supabase-js';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, subDays } from 'date-fns';

// Define types for our data
export type TransactionType = 'credit' | 'debit';
export type { Transaction, BookCustomField, Book };

export type NewTransaction = Omit<Transaction, 'id' | 'book_id' | 'created_at' | 'user_id' | 'user_email' | 'user_full_name' | 'custom_fields'> & {
    custom_fields?: Record<string, any>;
};
export type UpdatableTransaction = Partial<Omit<Transaction, 'id' | 'book_id' | 'user_id' | 'user_email' | 'user_full_name'>>;

export type DateFilter = 'all' | 'today' | 'yesterday' | 'this_month' | 'last_month' | { from: Date; to: Date };

interface BookFilters {
  date: DateFilter;
  type: 'all' | 'credit' | 'debit';
  member: 'all' | string; // user_id
  search: string;
  category: 'all' | string;
  paymentMode: 'all' | string;
  contact: 'all' | string;
}

interface BookContextType {
  book: Book | null;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  bookCustomFields: BookCustomField[];
  bookMembers: BusinessMember[];
  loading: boolean;
  user: User | null;
  filters: BookFilters;
  setFilters: React.Dispatch<React.SetStateAction<BookFilters>>;
  addTransaction: (transaction: NewTransaction) => Promise<Transaction | null>;
  bulkAddTransactions: (transactions: NewTransaction[]) => Promise<boolean>;
  updateTransaction: (id: string, updates: UpdatableTransaction) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<void>;
  renameBook: (newName: string) => Promise<boolean>;
  updateBookCurrency: (newCurrency: string) => Promise<boolean>;
  deleteBook: () => Promise<boolean>;
  addBookCustomField: (fieldName: string) => Promise<boolean>;
  deleteBookCustomField: (fieldId: string) => Promise<void>;
  toggleBookCustomField: (fieldId: string, isEnabled: boolean) => Promise<void>;
  toggleBookCustomFieldRequired: (fieldId: string, isRequired: boolean) => Promise<void>;
  addBookMember: (userId: string) => Promise<boolean>;
  removeBookMember: (userId: string) => Promise<void>;
  isSheetOpen: boolean;
  setIsSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  transactionToEdit: Transaction | null;
  setTransactionToEdit: React.Dispatch<React.SetStateAction<Transaction | null>>;
  sheetDefaultType: 'credit' | 'debit';
  setSheetDefaultType: React.Dispatch<React.SetStateAction<'credit' | 'debit'>>;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

interface BookProviderProps {
  children: ReactNode;
  bookId: string;
}

export const BookProvider = ({ children, bookId }: BookProviderProps) => {
  const { user, supabase } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // State for the transaction sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [sheetDefaultType, setSheetDefaultType] = useState<'credit' | 'debit'>('credit');

  const [filters, setFilters] = useState<BookFilters>({
    date: 'all',
    type: 'all',
    member: 'all',
    search: '',
    category: 'all',
    paymentMode: 'all',
    contact: 'all',
  });


  // --- Live Queries from Local DB ---
  const book = useLiveQuery(() => db.books.get(bookId), [bookId], null);

  const transactions = useLiveQuery(
    () => db.transactions.where('book_id').equals(bookId).reverse().sortBy('date'),
    [bookId],
    [] as Transaction[]
  );

  const bookCustomFields = useLiveQuery(
    () => db.bookCustomFields.where('book_id').equals(bookId).sortBy('created_at'),
    [bookId],
    [] as BookCustomField[]
  );
  
  const bookMemberIds = useLiveQuery(
    () => db.bookMembers.where({ book_id: bookId }).toArray(members => members.map(m => m.user_id)),
    [bookId],
    []
  );

  const bookMembers = useLiveQuery(
      () => db.businessMembers.where('id').anyOf(bookMemberIds || []).toArray(),
      [bookMemberIds],
      [] as BusinessMember[]
  );

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter(t => {
      // Type filter
      if (filters.type !== 'all' && t.type !== filters.type) {
        return false;
      }
      // Member filter
      if (filters.member !== 'all' && t.user_id !== filters.member) {
        return false;
      }
      // Category filter
      if (filters.category !== 'all' && t.category !== filters.category) {
        return false;
      }
      // Payment Mode filter
      if (filters.paymentMode !== 'all' && t.payment_mode !== filters.paymentMode) {
        return false;
      }
      // Contact filter
      if (filters.contact !== 'all' && t.contact_id !== filters.contact) {
        return false;
      }
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const inDescription = t.description.toLowerCase().includes(searchTerm);
        const inAmount = String(t.amount).includes(searchTerm);
        if (!inDescription && !inAmount) {
          return false;
        }
      }
      // Date filter
      const transactionDate = new Date(t.date);
      if (typeof filters.date !== 'string') {
        const startDate = startOfDay(filters.date.from);
        const endDate = endOfDay(filters.date.to);
        if (transactionDate < startDate || transactionDate > endDate) {
          return false;
        }
      } else if (filters.date !== 'all') {
          const now = new Date();
          let startDate: Date, endDate: Date;

          if (filters.date === 'today') {
              startDate = startOfDay(now);
              endDate = endOfDay(now);
          } else if (filters.date === 'yesterday') {
              const yesterday = subDays(now, 1);
              startDate = startOfDay(yesterday);
              endDate = endOfDay(yesterday);
          } else if (filters.date === 'this_month') {
              startDate = startOfMonth(now);
              endDate = endOfMonth(now);
          } else { // last_month
              const lastMonth = subMonths(now, 1);
              startDate = startOfMonth(lastMonth);
              endDate = endOfMonth(lastMonth);
          }
          
          if (transactionDate < startDate || transactionDate > endDate) {
            return false;
          }
      }
      return true;
    });
  }, [transactions, filters]);
  
  const loading = !book || !transactions || !bookCustomFields || !bookMembers;

  const addTransaction = async (transaction: NewTransaction): Promise<Transaction | null> => {
    if (!supabase || !book || !user) {
      toast({ variant: 'destructive', description: 'Cannot add transaction: Not authenticated or book not loaded.' });
      return null;
    }
    
    const userProfile = await db.profiles.get(user.id);
    
    const transactionToInsert = {
      ...transaction,
      book_id: book.id,
      user_id: user.id,
      user_email: user.email || 'Unknown',
      user_full_name: userProfile?.full_name || user.user_metadata.full_name,
    };

    try {
      const { data, error } = await supabase.from('transactions').insert(transactionToInsert).select().single();
      if (error) throw error;
      
      await db.transactions.add(data as Transaction);
      return data as Transaction;
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: error.message || 'Could not save the transaction.' });
      return null;
    }
  };

  const bulkAddTransactions = async (transactions: NewTransaction[]): Promise<boolean> => {
    if (!supabase || !book || !user) {
      toast({ variant: 'destructive', description: 'Cannot add transactions: Not authenticated or book not loaded.' });
      return false;
    }

    const userProfile = await db.profiles.get(user.id);

    const transactionsToInsert = transactions.map(t => ({
      ...t,
      book_id: book.id,
      user_id: user.id,
      user_email: user.email || 'Unknown',
      user_full_name: userProfile?.full_name || user.user_metadata.full_name,
    }));

    try {
      const { data, error } = await supabase.from('transactions').insert(transactionsToInsert).select();
      if (error) throw error;
      
      await db.transactions.bulkAdd(data as Transaction[]);
      
      toast({ title: 'Success', description: `${transactions.length} transactions have been added.` });
      return true;
    } catch (error: any) {
      console.error('Error bulk adding transactions:', error);
      toast({ variant: 'destructive', title: 'Import Failed', description: error.message || 'Could not save the imported transactions.' });
      return false;
    }
  };
  
  const updateTransaction = async (id: string, updates: UpdatableTransaction): Promise<Transaction | null> => {
    if (!supabase) {
        toast({ variant: 'destructive', description: 'Cannot update transaction: Not authenticated.' });
        return null;
    }
    try {
        const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select().single();
        if (error) throw error;

        await db.transactions.update(id, data);
        return data as Transaction;
    } catch (error: any) {
        console.error('Error updating transaction:', error);
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message || 'Could not update the transaction.' });
        return null;
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    if (!supabase) {
        toast({ variant: 'destructive', description: 'Cannot delete transaction: Not authenticated.' });
        return;
    }
    try {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;

        await db.transactions.delete(id);
        toast({ title: 'Success', description: 'Transaction deleted.' });
    } catch(error: any) {
        console.error('Error deleting transaction:', error);
        toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message || 'Could not delete the transaction.' });
    }
  };

  const renameBook = async (newName: string): Promise<boolean> => {
    if (!supabase || !book) return false;
    try {
      const { data, error } = await supabase.from('books').update({ name: newName }).eq('id', book.id).select().single();
      if (error) throw error;
      
      await db.books.update(book.id, data);
      
      toast({ title: 'Success', description: 'Book renamed successfully.' });
      return true;
    } catch (error: any) {
      console.error('Error renaming book:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not rename the book.' });
      return false;
    }
  };
  
  const updateBookCurrency = async (newCurrency: string): Promise<boolean> => {
    if (!supabase || !book) return false;
    try {
      const { data, error } = await supabase.from('books').update({ currency: newCurrency }).eq('id', book.id).select().single();
      if (error) throw error;

      await db.books.update(book.id, data);
      
      toast({ title: 'Success', description: 'Book currency updated.' });
      return true;
    } catch (error: any) {
      console.error('Error updating book currency:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update the currency.' });
      return false;
    }
  };

  const deleteBook = async (): Promise<boolean> => {
    if (!supabase || !book) return false;
    try {
      // First, delete the book from the remote DB. The RPC function handles cascading deletes.
      const { error } = await supabase.rpc('delete_book', { p_book_id: book.id });
      if (error) throw error;
      
      // Then, delete the book and its related data from the local DB.
      await db.transaction('rw', db.books, db.transactions, db.bookMembers, db.bookCustomFields, async () => {
        await db.books.delete(book.id);
        await db.transactions.where({ book_id: book.id }).delete();
        await db.bookMembers.where({ book_id: book.id }).delete();
        await db.bookCustomFields.where({ book_id: book.id }).delete();
      });
      
      toast({ title: 'Success', description: 'Book has been permanently deleted.' });
      router.push('/books');
      return true;
    } catch (error: any) {
      console.error('Error deleting book:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the book.' });
      return false;
    }
  };


  const addBookCustomField = async (fieldName: string): Promise<boolean> => {
    if (!supabase || !book) return false;
    try {
      const { data, error } = await supabase.from('book_custom_fields').insert({ book_id: book.id, field_name: fieldName }).select().single();
      if (error) throw error;
      
      await db.bookCustomFields.add(data);
      return true;
    } catch (error: any) {
      console.error('Error adding custom field:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'A field with this name might already exist.',
      });
      return false;
    }
  };

  const deleteBookCustomField = async (fieldId: string): Promise<void> => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('book_custom_fields').delete().eq('id', fieldId);
      if (error) throw error;

      await db.bookCustomFields.delete(fieldId);
    } catch (error: any) {
      console.error('Error deleting custom field:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete custom field.' });
    }
  };

  const toggleBookCustomField = async (fieldId: string, isEnabled: boolean): Promise<void> => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('book_custom_fields').update({ is_enabled: isEnabled }).eq('id', fieldId);
      if (error) throw error;

      await db.bookCustomFields.update(fieldId, { is_enabled: isEnabled });
    } catch (error: any) {
      console.error('Error toggling custom field:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update custom field status.' });
    }
  };

  const toggleBookCustomFieldRequired = async (fieldId: string, isRequired: boolean): Promise<void> => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('book_custom_fields').update({ is_required: isRequired }).eq('id', fieldId);
      if(error) throw error;

      await db.bookCustomFields.update(fieldId, { is_required: isRequired });
    } catch (error: any) {
      console.error('Error toggling custom field required status:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update custom field required status.' });
    }
  };

  const addBookMember = async (userId: string): Promise<boolean> => {
    if (!supabase || !book || !user) return false;
    try {
        const { error: memberError } = await supabase.from('book_members').insert({ book_id: book.id, user_id: userId });
        if(memberError) throw memberError;

        await db.bookMembers.add({ book_id: book.id, user_id: userId });
        
        const { error: notificationError } = await supabase.from('notifications').insert({
                recipient_id: userId,
                sender_id: user.id,
                type: 'book_access_granted',
                message: `You have been granted access to the cashbook: ${book.name}.`,
                metadata: { bookId: book.id, bookName: book.name }
            });
        if(notificationError) console.error("Error creating notification, but proceeding:", notificationError);

        return true;
    } catch (error: any) {
        console.error('Error adding book member:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add member to the book.' });
        return false;
    }
  };

  const removeBookMember = async (userId: string): Promise<void> => {
    if (!supabase || !book) return;
    try {
        const { error } = await supabase.from('book_members').delete().eq('book_id', book.id).eq('user_id', userId);
        if (error) throw error;

        const recordToDelete = await db.bookMembers.where({ book_id: book.id, user_id: userId }).first();
        if (recordToDelete) {
            await db.bookMembers.delete(recordToDelete.id!);
        }

    } catch (error: any) {
        console.error('Error removing book member:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not remove member from the book.' });
    }
  };


  const value: BookContextType = {
    book,
    transactions: transactions || [],
    filteredTransactions,
    bookCustomFields: bookCustomFields || [],
    bookMembers: bookMembers || [],
    loading,
    user,
    filters,
    setFilters,
    addTransaction,
    bulkAddTransactions,
    updateTransaction,
    deleteTransaction,
    renameBook,
    updateBookCurrency,
    deleteBook,
    addBookCustomField,
    deleteBookCustomField,
    toggleBookCustomField,
    toggleBookCustomFieldRequired,
    addBookMember,
    removeBookMember,
    isSheetOpen,
    setIsSheetOpen,
    transactionToEdit,
    setTransactionToEdit,
    sheetDefaultType,
    setSheetDefaultType,
  };

  return (
    <BookContext.Provider value={value}>
      {children}
    </BookContext.Provider>
  );
};

export const useBook = () => {
  const context = useContext(BookContext);
  if (context === undefined) {
    throw new Error('useBook must be used within a BookProvider');
  }
  return context;
};
