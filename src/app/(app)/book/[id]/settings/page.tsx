
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useBook } from '@/contexts/BookContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookMembersSettings } from './_components/book-members-settings';
import { EntryFieldsSettings } from './_components/entry-fields-settings';
import { DeleteBookDialog } from './_components/delete-book-dialog';
import { RenameBookDialog } from './_components/rename-book-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertTriangle, Pencil, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useIsClient } from '@/hooks/use-is-client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/db';

const currencyFormSchema = z.object({
    currency: z.string().min(3, { message: 'Please select a currency.' }),
});
type CurrencyFormValues = z.infer<typeof currencyFormSchema>;


export default function BookSettingsPage() {
  const { book, loading, updateBookCurrency } = useBook();
  const isClient = useIsClient();
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('members');
  const availableCurrencies = useLiveQuery(() => db.currencies.toArray(), []);
  
  const form = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencyFormSchema),
    values: { currency: book?.currency || 'USD' },
  });
  
  const { isSubmitting, isDirty } = form.formState;

  const onCurrencySubmit = async (values: CurrencyFormValues) => {
    const success = await updateBookCurrency(values.currency);
    if (success) {
      form.reset({ currency: values.currency });
    }
  };


  if (!isClient || loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!book) {
    // This case is handled by the layout, but as a fallback:
    return null;
  }

  return (
    <>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                <Link href={`/book/${book.id}`}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to book</span>
                </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Book Settings</h1>
              <p className="text-muted-foreground">
                Manage settings for <span className="font-semibold">{book.name}</span>.
              </p>
            </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 p-1 h-auto rounded-lg bg-muted shadow-sm border">
                <TabsTrigger 
                    value="members"
                    className="w-full p-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    Members
                </TabsTrigger>
                <TabsTrigger 
                    value="entry-fields"
                    className="w-full p-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    Entry Fields
                </TabsTrigger>
            </TabsList>
            <TabsContent value="members" className="mt-6">
                <BookMembersSettings />
            </TabsContent>
            <TabsContent value="entry-fields" className="mt-6">
                <EntryFieldsSettings />
            </TabsContent>
        </Tabs>
        
        <Card>
          <CardHeader>
            <CardTitle>Book Currency</CardTitle>
            <CardDescription>Set the currency for this specific book. This will affect how balances are displayed.</CardDescription>
          </CardHeader>
          <form onSubmit={form.handleSubmit(onCurrencySubmit)}>
             <CardContent>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Select
                        onValueChange={(value) => form.setValue('currency', value, { shouldValidate: true, shouldDirty: true })}
                        defaultValue={form.getValues('currency')}
                        disabled={isSubmitting}
                    >
                        <SelectTrigger id="currency">
                            <SelectValue placeholder="Select a currency..." />
                        </SelectTrigger>
                        <SelectContent>
                            {(availableCurrencies || []).map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                    {c.name} ({c.symbol})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     {form.formState.errors.currency && (
                        <p className="text-sm text-red-500 mt-1">{form.formState.errors.currency.message}</p>
                    )}
                </div>
            </CardContent>
             <CardContent className="flex justify-between items-center">
                <Button type="submit" disabled={isSubmitting || !isDirty}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Currency
                </Button>
            </CardContent>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rename Book</CardTitle>
            <CardDescription>Change the name of your cashbook. This will be visible to all members.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-sm font-medium">Current name: <span className="font-bold">{book.name}</span></p>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
            </CardTitle>
            <CardDescription>This action is permanent and cannot be undone.</CardDescription>
          </CardHeader>
           <CardContent className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold">Delete this Book</h4>
              <p className="text-sm text-muted-foreground">All transactions within this book will be lost.</p>
            </div>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              Delete Book
            </Button>
          </CardContent>
        </Card>

      </div>
      
      <RenameBookDialog 
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
      />
      <DeleteBookDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  );
}
