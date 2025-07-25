
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useBusiness } from '@/contexts/BusinessContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/db';

const AddBookDialog = dynamic(() => 
  import('./add-book-dialog').then(mod => mod.AddBookDialog), 
  { ssr: false }
);

export function CreateFirstBook() {
  const router = useRouter();
  const { createBusiness } = useBusiness();
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 for business, 2 for book
  const [isAddBookDialogOpen, setIsAddBookDialogOpen] = useState(false);
  const availableCurrencies = useLiveQuery(() => db.currencies.toArray(), []);


  const handleCreateBusiness = async () => {
    if (businessName.length < 2) return;
    setLoading(true);
    const newBusiness = await createBusiness(businessName, currency);
    if (newBusiness) {
        setStep(2); // Move to the "Create Book" step
    }
    setLoading(false);
  };

  if (step === 2) {
      return (
          <div className="flex min-h-[calc(80vh)] w-full items-center justify-center p-4 bg-muted/40">
            <div className="w-full max-w-lg">
              <Card>
                <CardHeader className="items-center text-center">
                  <div className="p-4 bg-primary/10 rounded-full w-fit mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-primary"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /><path d="M12 7H8" /><path d="M12 11H8" /></svg>
                  </div>
                  <CardTitle className="text-2xl">Create Your First Cashbook</CardTitle>
                  <CardDescription className="max-w-sm">
                    Great! Your business is set up. Now, create a cashbook to track income and expenses.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={() => setIsAddBookDialogOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base">
                    Create Your First Book
                  </Button>
                </CardFooter>
              </Card>
            </div>
             {isAddBookDialogOpen && (
                <AddBookDialog 
                open={isAddBookDialogOpen} 
                onOpenChange={setIsAddBookDialogOpen}
                onBookCreated={(bookId) => router.push(`/book/${bookId}`)} 
                />
            )}
          </div>
      )
  }

  return (
    <>
      <div className="flex min-h-[calc(80vh)] w-full items-center justify-center p-4 bg-muted/40">
        <div className="w-full max-w-lg">
          <Card>
            <CardHeader className="items-center text-center">
              <div className="p-4 bg-primary/10 rounded-full w-fit mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-primary"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><path d="M12 12h.01"/><rect width="20" height="12" x="2" y="8" rx="2"/></svg>
              </div>
              <CardTitle className="text-2xl">Welcome! Let's get started.</CardTitle>
              <CardDescription className="max-w-sm">
                First, give your business a name and select its primary currency. You can change this later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input 
                    id="business-name"
                    placeholder="e.g., My Side Hustle, Main Company"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    disabled={loading}
                  />
               </div>
                <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value={currency} onValueChange={setCurrency} disabled={loading}>
                        <SelectTrigger id="currency">
                            <SelectValue placeholder="Select a currency..." />
                        </SelectTrigger>
                        <SelectContent>
                            {(availableCurrencies || []).map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                    {c.name} ({c.symbol})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleCreateBusiness} className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base" disabled={loading || businessName.length < 2}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Business
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
