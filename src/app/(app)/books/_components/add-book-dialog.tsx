
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
import { useRouter } from 'next/navigation';

const createBookSchema = z.object({
  name: z.string().min(2, { message: 'Book name must be at least 2 characters.' }),
});

type CreateBookFormValues = z.infer<typeof createBookSchema>;

interface AddBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookCreated?: (bookId: string) => void;
}

export function AddBookDialog({ open, onOpenChange, onBookCreated }: AddBookDialogProps) {
  const { createBook } = useBusiness();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateBookFormValues>({
    resolver: zodResolver(createBookSchema),
    defaultValues: {
      name: '',
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };

  const onSubmit = async (values: CreateBookFormValues) => {
    setLoading(true);
    const newBook = await createBook(values.name);
    if (newBook) {
      if (onBookCreated) {
        onBookCreated(newBook.id);
      } else {
        router.push(`/book/${newBook.id}`);
      }
      handleOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create New Book</DialogTitle>
            <DialogDescription>
              Give your new cashbook a name. You can change this later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., Main Accounts, Petty Cash"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Book
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
