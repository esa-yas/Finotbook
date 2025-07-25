
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBusiness, type Business } from '@/contexts/BusinessContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, Pencil } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const profileSchema = z.object({
  name: z.string().min(2, 'Business name is required.'),
  address: z.string().optional(),
  staff_size: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  business_type: z.string().optional(),
  registration_type: z.string().optional(),
  phone_number: z.string().optional(),
  contact_email: z.string().email('Invalid email address.').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface BusinessProfileFormProps {
  business: Business;
}

const SectionHeader = ({ title }: { title: string }) => (
    <div className="bg-muted p-2 rounded-md mb-6">
        <h4 className="font-semibold text-sm text-muted-foreground">{title}</h4>
    </div>
);

const FormField = ({ id, label, register, error }: { id: keyof ProfileFormValues, label: string, register: any, error?: string }) => (
    <div className="grid grid-cols-3 items-start gap-4">
        <Label htmlFor={id} className="text-sm font-medium text-muted-foreground pt-2 col-span-1">{label}</Label>
        <div className="col-span-2">
            <Input id={id} {...register(id)} className="max-w-sm" />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
    </div>
);

export function BusinessProfileForm({ business }: BusinessProfileFormProps) {
  const { updateBusiness, loading } = useBusiness();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: business.name || '',
      address: business.address || '',
      staff_size: business.staff_size || '',
      category: business.category || '',
      subcategory: business.subcategory || '',
      business_type: business.business_type || '',
      registration_type: business.registration_type || '',
      phone_number: business.phone_number || '',
      contact_email: business.contact_email || '',
    },
  });
  
  const { formState: { isSubmitting, errors, isDirty } } = form;

  const onSubmit = async (values: ProfileFormValues) => {
    const updatedBusiness = await updateBusiness(business.id, values);
    if (updatedBusiness) {
        setIsEditing(false);
        form.reset(values); // To reset the dirty state
    }
  };

  const handleCancel = () => {
    form.reset(); // Reset form to default values
    setIsEditing(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-2xl font-bold text-muted-foreground">{business.name.charAt(0).toUpperCase()}</p>
                </div>
                <div>
                    <h2 className="text-2xl font-bold">{business.name}</h2>
                    {business.is_verified && (
                        <div className="flex items-center gap-1.5 text-green-600 mt-1">
                            <CheckCircle className="w-4 h-4"/>
                            <span className="text-sm font-semibold">Business Profile</span>
                        </div>
                    )}
                </div>
            </div>
             <Button variant="outline" type="button" onClick={() => setIsEditing(!isEditing)} disabled={isSubmitting}>
                <Pencil className="mr-2 h-4 w-4"/>
                {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          <Tabs defaultValue="basics" className="w-full">
            <TabsList>
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="info">Business Info</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
            </TabsList>

            <fieldset disabled={!isEditing || isSubmitting} className="mt-6 space-y-8">
              <TabsContent value="basics" className="space-y-6">
                <SectionHeader title="Basics" />
                <FormField id="name" label="Business Name" register={form.register} error={errors.name?.message} />
                <FormField id="address" label="Business Address" register={form.register} />
                <FormField id="staff_size" label="Staff Size" register={form.register} />
              </TabsContent>
              <TabsContent value="info" className="space-y-6">
                <SectionHeader title="Business Info" />
                <FormField id="category" label="Business Category" register={form.register} />
                <FormField id="subcategory" label="Business Subcategory" register={form.register} />
                <FormField id="business_type" label="Business Type" register={form.register} />
                <FormField id="registration_type" label="Registration Type" register={form.register} />
              </TabsContent>
              <TabsContent value="communication" className="space-y-6">
                <SectionHeader title="Communication" />
                <FormField id="phone_number" label="Mobile Number" register={form.register} />
                <FormField id="contact_email" label="Business Email" register={form.register} error={errors.contact_email?.message} />
              </TabsContent>
            </fieldset>
          </Tabs>
        </CardContent>

        {isEditing && (
            <div className="p-6 border-t flex justify-end gap-2">
                 <Button variant="ghost" type="button" onClick={handleCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !isDirty}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        )}
      </Card>
    </form>
  );
}
