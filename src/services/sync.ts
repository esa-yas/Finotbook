
import { type SupabaseClient, type User } from '@supabase/supabase-js';
import { db } from './db';
import type { Book, Business, BusinessMember, Category, PaymentMethod, Transaction, BookCustomField, BookMember, Contact, Currency, Profile } from './db';

// Fetches all data from Supabase and populates the local Dexie DB.
export async function syncAllData(supabase: SupabaseClient, user: User) {
    console.log("Starting full data sync...");
    try {
        // Fetch currencies first, as they are global
        const { data: currenciesRes, error: currenciesErr } = await supabase.from('currencies').select('*');
        if (currenciesErr) throw currenciesErr;
        const currencies: Currency[] = currenciesRes || [];
        await db.currencies.bulkPut(currencies);
        console.log(`Synced ${currencies.length} currencies.`);
        
        // Fetch user's profile, including the new last_selected_business_id field
        const { data: userProfile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileErr && profileErr.code !== 'PGRST116') { // Ignore 'exact one row' error if profile doesn't exist yet
            console.error("Error fetching user profile:", profileErr);
            throw new Error(`Failed to fetch user profile: ${profileErr.message}`);
        }
        if (userProfile) {
            await db.profiles.put(userProfile as Profile);
            console.log("Synced user profile.");
        }


        // 1. Fetch all businesses the user is a member of.
        const { data: businessMemberships, error: bmError } = await supabase
            .from('business_members')
            .select('role, businesses!inner(*)')
            .eq('user_id', user.id);
        
        if (bmError) {
          console.error("Error fetching business memberships:", bmError);
          throw new Error(`Failed to fetch businesses: ${bmError.message}`);
        }
        
        const businesses: Business[] = businessMemberships?.map(d => d.businesses).filter(Boolean) as Business[] || [];
        
        if (businesses.length === 0) {
            console.log("User has no businesses. Clearing user-specific local data.");
            await db.transaction('rw', [
                db.businesses, db.books, db.transactions, db.categories, db.paymentMethods,
                db.businessMembers, db.bookMembers, db.bookCustomFields, db.contacts, db.invitations, db.profiles
            ], async () => {
                await db.businesses.clear();
                await db.books.clear();
                await db.transactions.clear();
                await db.categories.clear();
                await db.paymentMethods.clear();
                await db.businessMembers.clear();
                await db.bookMembers.clear();
                await db.bookCustomFields.clear();
                await db.contacts.clear();
                await db.invitations.clear();
                // Do not clear the user's own profile
                await db.profiles.where('id').notEqual(user.id).delete();
            });
            console.log("Local data cleared.");
            return;
        }

        await db.businesses.bulkPut(businesses);
        console.log(`Synced ${businesses.length} businesses.`);
        
        const businessIds = businesses.map(b => b.id);

        // 2. Fetch all business members for these businesses
        const { data: membersRes, error: membersErr } = await supabase
            .from('business_members')
            .select('user_id, role, business_id')
            .in('business_id', businessIds);
            
        if (membersErr) {
            console.error("Error fetching business members:", membersErr);
            throw new Error(`Failed to fetch members: ${membersErr.message}`);
        }

        const memberUserIds = membersRes.map(m => m.user_id);

        // 3. Fetch profiles for those members
        const { data: profilesRes, error: profilesErr } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', memberUserIds);

        if (profilesErr) {
            console.error("Error fetching profiles:", profilesErr);
            throw new Error(`Failed to fetch profiles: ${profilesErr.message}`);
        }

        const profilesById = new Map(profilesRes.map(p => [p.id, p]));

        const businessMembers: BusinessMember[] = membersRes.map((member) => ({
            id: member.user_id,
            email: profilesById.get(member.user_id)?.email || 'Unknown Email',
            full_name: profilesById.get(member.user_id)?.full_name || null,
            role: member.role,
            business_id: member.business_id,
        })).filter(Boolean) as BusinessMember[] || [];

        await db.businessMembers.bulkPut(businessMembers);
        console.log(`Synced ${businessMembers.length} business members.`);


        // 4. Fetch other business-related data
        const [
            booksRes,
            categoriesRes,
            paymentMethodsRes,
            contactsRes,
            invitationsRes
        ] = await Promise.all([
            supabase.rpc('get_user_books_with_balance', { p_user_id: user.id }),
            supabase.from('transaction_categories').select('*').in('business_id', businessIds),
            supabase.from('payment_methods').select('*').in('business_id', businessIds),
            supabase.from('contacts').select('*').in('business_id', businessIds),
            supabase.from('business_invitations').select('*, businesses(name)').eq('email', user.email || '').eq('status', 'pending')
        ]);
        
        if (booksRes.error) throw booksRes.error;
        const books: Book[] = booksRes.data || [];
        await db.books.bulkPut(books);
        console.log(`Synced ${books.length} books.`);

        const bookIds = books.map(b => b.id);

        if (categoriesRes.error) throw categoriesRes.error;
        const categories: Category[] = categoriesRes.data || [];
        await db.categories.bulkPut(categories);
        console.log(`Synced ${categories.length} categories.`);
        
        if (paymentMethodsRes.error) throw paymentMethodsRes.error;
        const paymentMethods: PaymentMethod[] = paymentMethodsRes.data || [];
        await db.paymentMethods.bulkPut(paymentMethods);
        console.log(`Synced ${paymentMethods.length} payment methods.`);

        if (contactsRes.error) throw contactsRes.error;
        const contacts: Contact[] = contactsRes.data || [];
        await db.contacts.bulkPut(contacts);
        console.log(`Synced ${contacts.length} contacts.`);

        if (invitationsRes.error) throw invitationsRes.error;
        await db.invitations.bulkPut(invitationsRes.data || []);
        console.log(`Synced ${invitationsRes.data?.length || 0} invitations.`);

        if (bookIds.length > 0) {
            const [transactionsRes, bookCustomFieldsRes, bookMembersRes] = await Promise.all([
                supabase.from('transactions').select('*').in('book_id', bookIds),
                supabase.from('book_custom_fields').select('*').in('book_id', bookIds),
                supabase.from('book_members').select('*').in('book_id', bookIds)
            ]);

            if (transactionsRes.error) throw transactionsRes.error;
            
            // Map full names to transactions after fetching
            const transactions: Transaction[] = (transactionsRes.data || []).map((t: any) => ({
                ...t,
                user_full_name: profilesById.get(t.user_id)?.full_name || null,
            }));

            await db.transactions.bulkPut(transactions);
            console.log(`Synced ${transactions.length} transactions.`);
            
            if (bookCustomFieldsRes.error) throw bookCustomFieldsRes.error;
            const bookCustomFields: BookCustomField[] = bookCustomFieldsRes.data || [];
            await db.bookCustomFields.bulkPut(bookCustomFields);
            console.log(`Synced ${bookCustomFields.length} book custom fields.`);

            if (bookMembersRes.error) throw bookMembersRes.error;
            const bookMembers: BookMember[] = bookMembersRes.data || [];
            
            // Clear old members for these books before adding new ones
            await db.bookMembers.where('book_id').anyOf(bookIds).delete();
            await db.bookMembers.bulkPut(bookMembers);
            
            console.log(`Synced ${bookMembers.length} book member links.`);
        } else {
             await db.transactions.clear();
             await db.bookMembers.clear();
             await db.bookCustomFields.clear();
        }
        
        console.log("Full data sync finished successfully.");

    } catch (error) {
        console.error("Error during full data sync:", error);
        // Re-throw the error so it can be caught by the context
        throw error;
    }
}
