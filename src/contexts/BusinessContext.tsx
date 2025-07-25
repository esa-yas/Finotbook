
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Business, type Book, type Category, type PaymentMethod, type BusinessMember, type MemberRole, type Contact, type Currency, Profile } from '@/services/db';
import { syncAllData } from '@/services/sync';

export type { Business, Book, Category, PaymentMethod, BusinessMember, MemberRole, Contact };


interface BusinessContextType {
  currentBusiness: Business | null;
  userBusinesses: Business[];
  books: Book[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  contacts: Contact[];
  businessMembers: BusinessMember[];
  currencies: Currency[];
  loading: {
    userBusinesses: boolean;
    books: boolean;
    members: boolean;
    categories: boolean;
    paymentMethods: boolean;
    contacts: boolean;
    currencies: boolean;
    sync: boolean;
  };
  switchBusiness: (businessId: string) => void;
  createBook: (name: string) => Promise<Book | null>;
  duplicateBook: (bookId: string, newName: string) => Promise<string | null>;
  transferBook: (bookId: string, newBusinessId: string) => Promise<boolean>;
  addCategory: (name: string) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<void>;
  addPaymentMethod: (name: string) => Promise<PaymentMethod | null>;
  deletePaymentMethod: (id: string) => Promise<void>;
  addContact: (name: string, phone?: string) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<void>;
  inviteMember: (email: string, role: 'admin' | 'data_operator') => Promise<boolean>;
  removeMember: (userId: string) => Promise<void>;
  currentUserRole: MemberRole | null;
  isCreateBusinessOpen: boolean;
  setIsCreateBusinessOpen: React.Dispatch<React.SetStateAction<boolean>>;
  createBusiness: (name: string, currency: string) => Promise<Business | null>;
  updateBusiness: (businessId: string, updates: Partial<Business>) => Promise<Business | null>;
  deleteBusiness: (businessId: string) => Promise<boolean>;
  transferOwnership: (businessId: string, newOwnerId: string, password_confirmation: string) => Promise<boolean>;
  getCurrencySymbol: (currencyCode: string) => string;
  refreshData: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, supabase, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState({
    userBusinesses: true,
    books: true,
    members: true,
    categories: true,
    paymentMethods: true,
    contacts: true,
    currencies: true,
    sync: true,
  });
  const [isCreateBusinessOpen, setIsCreateBusinessOpen] = useState(false);
  const syncRanForUser = useRef<string | null>(null);
  

  // --- Live Queries from Local DB ---
  const userProfile = useLiveQuery(() => user ? db.profiles.get(user.id) : undefined, [user?.id]);
  const userBusinesses = useLiveQuery(() => db.businesses.toArray(), [], [] as Business[]);
  const currencies = useLiveQuery(() => db.currencies.toArray(), [], [] as Currency[]);
  
  const userBookIds = useLiveQuery(() => user ? db.bookMembers.where({ user_id: user.id }).toArray(m => m.map(bm => bm.book_id)) : [], [user?.id], []);

  const books = useLiveQuery(
    () => {
        if (!selectedBusinessId || !userBookIds || userBookIds.length === 0) return [];
        
        // Filter books that belong to the selected business AND the user is a member of
        return db.books
            .where('id').anyOf(userBookIds)
            .and(book => book.business_id === selectedBusinessId)
            .toArray();
    },
    [selectedBusinessId, userBookIds], 
    [] as Book[]
  );


  const categories = useLiveQuery(
    () => selectedBusinessId ? db.categories.where('business_id').equals(selectedBusinessId).toArray() : [],
    [selectedBusinessId],
    [] as Category[]
  );

  const paymentMethods = useLiveQuery(
    () => selectedBusinessId ? db.paymentMethods.where('business_id').equals(selectedBusinessId).toArray() : [],
    [selectedBusinessId],
    [] as PaymentMethod[]
  );
  
  const contacts = useLiveQuery(
    () => selectedBusinessId ? db.contacts.where('business_id').equals(selectedBusinessId).toArray() : [],
    [selectedBusinessId],
    [] as Contact[]
  );

  const businessMembers = useLiveQuery(
    () => {
        if (!selectedBusinessId) return [];
        return db.businessMembers.where({ business_id: selectedBusinessId }).toArray();
    },
    [selectedBusinessId],
    [] as BusinessMember[]
  );


  // --- Computed properties ---
  const currentBusiness = useMemo(() => userBusinesses.find(b => b.id === selectedBusinessId) || null, [userBusinesses, selectedBusinessId]);
  const currentUserRole = useMemo(() => businessMembers?.find(m => m.id === user?.id)?.role || null, [businessMembers, user]);

  // --- Actions ---

  const handleSync = useCallback(async (supabaseClient: SupabaseClient, userToSync: User) => {
    setLoading(prev => ({...prev, sync: true}));
    try {
        await syncAllData(supabaseClient, userToSync);
        console.log("Sync complete.");
    } catch (err) {
        console.error("Initial sync failed:", err);
        const errorMessage = (err instanceof Error) ? err.message : "An unknown error occurred during sync.";
        toast({ variant: 'destructive', title: "Sync Failed", description: errorMessage });
    } finally {
        setLoading(prev => ({...prev, sync: false}));
    }
  }, [toast]);

  const refreshData = useCallback(async () => {
    if (user && supabase) {
      toast({ title: "Syncing...", description: "Fetching the latest data from the server." });
      await handleSync(supabase, user);
      toast({ title: "Sync Complete", description: "Your data is up to date." });
    } else {
      toast({ variant: 'destructive', title: "Cannot Sync", description: "You must be logged in to refresh data." });
    }
  }, [user, supabase, handleSync, toast]);
  

  // Sync data from Supabase to local DB when user is available and a business is potentially selected
  useEffect(() => {
    // This now loads local data immediately and syncs in the background.
    const lastSelectedId = localStorage.getItem('selectedBusinessId');
    if (lastSelectedId) {
        setSelectedBusinessId(lastSelectedId);
    }
    
    // Set loading to false for locally available data to make the app feel faster
    setLoading(prev => ({
        ...prev,
        userBusinesses: false,
        books: false,
        members: false,
        categories: false,
        paymentMethods: false,
        contacts: false,
        currencies: false,
    }));


    if (user && supabase && user.id !== syncRanForUser.current) {
        syncRanForUser.current = user.id;
        handleSync(supabase, user);
    } else if (!user && !authLoading) {
        db.delete().then(() => db.open());
        setSelectedBusinessId(null);
        syncRanForUser.current = null;
        setLoading(prev => ({...prev, sync: false}));
    } else if (user && syncRanForUser.current === user.id) {
      // Sync has already run for this session, no need to re-sync unless manually triggered.
      setLoading(prev => ({ ...prev, sync: false }));
    }
  }, [user, supabase, authLoading, handleSync]);
  
  useEffect(() => {
    // This effect ensures the initial business is set once data is loaded from Dexie.
    if (!selectedBusinessId && userBusinesses.length > 0) {
      const lastId = localStorage.getItem('selectedBusinessId');
      if (lastId && userBusinesses.some(b => b.id === lastId)) {
        setSelectedBusinessId(lastId);
      } else {
        // Fallback to the first business if last selected is invalid or not set
        setSelectedBusinessId(userBusinesses[0].id);
      }
    }
  }, [userBusinesses, selectedBusinessId]);


  const switchBusiness = (businessId: string) => {
    if (!user || !supabase) return;
    
    setSelectedBusinessId(businessId);
    localStorage.setItem('selectedBusinessId', businessId);
    
    supabase
      .from('profiles')
      .update({ last_selected_business_id: businessId })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) {
          console.error("Failed to save last selected business to DB:", error);
        }
      });
  };
  
  const createBusiness = async (name: string, currency: string): Promise<Business | null> => {
    if (!supabase || !user) return null;

    try {
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata.full_name
        });
        if (profileError) throw profileError;
    
        const { data: newBusiness, error: businessError } = await supabase.from('businesses')
            .insert({ name, owner_id: user.id, currency })
            .select()
            .single();
        if (businessError) throw businessError;

        await db.businesses.put(newBusiness);

        const { error: memberError } = await supabase.from('business_members')
            .insert({ business_id: newBusiness.id, user_id: user.id, role: 'owner' });
        if (memberError) throw memberError;

        const newMember: BusinessMember = {
            id: user.id,
            business_id: newBusiness.id,
            email: user.email || 'No Email',
            full_name: user.user_metadata.full_name,
            role: 'owner'
        };

        await db.businessMembers.put(newMember);

        switchBusiness(newBusiness.id);
        toast({ title: 'Success!', description: `Business "${name}" created.` });
        return newBusiness;

    } catch (error: any) {
        console.error("Error creating business", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create business.' });
        return null;
    }
  }

  const updateBusiness = async (businessId: string, updates: Partial<Business>): Promise<Business | null> => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase.from('businesses')
            .update(updates)
            .eq('id', businessId)
            .select()
            .single();
        if (error) throw error;
        
        await db.businesses.update(businessId, data);
        toast({ title: 'Success!', description: 'Business profile updated.' });
        return data;
    } catch(error: any) {
        console.error('Error updating business:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update business profile.' });
        return null;
    }
  };


  const deleteBusiness = async (businessId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const { error } = await supabase.rpc('delete_business', { p_business_id: businessId });
        if (error) throw error;
        
        await db.businesses.delete(businessId);
        const booksToDelete = await db.books.where({ business_id: businessId }).primaryKeys();
        if (booksToDelete.length > 0) {
          await db.books.bulkDelete(booksToDelete);
          const transactionsToDelete = await db.transactions.where('book_id').anyOf(booksToDelete).primaryKeys();
          await db.transactions.bulkDelete(transactionsToDelete);
          await db.bookMembers.where('book_id').anyOf(booksToDelete).delete();
          await db.bookCustomFields.where('book_id').anyOf(booksToDelete).delete();
        }
        await db.businessMembers.where({ business_id: businessId }).delete();
        await db.categories.where({ business_id: businessId }).delete();
        await db.paymentMethods.where({ business_id: businessId }).delete();
        await db.contacts.where({ business_id: businessId }).delete();


        toast({ title: 'Success!', description: 'Business has been permanently deleted.' });
        router.push('/books'); 
        return true;
    } catch (error: any) {
        console.error('Error deleting business:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete business.' });
        return false;
    }
  };

  const transferOwnership = async (businessId: string, newOwnerId: string, password_confirmation: string): Promise<boolean> => {
    if (!supabase || !user) return false;
    
    try {
        // 1. Re-authenticate user with their password
        const { error: reauthError } = await supabase.auth.reauthenticate();
        if(reauthError) {
          // This path is tricky because reauthenticate redirects. Let's try signIn.
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: password_confirmation,
          });
          if (signInError) {
            toast({ variant: 'destructive', title: 'Authentication Failed', description: 'The password you entered is incorrect.' });
            return false;
          }
        }

        // 2. Call the RPC function to perform the transfer
        const { error: rpcError } = await supabase.rpc('transfer_business_ownership', {
            p_business_id: businessId,
            p_new_owner_id: newOwnerId
        });

        if (rpcError) throw rpcError;

        // 3. Manually update local state to reflect the change immediately
        await db.businesses.update(businessId, { owner_id: newOwnerId });
        await db.businessMembers.where({ business_id: businessId, user_id: user.id }).modify({ role: 'admin' });
        await db.businessMembers.where({ business_id: businessId, user_id: newOwnerId }).modify({ role: 'owner' });

        return true;

    } catch (error: any) {
        console.error("Error transferring ownership:", error);
        toast({ variant: 'destructive', title: 'Transfer Failed', description: error.message || 'An unexpected error occurred.'});
        return false;
    }
  }


  const createBook = async (name: string): Promise<Book | null> => {
    if (!supabase || !user || !currentBusiness) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication error or no business selected.' });
      return null;
    }
  
    try {
      // Ensure profile exists before creating related records
      const { error: profileError } = await supabase.from('profiles').upsert({ id: user.id, email: user.email, full_name: user.user_metadata.full_name });
      if (profileError) throw profileError;

      const { data: newBookData, error: insertError } = await supabase
        .from('books')
        .insert({ name, business_id: currentBusiness.id, owner_id: user.id, currency: currentBusiness.currency })
        .select()
        .single();
      if (insertError) throw insertError;
      
      const newBook: Book = { ...newBookData, balance: 0 };
      await db.books.add(newBook);

      const { error: memberError } = await supabase
        .from('book_members')
        .insert({ book_id: newBook.id, user_id: user.id });
      if (memberError && memberError.code !== '23505') {
         throw memberError;
      }
      
      await db.bookMembers.add({ book_id: newBook.id, user_id: user.id });
  
      toast({ title: 'Success', description: `Book "${name}" created.` });
      return newBook;
  
    } catch (error: any) {
      console.error("Error creating book:", error);
      toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
      return null;
    }
  };

  const duplicateBook = async (bookId: string, newName: string): Promise<string | null> => {
    if (!supabase || !currentBusiness || !user) return null;
    try {
      const { data: newBookId, error } = await supabase.rpc('duplicate_book', {
        p_book_id: bookId,
        p_new_book_name: newName,
        p_user_id: user.id, // Pass the current user's ID
      });

      if (error) throw error;
      
      await handleSync(supabase, user);

      toast({ title: 'Success', description: 'Book duplicated successfully.' });
      return newBookId;
    } catch (error: any) {
      console.error('Error duplicating book:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not duplicate the book.' });
      return null;
    }
  };


  const transferBook = async (bookId: string, newBusinessId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
      const { error } = await supabase.rpc('transfer_book', {
        p_book_id: bookId,
        p_new_business_id: newBusinessId,
      });
      if (error) throw error;

      await db.books.delete(bookId);

      toast({ title: 'Success!', description: 'Book has been transferred.' });
      return true;
    } catch (error: any) {
      console.error('Error transferring book:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to transfer book.' });
      return false;
    }
  };

  const inviteMember = async (email: string, role: 'admin' | 'data_operator'): Promise<boolean> => {
    if (!supabase || !user || !currentBusiness) return false;
    try {
        const { error } = await supabase
            .from('business_invitations')
            .insert({ business_id: currentBusiness.id, email, role });
        
        if (error) {
            if (error.code === '23505') { // unique constraint violation
                toast({ variant: 'destructive', title: 'Invitation Pending', description: 'An invitation has already been sent to this user for this business.' });
                return false;
            }
            throw error;
        }

        toast({ title: 'Invitation Sent!', description: `An invitation has been sent to ${email}.` });
        return true;

    } catch (error: any)
     {
        console.error("Error inviting member:", error);
        toast({ variant: 'destructive', title: 'Invitation Failed', description: error.message || 'An unexpected error occurred.' });
        return false;
    }
  }

  const removeMember = async (userId: string): Promise<void> => {
    if (!supabase || !currentBusiness) return;
    try {
        const { error } = await supabase
            .from('business_members')
            .delete()
            .eq('business_id', currentBusiness.id)
            .eq('user_id', userId);
        
        if (error) throw error;

        await db.businessMembers.where({ id: userId, business_id: currentBusiness.id }).delete();
        toast({ title: 'Member Removed', description: 'The user has been removed from your business.' });
    } catch (error: any) {
        console.error("Error removing member:", error);
        toast({ variant: 'destructive', title: 'Removal Failed', description: error.message });
    }
  }

  const addCategory = async (name: string): Promise<Category | null> => {
      if (!supabase || !currentBusiness) return null;
      try {
          const { data, error } = await supabase.from('transaction_categories').insert({ name, business_id: currentBusiness.id }).select().single();
           if (error) {
              if (error.code === '23505') { 
                 toast({ variant: 'destructive', title: 'Error', description: 'This category already exists.'})
                 return null;
              }
              throw error;
          }
          await db.categories.add(data);
          return data;
      } catch (error: any) {
          console.error("Failed to add category", error)
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to add new category.'})
          return null;
      }
  }

  const deleteCategory = async (id: string): Promise<void> => {
    if (!supabase) return;
    try {
        const { error } = await supabase.from('transaction_categories').delete().eq('id', id);
        if (error) throw error;
        await db.categories.delete(id);
    } catch (error: any) {
        console.error("Failed to delete category", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete category.'});
    }
  }

  const addPaymentMethod = async (name: string): Promise<PaymentMethod | null> => {
      if (!supabase || !currentBusiness) return null;
      try {
          const { data, error } = await supabase.from('payment_methods').insert({ name, business_id: currentBusiness.id }).select().single();
           if (error) {
              if (error.code === '23505') { // unique_violation
                 toast({ variant: 'destructive', title: 'Error', description: 'This payment method already exists.'})
                 return null;
              }
              throw error;
          }
          await db.paymentMethods.add(data);
          return data;
      } catch (error: any) {
          console.error("Failed to add payment method", error);
           toast({ variant: 'destructive', title: 'Error', description: 'Failed to add new payment method.'})
          return null;
      }
  }

  const deletePaymentMethod = async (id: string): Promise<void> => {
    if (!supabase) return;
    try {
        const { error } = await supabase.from('payment_methods').delete().eq('id', id);
        if (error) throw error;
        await db.paymentMethods.delete(id);
    } catch (error: any) {
        console.error("Failed to delete payment method", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete payment method.'});
    }
  }

  const addContact = async (name: string, phone?: string): Promise<Contact | null> => {
    if (!supabase || !currentBusiness) return null;
    try {
        const { data, error } = await supabase.from('contacts').insert({ name, phone_number: phone, business_id: currentBusiness.id }).select().single();
         if (error) {
            if (error.code === '23505') { 
               toast({ variant: 'destructive', title: 'Error', description: 'A contact with this name already exists.'})
               return null;
            }
            throw error;
        }
        await db.contacts.add(data);
        return data;
    } catch (error: any) {
        console.error("Failed to add contact", error)
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to add new contact.'})
        return null;
    }
  };
  
  const deleteContact = async (id: string): Promise<void> => {
      if (!supabase) return;
      try {
          const { error } = await supabase.from('contacts').delete().eq('id', id);
          if (error) throw error;
          await db.contacts.delete(id);
      } catch (error: any) {
          console.error("Failed to delete contact", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete contact.'});
      }
  };
  
  const getCurrencySymbol = (currencyCode: string) => {
    if (!currencies) return '$';
    const currency = currencies.find(c => c.code === currencyCode);
    return currency ? currency.symbol : '$';
  };

  const value: BusinessContextType = {
    currentBusiness,
    userBusinesses,
    books: books || [],
    categories: categories || [],
    paymentMethods: paymentMethods || [],
    contacts: contacts || [],
    businessMembers: businessMembers || [],
    currencies: currencies || [],
    loading,
    switchBusiness,
    createBook,
    duplicateBook,
    transferBook,
    addCategory,
    deleteCategory,
    addPaymentMethod,
    deletePaymentMethod,
    addContact,
    deleteContact,
    inviteMember,
    removeMember,
    currentUserRole,
    isCreateBusinessOpen,
    setIsCreateBusinessOpen,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    transferOwnership,
    getCurrencySymbol,
    refreshData,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
