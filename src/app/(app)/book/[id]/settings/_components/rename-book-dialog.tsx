
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBook } from '@/contexts/BookContext';
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

const renameBookSchema = z.object({
  name: z.string().min(2, { message: 'Book name must be at least 2 characters.' }),
});

type RenameBookFormValues = z.infer<typeof renameBookSchema>;

interface RenameBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameBookDialog({ open, onOpenChange }: RenameBookDialogProps) {
  const { book, renameBook } = useBook();
  const [loading, setLoading] = useState(false);

  const form = useForm<RenameBookFormValues>({
    resolver: zodResolver(renameBookSchema),
  });
  
  useEffect(() => {
    if (book) {
      form.reset({ name: book.name });
    }
  }, [book, open, form]);

  const onSubmit = async (values: RenameBookFormValues) => {
    setLoading(true);
    const success = await renameBook(values.name);
    if (success) {
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Rename Book</DialogTitle>
            <DialogDescription>
              Enter a new name for your book. This will update it across the app.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Book Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., Main Accounts"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.formState.isDirty}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
