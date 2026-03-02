import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import RSVPReader from '@/components/RSVPReader';

export default async function ReaderPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    // Fetch document metadata
    const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

    if (docError || !document) {
        return <div className="p-8">Document not found</div>;
    }

    // Fetch document contents (the array of words)
    const { data: content, error: contentError } = await supabase
        .from('document_contents')
        .select('content_array, chapters')
        .eq('id', id)
        .single();

    if (contentError || !content) {
        return <div className="p-8">Failed to load document content</div>;
    }

    // Fetch reading progress
    const { data: progress } = await supabase
        .from('reading_progress')
        .select('current_word_index')
        .eq('document_id', id)
        .single();

    // Fetch bookmarks
    const { data: bookmarksData } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('document_id', id)
        .order('word_index', { ascending: true });

    const initialIndex = progress?.current_word_index || 0;
    const words: string[] = content.content_array || [];
    const chapters = content.chapters || [];
    const bookmarks = bookmarksData || [];

    return (
        <div className="w-full h-full min-h-screen bg-background text-foreground">
            <RSVPReader
                documentId={id}
                title={document.title}
                words={words}
                chapters={chapters}
                initialBookmarks={bookmarks}
                initialIndex={initialIndex}
            />
        </div>
    );
}
