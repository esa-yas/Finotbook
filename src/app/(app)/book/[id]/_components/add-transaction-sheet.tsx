
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useBook, Transaction } from '@/contexts/BookContext';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock, Paperclip, Info, Plus, X, Trash2, FileText, Loader2, PlusCircle, User, Contact } from 'lucide-react';
import { format } from 'date-fns';
import { evaluate } from 'mathjs';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const baseTransactionSchema = z.object({
  date: z.date({ required_error: 'A date is required.' }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  description: z.string().min(1, { message: 'Remarks are required.' }),
  amount: z.string().min(1, { message: 'Amount is required.' }),
  calculatedAmount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  type: z.enum(['credit', 'debit']),
  category: z.string().optional(),
  contact_id: z.string().optional(),
  paymentMode: z.string().optional(),
  dynamicCustomFields: z.array(z.object({
    name: z.string().min(1, "Field name is required."),
    value: z.string().min(1, "Field value is required."),
  })).optional(),
});

type BaseTransactionFormValues = z.infer<typeof baseTransactionSchema>;

type TransactionFormValues = BaseTransactionFormValues & {
    constantCustomFields: Record<string, string>;
};

interface AddTransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType: 'credit' | 'debit';
  transactionToEdit?: Transaction | null;
}

export function AddTransactionSheet({ open, onOpenChange, defaultType, transactionToEdit }: AddTransactionSheetProps) {
  const { addTransaction, updateTransaction, bookCustomFields, book } = useBook();
  const { categories, paymentMethods, contacts } = useBusiness();
  const { supabase } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditMode = !!transactionToEdit;

  const enabledBookCustomFields = useMemo(() => bookCustomFields.filter(f => f.is_enabled), [bookCustomFields]);

  // This is the crucial fix. The schema is now dynamically built based on the `is_required` flag.
  const transactionSchema = useMemo(() => {
    const constantFieldsSchema = enabledBookCustomFields.reduce((acc, field) => {
        if (field.is_required) {
            acc[field.field_name] = z.string().min(1, { message: `${field.field_name} is required.` });
        } else {
            acc[field.field_name] = z.string().optional();
        }
        return acc;
    }, {} as Record<string, z.ZodString | z.ZodOptional<z.ZodString>>);
    
    return baseTransactionSchema.extend({
        constantCustomFields: z.object(constantFieldsSchema)
    });
  }, [enabledBookCustomFields]);


  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
        dynamicCustomFields: [],
        constantCustomFields: {},
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "dynamicCustomFields",
  });

  const resetForm = (type: 'credit' | 'debit') => {
    const now = new Date();
    
    const defaultConstantFields = enabledBookCustomFields.reduce((acc, field) => {
        acc[field.field_name] = '';
        return acc;
    }, {} as Record<string, string>);

    form.reset({
      type: type,
      date: now,
      time: format(now, "HH:mm"),
      description: '',
      amount: '',
      calculatedAmount: 0,
      paymentMode: 'Cash',
      category: '',
      contact_id: 'no_contact',
      dynamicCustomFields: [],
      constantCustomFields: defaultConstantFields,
    });
    setAttachments([]);
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && transactionToEdit) {
        const transactionDate = new Date(transactionToEdit.date);

        const constantFields = enabledBookCustomFields.map(f => f.field_name);
        const constantFieldValues: Record<string, string> = {};
        const dynamicFieldValues: {name: string, value: string}[] = [];

        if (transactionToEdit.custom_fields) {
            Object.entries(transactionToEdit.custom_fields).forEach(([key, value]) => {
                if (constantFields.includes(key)) {
                    constantFieldValues[key] = String(value);
                } else {
                    dynamicFieldValues.push({ name: key, value: String(value) });
                }
            });
        }
            
        form.reset({
          type: transactionToEdit.type,
          date: transactionDate,
          time: format(transactionDate, "HH:mm"),
          description: transactionToEdit.description,
          amount: String(transactionToEdit.amount),
          calculatedAmount: transactionToEdit.amount,
          category: transactionToEdit.category || '',
          contact_id: transactionToEdit.contact_id || 'no_contact',
          paymentMode: transactionToEdit.payment_mode || '',
          constantCustomFields: constantFieldValues,
          dynamicCustomFields: dynamicFieldValues,
        });
        setAttachments([]);
      } else {
         resetForm(defaultType);
      }
    }
  }, [open, isEditMode, transactionToEdit, defaultType, form, bookCustomFields]);

  const handleAmountBlur = () => {
    const amountValue = form.getValues('amount');
    try {
      if (amountValue) {
        if (/[+\-*/]/.test(amountValue)) {
          const result = evaluate(amountValue);
          form.setValue('calculatedAmount', result, { shouldValidate: true });
          form.setValue('amount', String(result));
        } else {
           form.setValue('calculatedAmount', parseFloat(amountValue), { shouldValidate: true });
        }
      }
    } catch (error) {
      form.setError('amount', { type: 'manual', message: 'Invalid calculation' });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      if (attachments.length + newFiles.length > 4) {
        toast({
          variant: 'destructive',
          title: 'Too many files',
          description: 'You can only attach up to 4 files.',
        });
        return;
      }
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const uploadAttachments = async (): Promise<Record<string, string>> => {
    const attachmentUrls: Record<string, string> = {};
    if (attachments.length === 0 || !supabase) return attachmentUrls;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated for upload.');
    }

    for (let i = 0; i < attachments.length; i++) {
        const file = attachments[i];
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
        .from('transaction_attachments')
        .upload(filePath, file);

        if (uploadError) {
            console.error('Upload Error:', uploadError);
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
            .from('transaction_attachments')
            .getPublicUrl(filePath);

        if (!urlData.publicUrl) {
            console.error('Public URL Error:', urlData);
            throw new Error(`Failed to get public URL for ${file.name}`);
        }
        
        attachmentUrls[`attachment_url_${i + 1}`] = urlData.publicUrl;
    }
    return attachmentUrls;
  };


  const processFormSubmit = async (values: TransactionFormValues): Promise<boolean> => {
    setLoading(true);
    
    const [hours, minutes] = values.time.split(':').map(Number);
    const combinedDateTime = new Date(values.date);
    combinedDateTime.setHours(hours, minutes);

    const dynamicCustomFieldsObject = values.dynamicCustomFields?.reduce((acc, field) => {
        if (field.name) {
            acc[field.name] = field.value;
        }
        return acc;
    }, {} as Record<string, string>);

    const allCustomFields = {
        ...values.constantCustomFields,
        ...dynamicCustomFieldsObject
    }

    let success = false;
    try {
        const attachmentUrls = await uploadAttachments();
        
        const transactionData = {
            date: combinedDateTime.toISOString(),
            description: values.description,
            amount: values.calculatedAmount,
            type: values.type,
            category: values.category === 'add_new_category' ? undefined : values.category,
            contact_id: values.contact_id === 'no_contact' || values.contact_id === 'add_new_contact' ? undefined : values.contact_id,
            payment_mode: values.paymentMode === 'add_new_payment_mode' ? undefined : values.paymentMode,
            custom_fields: allCustomFields,
            ...attachmentUrls,
        };
        
        if(isEditMode && transactionToEdit) {
            const updatedTransaction = await updateTransaction(transactionToEdit.id, transactionData);
            if(updatedTransaction) success = true;
        } else {
            const newTransaction = await addTransaction(transactionData);
            if(newTransaction) success = true;
        }


        if (success) {
          toast({
            title: 'Success!',
            description: `Your transaction has been ${isEditMode ? 'updated' : 'added'}.`,
          });
        }
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: error.message || 'An unexpected error occurred.',
        });
        success = false;
    } finally {
        setLoading(false);
    }
    return success;
  };

  const onSubmit = async (values: TransactionFormValues) => {
      const success = await processFormSubmit(values);
      if (success) {
          onOpenChange(false);
      }
  };

  const onSaveAndNew = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill out all required fields correctly.',
      });
      return;
    }

    const values = form.getValues();
    const success = await processFormSubmit(values);
    if (success) {
      resetForm(values.type);
    }
  }

  const selectedType = form.watch('type');
  const settingsUrl = `/book/${book?.id}/settings`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>{isEditMode ? 'Edit' : 'Add'} {selectedType === 'credit' ? 'Cash In' : 'Cash Out'} Entry</SheetTitle>
          <SheetClose />
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-grow space-y-4 p-6 overflow-y-auto">
            <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            onClick={() => field.onChange('credit')}
                            className={cn(
                                'rounded-full text-base font-semibold flex-1 h-11',
                                field.value === 'credit'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-100 text-gray-800'
                            )}
                            variant={field.value === 'credit' ? 'default' : 'outline'}
                        >
                           Cash In
                        </Button>
                         <Button
                            type="button"
                            onClick={() => field.onChange('debit')}
                            className={cn(
                                'rounded-full text-base font-semibold flex-1 h-11',
                                field.value === 'debit'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-gray-100 text-gray-800'
                            )}
                            variant={field.value === 'debit' ? 'default' : 'outline'}
                        >
                            Cash Out
                        </Button>
                    </div>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                    <Controller
                        name="date"
                        control={form.control}
                        render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal h-11",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "dd LLL, yyyy") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        )}
                    />
                    {form.formState.errors.date && <p className="text-sm text-red-500">{form.formState.errors.date.message}</p>}
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="time">Time</Label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="time" type="time" {...form.register('time')} className="pl-9 h-11"/>
                    </div>
                    {form.formState.errors.time && <p className="text-sm text-red-500">{form.formState.errors.time.message}</p>}
                </div>
            </div>

            <div className="space-y-1">
                <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
                 <div className="relative">
                    <Input 
                        id="amount" 
                        placeholder="e.g. 890 or 100 + 200*3" 
                        {...form.register('amount')} 
                        onBlur={handleAmountBlur}
                        className="h-11"
                    />
                    <Info className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 </div>
                {form.formState.errors.amount && <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>}
                {form.formState.errors.calculatedAmount && <p className="text-sm text-red-500">{form.formState.errors.calculatedAmount.message}</p>}
            </div>

            <div className="space-y-1">
                <Label htmlFor="description">Remarks <span className="text-red-500">*</span></Label>
                <Input id="description" placeholder="e.g. Enter Details (Bill No, Item Name, etc)" {...form.register('description')} className="h-11"/>
                 {form.formState.errors.description && <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>}
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Category</Label>
                    <Controller
                        name="category"
                        control={form.control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.name}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                    <Separator />
                                    <Link href={settingsUrl}>
                                        <div className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none text-primary">
                                            Add New Category...
                                        </div>
                                    </Link>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                 <div className="space-y-1">
                     <Label>Payment Mode</Label>
                     <Controller
                        name="paymentMode"
                        control={form.control}
                        render={({ field }) => (
                           <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                               <SelectTrigger className="h-11">
                                   <SelectValue placeholder="Select a payment mode" />
                               </SelectTrigger>
                               <SelectContent>
                                   {paymentMethods.map((method) => (
                                       <SelectItem key={method.id} value={method.name}>
                                           {method.name}
                                       </SelectItem>
                                   ))}
                                   <Separator />
                                    <Link href={settingsUrl}>
                                        <div className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none text-primary">
                                            Add New Payment Mode...
                                        </div>
                                    </Link>
                               </SelectContent>
                           </Select>
                        )}
                     />
                 </div>
            </div>
            
             <div className="space-y-1">
                <Label>Contact (Optional)</Label>
                <Controller
                    name="contact_id"
                    control={form.control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select a contact" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no_contact">None</SelectItem>
                                {contacts.map((contact) => (
                                    <SelectItem key={contact.id} value={contact.id}>
                                        {contact.name}
                                    </SelectItem>
                                ))}
                                <Separator />
                                <Link href={settingsUrl}>
                                    <div className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none text-primary">
                                        Add New Contact...
                                    </div>
                                </Link>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>

            {enabledBookCustomFields.length > 0 && (
                <div className="space-y-4 rounded-md border p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Book Specific Fields</h4>
                    {enabledBookCustomFields.map(field => (
                         <div className="space-y-1" key={field.id}>
                            <Label htmlFor={`constant-field-${field.field_name}`}>
                                {field.field_name}
                                {field.is_required && <span className="text-red-500">*</span>}
                            </Label>
                            <Controller
                                name={`constantCustomFields.${field.field_name}`}
                                control={form.control}
                                render={({ field: controllerField }) => (
                                    <Input 
                                        id={`constant-field-${field.field_name}`}
                                        {...controllerField}
                                        placeholder={`Enter ${field.field_name}`} 
                                    />
                                )}
                            />
                            {form.formState.errors.constantCustomFields?.[field.field_name] && <p className="text-sm text-red-500">{form.formState.errors.constantCustomFields[field.field_name]?.message}</p>}
                        </div>
                    ))}
                </div>
            )}

            <Separator />
            
            <div className="space-y-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    accept="image/*,application/pdf"
                />
                <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full justify-start gap-2 h-11 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isEditMode || attachments.length >= 4}
                >
                    <Paperclip className="h-4 w-4" />
                    {isEditMode ? 'Editing attachments not supported' : 'Attach Bills (Optional, up to 4)'}
                </Button>
                {attachments.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2 truncate">
                           <FileText className="h-4 w-4 shrink-0" />
                           <span className="truncate">{file.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveAttachment(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-end gap-2">
                        <div className="grid gap-1 flex-1">
                            <Label>Custom Field Name</Label>
                            <Input {...form.register(`dynamicCustomFields.${index}.name`)} placeholder="e.g., IMEI Number" />
                             {form.formState.errors.dynamicCustomFields?.[index]?.name && <p className="text-sm text-red-500">{form.formState.errors.dynamicCustomFields[index]?.name?.message}</p>}
                        </div>
                        <div className="grid gap-1 flex-1">
                            <Label>Value</Label>
                            <Input {...form.register(`dynamicCustomFields.${index}.value`)} placeholder="e.g., 1234567890" />
                            {form.formState.errors.dynamicCustomFields?.[index]?.value && <p className="text-sm text-red-500">{form.formState.errors.dynamicCustomFields[index]?.value?.message}</p>}
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                ))}

                <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => append({ name: '', value: '' })}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add One-off Custom Field
                </Button>
            </div>
            
            </div>

            <SheetFooter className="p-4 border-t bg-white mt-auto grid grid-cols-2 gap-2">
                <Button type="submit" disabled={loading} className="bg-gray-800 hover:bg-gray-900 flex-1 h-11 text-white">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                    {isEditMode ? 'Save Changes' : 'Save'}
                </Button>
                 <Button type="button" variant="outline" className="flex-1 h-11" onClick={onSaveAndNew} disabled={isEditMode || loading}>
                   {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Save & Add New
                </Button>
            </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
