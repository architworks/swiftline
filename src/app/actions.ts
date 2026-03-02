'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return redirect('/login?message=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
        }
    })

    if (error) {
        console.error('Supabase Sign Up Error:', error.message)
        return redirect('/signup?message=Could not sign up user')
    }

    revalidatePath('/', 'layout')
    redirect('/login?message=Check email to continue sign in process')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    redirect('/login')
}

export async function signInWithGoogle() {
    const supabase = await createClient()

    const { data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        },
    })

    if (data.url) {
        redirect(data.url)
    }
}

export async function deleteDocument(documentId: string, storagePath: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // The database records (`documents`, `document_contents`, `reading_progress`, `bookmarks`)
    // will be cascade-deleted because we set `ON DELETE CASCADE` in our SQL schema.
    const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id)

    if (dbError) {
        console.error("Failed to delete document from database", dbError)
        throw new Error("Failed to delete document")
    }

    // Attempt to delete from the storage bucket as well. 
    // It's okay if it fails (e.g., if the user already deleted it manually).
    if (storagePath) {
        await supabase.storage
            .from('documents')
            .remove([storagePath])
    }

    revalidatePath('/dashboard')
}
