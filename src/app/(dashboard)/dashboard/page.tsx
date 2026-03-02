import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions'
import DashboardUploader from '@/components/DashboardUploader'
import DeleteDocumentButton from '@/components/DeleteDocumentButton'
import ThemeToggle from '@/components/ThemeToggle'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // Fetch user's documents
    const { data: documents } = await supabase
        .from('documents')
        .select('*, reading_progress!inner(*)')
        .order('created_at', { ascending: false })

    return (
        <div className="flex-1 w-full flex flex-col gap-8 p-8 max-w-4xl mx-auto">
            <nav className="w-full flex justify-between items-center border-b pb-4 border-foreground/10">
                <div className="font-bold text-xl">Swiftline</div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <span className="text-sm text-foreground/80">{user.email}</span>
                    <form action={logout}>
                        <button className="bg-btn-background hover:bg-btn-background-hover px-4 py-2 rounded-md text-sm">
                            Logout
                        </button>
                    </form>
                </div>
            </nav>

            <main className="flex-1 flex flex-col gap-8">
                <section>
                    <h2 className="text-2xl font-bold mb-4">Upload Document</h2>
                    <DashboardUploader />
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-4">Your Library</h2>
                    {!documents || documents.length === 0 ? (
                        <div className="p-8 border rounded-lg text-center text-foreground/60 border-dashed">
                            No documents uploaded yet.
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {documents.map((doc: unknown) => {
                                const typedDoc = doc as { id: string; title: string; total_word_count: number; storage_path: string; reading_progress: { percent_complete: number; updated_at: string }[] };
                                const progress = typedDoc.reading_progress[0]
                                const percent = progress?.percent_complete || 0
                                const lastOpened = progress?.updated_at ? new Date(progress.updated_at).toLocaleDateString() : 'Never'
                                return (
                                    <Link key={typedDoc.id} href={`/reader/${typedDoc.id}`} className="block border p-4 rounded-lg flex flex-col gap-2 hover:border-blue-500 hover:bg-foreground/5 transition-all cursor-pointer relative group shadow-sm hover:shadow-md">
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className="font-semibold text-lg truncate flex-1" title={typedDoc.title}>{typedDoc.title}</h3>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <DeleteDocumentButton documentId={typedDoc.id} storagePath={typedDoc.storage_path} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs text-foreground/60 mt-1">
                                            <div className="flex flex-col gap-1">
                                                <span>{typedDoc.total_word_count.toLocaleString()} words</span>
                                                <span className="text-foreground/40">Last opened: {lastOpened}</span>
                                            </div>
                                            <span className="font-medium bg-foreground/10 px-2 py-1 rounded-md">{Math.round(percent)}%</span>
                                        </div>
                                        <div className="w-full bg-foreground/10 h-1.5 mt-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full transition-all" style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
