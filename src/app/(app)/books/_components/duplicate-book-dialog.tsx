
'use client';

import { useState, useEffect } from 'react';
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
import { useRouter } from 'next/navigation';
import type { Book } from '@/contexts/BusinessContext';

const duplicateBookSchema = z.object({
  name: z.string().min(2, { message: 'Book name must be at least 2 characters.' }),
});

type DuplicateBookFormValues = z.infer<typeof duplicateBookSchema>;

interface DuplicateBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookToDuplicate: Book | null;
}

export function DuplicateBookDialog({ open, onOpenChange, bookToDuplicate }: DuplicateBookDialogProps) {
  const { duplicateBook } = useBusiness();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<DuplicateBookFormValues>({
    resolver: zodResolver(duplicateBookSchema),
  });
  
  useEffect(() => {
    if (bookToDuplicate) {
      form.reset({ name: `${bookToDuplicate.name} (Copy)` });
    }
  }, [bookToDuplicate, open, form]);

  const onSubmit = async (values: DuplicateBookFormValues) => {
    if (!bookToDuplicate) return;
    setLoading(true);
    const newBookId = await duplicateBook(bookToDuplicate.id, values.name);
    if (newBookId) {
      onOpenChange(false);
      router.push(`/book/${newBookId}`);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Duplicate Book</DialogTitle>
            <DialogDescription>
              This will create a new book with the same settings and members, but with no transactions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                New Book Name
              </Label>
              <Input
                id="name"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Duplicate Book
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
