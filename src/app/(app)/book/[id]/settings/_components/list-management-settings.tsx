
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  newItemName: z.string().min(1, 'Name cannot be empty.'),
});

type FormValues = z.infer<typeof formSchema>;

interface ListManagementSettingsProps {
  title: string;
  description: string;
  items: { id: string; name: string }[];
  onAddItem: (name: string) => Promise<any>;
  onDeleteItem: (id: string) => Promise<void>;
  loading: boolean;
  inputPlaceholder: string;
  addItemButtonText: string;
}

export function ListManagementSettings({
  title,
  description,
  items,
  onAddItem,
  onDeleteItem,
  loading,
  inputPlaceholder,
  addItemButtonText,
}: ListManagementSettingsProps) {
    const { toast } = useToast();
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            newItemName: '',
        }
    });

    const handleAddItem = async (values: FormValues) => {
        const newItem = await onAddItem(values.newItemName);
        if (newItem) {
            toast({ title: 'Success', description: `${values.newItemName} has been added.` });
            form.reset();
        }
    };

    const handleDeleteItem = async (id: string, name: string) => {
        await onDeleteItem(id);
        toast({ title: 'Success', description: `${name} has been removed.` });
    };

    const isSubmitting = form.formState.isSubmitting;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={form.handleSubmit(handleAddItem)} className="flex items-center gap-2">
                    <Input 
                        {...form.register('newItemName')}
                        placeholder={inputPlaceholder}
                        className="flex-grow"
                        disabled={isSubmitting || loading}
                    />
                    <Button type="submit" disabled={isSubmitting || loading}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        {addItemButtonText}
                    </Button>
                </form>
                {form.formState.errors.newItemName && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.newItemName.message}</p>
                )}

                {items.length > 0 && (
                    <div className="space-y-2 rounded-md border p-4 max-h-60 overflow-y-auto">
                        {items.map(item => (
                            <div key={item.id} className="flex items-center justify-between gap-4 p-2 rounded-md bg-muted/50">
                                <span className="font-medium text-sm">{item.name}</span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                                    onClick={() => handleDeleteItem(item.id, item.name)}
                                    disabled={loading || isSubmitting}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
