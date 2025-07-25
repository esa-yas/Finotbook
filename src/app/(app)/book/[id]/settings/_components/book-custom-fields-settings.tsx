
'use client';

import { useState } from 'react';
import { useBook } from '@/contexts/BookContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const fieldSettingsSchema = z.object({
  newFieldName: z.string().min(1, 'Field name cannot be empty.'),
});

type FieldSettingsFormValues = z.infer<typeof fieldSettingsSchema>;

export function BookCustomFieldsSettings() {
    const { bookCustomFields, addBookCustomField, deleteBookCustomField, toggleBookCustomField, toggleBookCustomFieldRequired, loading } = useBook();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<FieldSettingsFormValues>({
        resolver: zodResolver(fieldSettingsSchema),
        defaultValues: {
            newFieldName: '',
        }
    });

    const handleAddField = async (values: FieldSettingsFormValues) => {
        setIsSubmitting(true);
        const success = await addBookCustomField(values.newFieldName);
        if (success) {
            toast({ title: 'Success', description: 'New custom field added.' });
            form.reset();
        }
        setIsSubmitting(false);
    };

    const handleDeleteField = async (fieldId: string) => {
        await deleteBookCustomField(fieldId);
        toast({ title: 'Success', description: 'Custom field removed.' });
    };
    
    const handleToggleField = async (fieldId: string, isEnabled: boolean) => {
        await toggleBookCustomField(fieldId, isEnabled);
        toast({ title: 'Success', description: `Field has been ${isEnabled ? 'enabled' : 'disabled'}.` });
    };
    
    const handleToggleRequired = async (fieldId: string, isRequired: boolean) => {
        await toggleBookCustomFieldRequired(fieldId, isRequired);
        toast({ title: 'Success', description: `Field is now ${isRequired ? 'required' : 'optional'}.` });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Book Specific Fields</CardTitle>
                <CardDescription>Add custom fields that will appear on every transaction entry for *this book only*.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <form onSubmit={form.handleSubmit(handleAddField)} className="flex items-center gap-2">
                    <div className="flex-grow">
                        <Input 
                            {...form.register('newFieldName')}
                            placeholder="e.g., IMEI Number, Serial No."
                            disabled={isSubmitting || loading}
                        />
                         {form.formState.errors.newFieldName && (
                            <p className="text-sm text-red-500 mt-1">{form.formState.errors.newFieldName.message}</p>
                        )}
                    </div>
                    <Button type="submit" disabled={isSubmitting || loading}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Add Field
                    </Button>
                </form>

                {bookCustomFields.length > 0 && (
                    <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-4 px-2 py-2 text-sm font-medium text-muted-foreground">
                            <div className="col-span-1">Field Name</div>
                            <div className="text-center">Enabled</div>
                            <div className="text-center">Required</div>
                        </div>
                        <div className="space-y-2 rounded-md border">
                            {bookCustomFields.map(field => (
                                <div key={field.id} className="grid grid-cols-3 items-center gap-4 p-2 [&:not(:last-child)]:border-b">
                                    <span className="font-medium text-sm col-span-1 truncate">{field.field_name}</span>
                                    <div className="flex items-center justify-center">
                                        <Switch
                                            checked={field.is_enabled}
                                            onCheckedChange={(checked) => handleToggleField(field.id, checked)}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="flex items-center justify-center">
                                         <Switch
                                            checked={field.is_required}
                                            onCheckedChange={(checked) => handleToggleRequired(field.id, checked)}
                                            disabled={loading || !field.is_enabled}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
