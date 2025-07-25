
'use client';

import { useBusiness } from '@/contexts/BusinessContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListManagementSettings } from './list-management-settings';
import { BookCustomFieldsSettings } from './book-custom-fields-settings';
import { ContactsSettings } from './contacts-settings';

export function EntryFieldsSettings() {
    const { 
        categories, 
        paymentMethods, 
        addCategory, 
        deleteCategory, 
        addPaymentMethod, 
        deletePaymentMethod,
        loading: businessLoading 
      } = useBusiness();

    return (
        <div className="space-y-6">
            <BookCustomFieldsSettings />
            
            <ListManagementSettings
              title="Category Settings"
              description="Add, remove, or edit your business-wide transaction categories."
              items={categories.map(c => ({ id: c.id, name: c.name }))}
              onAddItem={addCategory}
              onDeleteItem={deleteCategory}
              loading={businessLoading.categories}
              inputPlaceholder="e.g., Office Supplies"
              addItemButtonText="Add Category"
            />
            
            <ListManagementSettings
              title="Payment Mode Settings"
              description="Manage the payment methods available across all your cashbooks."
              items={paymentMethods.map(p => ({ id: p.id, name: p.name }))}
              onAddItem={addPaymentMethod}
              onDeleteItem={deletePaymentMethod}
              loading={businessLoading.paymentMethods}
              inputPlaceholder="e.g., Bank Transfer"
              addItemButtonText="Add Payment Mode"
            />

            <ContactsSettings />
        </div>
    );
}
