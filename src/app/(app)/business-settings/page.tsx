
'use client';

import { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Trash2, UserCog, Edit, Settings, Building, Briefcase, Phone, Mail } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsClient } from '@/hooks/use-is-client';
import { DeleteBusinessCard } from './_components/delete-business-card';
import { ChangeOwnerCard } from './_components/change-owner-card';
import { BusinessProfileForm } from './_components/business-profile-form';

export default function BusinessSettingsPage() {
    const { currentBusiness, currentUserRole, loading } = useBusiness();
    const isClient = useIsClient();
    const [activeSection, setActiveSection] = useState('profile');

    if (!isClient || loading.userBusinesses || loading.members || loading.sync) {
        return (
             <div className="max-w-4xl mx-auto space-y-8">
                <Skeleton className="h-10 w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1">
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="md:col-span-3 space-y-6">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (!currentBusiness) {
        return <p>No business selected.</p>
    }

    if (currentUserRole !== 'owner') {
        return (
             <Alert variant="destructive" className="max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>
                    You must be the business owner to access these settings.
                </AlertDescription>
            </Alert>
        )
    }

    const navButtonClasses = (section: string) => 
        `w-full justify-start gap-3 ${activeSection === section ? 'bg-primary/10 text-primary font-semibold' : ''}`;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <div className="lg:col-span-1 space-y-2 sticky top-24">
                     <h3 className="text-lg font-semibold px-4">Sections</h3>
                     <Button variant="ghost" className={navButtonClasses('profile')} onClick={() => setActiveSection('profile')}>
                        <Building className="h-4 w-4"/>
                        Business Profile
                     </Button>
                     <Button variant="ghost" className={navButtonClasses('settings')} onClick={() => setActiveSection('settings')}>
                        <Settings className="h-4 w-4"/>
                        Advanced Settings
                     </Button>
                </div>
                <div className="lg:col-span-3 space-y-6">
                    {activeSection === 'profile' && (
                        <BusinessProfileForm business={currentBusiness} />
                    )}
                    {activeSection === 'settings' && (
                        <>
                            <ChangeOwnerCard />
                            <DeleteBusinessCard business={currentBusiness} />
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
