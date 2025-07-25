
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
import { useBusiness } from '@/contexts/BusinessContext';

const formSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty.'),
  phone_number: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ContactsSettings() {
    const { contacts, addContact, deleteContact, loading } = useBusiness();
    const { toast } = useToast();
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            phone_number: '',
        }
    });

    const handleAddItem = async (values: FormValues) => {
        const newItem = await addContact(values.name, values.phone_number);
        if (newItem) {
            toast({ title: 'Success', description: `${values.name} has been added.` });
            form.reset();
        }
    };

    const handleDeleteItem = async (id: string, name: string) => {
        await deleteContact(id);
        toast({ title: 'Success', description: `${name} has been removed.` });
    };

    const isSubmitting = form.formState.isSubmitting;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Contact Settings</CardTitle>
                <CardDescription>Manage your business-wide contacts. These can be linked to transactions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <form onSubmit={form.handleSubmit(handleAddItem)} className="flex items-end gap-2">
                    <div className="flex-grow space-y-2">
                         <Input 
                            {...form.register('name')}
                            placeholder="Contact Name (e.g., John Doe)"
                            disabled={isSubmitting || loading.contacts}
                         />
                         {form.formState.errors.name && (
                           <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
                         )}
                    </div>
                     <div className="flex-grow space-y-2">
                         <Input 
                            {...form.register('phone_number')}
                            placeholder="Phone Number (Optional)"
                            disabled={isSubmitting || loading.contacts}
                         />
                    </div>
                    <Button type="submit" disabled={isSubmitting || loading.contacts} className="shrink-0">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Add Contact
                    </Button>
                </form>

                {contacts.length > 0 && (
                    <div className="space-y-2 rounded-md border p-4 max-h-60 overflow-y-auto">
                        {contacts.map(item => (
                            <div key={item.id} className="flex items-center justify-between gap-4 p-2 rounded-md bg-muted/50">
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{item.name}</span>
                                    {item.phone_number && <span className="text-xs text-muted-foreground">{item.phone_number}</span>}
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                                    onClick={() => handleDeleteItem(item.id, item.name)}
                                    disabled={loading.contacts || isSubmitting}
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
