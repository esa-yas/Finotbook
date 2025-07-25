
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';

export default function ConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'confirmed' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [supabase] = useState(() => createClientComponentClient());

  useEffect(() => {
    const confirmEmail = async () => {
      // SECURITY FIX: Log out any active user before processing the confirmation.
      // This prevents the account-mixing bug.
      await supabase.auth.signOut();
      
      // The confirmation logic is now handled by Supabase's server-side redirect.
      // When the user lands here, their email is already confirmed.
      // We just need to give them feedback and redirect them.
      setStatus('confirmed');
      setTimeout(() => {
        router.push('/login');
      }, 3000); // Wait 3 seconds before redirecting to login.
    };

    confirmEmail().catch(err => {
        console.error("Confirmation error:", err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred during email confirmation. Please try signing up again.');
    })
  }, [router, supabase]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        {status === 'verifying' && (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <h1 className="text-2xl font-bold">Verifying your email...</h1>
            <p className="text-muted-foreground">Please wait a moment.</p>
          </>
        )}
        {status === 'confirmed' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                 <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h1 className="text-2xl font-bold">Email Confirmed!</h1>
            <p className="text-muted-foreground">Thank you for verifying your email. You will be redirected to the login page shortly.</p>
          </>
        )}
         {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                 <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
            <h1 className="text-2xl font-bold text-destructive">Verification Failed</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
          </>
        )}
      </div>
    </div>
  );
}
