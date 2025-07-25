
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBusiness } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/db';

const createBusinessSchema = z.object({
  name: z.string().min(2, { message: 'Business name must be at least 2 characters.' }),
  currency: z.string().min(3, { message: 'Please select a currency.'}),
});

type CreateBusinessFormValues = z.infer<typeof createBusinessSchema>;

export function CreateBusinessDialog() {
  const { isCreateBusinessOpen, setIsCreateBusinessOpen, createBusiness } = useBusiness();
  const [loading, setLoading] = useState(false);
  const availableCurrencies = useLiveQuery(() => db.currencies.toArray(), []);


  const form = useForm<CreateBusinessFormValues>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: '',
      currency: 'USD',
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    setIsCreateBusinessOpen(isOpen);
  };

  const onSubmit = async (values: CreateBusinessFormValues) => {
    setLoading(true);
    const newBusiness = await createBusiness(values.name, values.currency);
    if (newBusiness) {
        handleOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={isCreateBusinessOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create New Business</DialogTitle>
            <DialogDescription>
              Give your new business workspace a name and select its currency. You can change this later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Business Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., My Side Hustle, Main Company"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">
                Default Currency
              </Label>
                <Select
                    onValueChange={(value) => form.setValue('currency', value, { shouldValidate: true })}
                    defaultValue={form.getValues('currency')}
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
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Business
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
