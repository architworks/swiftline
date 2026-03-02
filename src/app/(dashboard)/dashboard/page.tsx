import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions'
import DashboardUploader from '@/components/DashboardUploader'
import DeleteDocumentButton from '@/components/DeleteDocumentButton'
import ThemeToggle from '@/components/ThemeToggle'
import { Zap, Library, Upload } from 'lucide-react'

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
        <div className="flex-1 w-full flex flex-col gap-8 p-8 max-w-4xl mx-auto relative z-10">
            {/* Soft Ambient Background Glow */}
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-orange-500/10 to-transparent -z-10 blur-3xl pointer-events-none rounded-full top-[-100px] mx-auto max-w-lg" />

            <nav className="w-full flex justify-between items-center border-b pb-4 border-foreground/10">
                <div className="font-bold text-2xl flex items-center gap-2">
                    <Zap className="w-6 h-6 text-orange-500 fill-orange-500 animate-pulse-slow" />
                    Swiftline
                </div>
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

            <main className="flex-1 flex flex-col gap-12 mt-4">
                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Upload className="w-6 h-6 text-orange-500" />
                        Upload Document
                    </h2>
                    <DashboardUploader />
                </section>

                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Library className="w-6 h-6 text-orange-500" />
                        Your Library
                    </h2>
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
                                    <Link key={typedDoc.id} href={`/reader/${typedDoc.id}`} className="block border p-5 rounded-xl flex flex-col gap-2 border-foreground/10 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer relative group box-shadow-sm hover:shadow-lg">
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className="font-semibold text-lg truncate flex-1 group-hover:text-orange-500 transition-colors" title={typedDoc.title}>{typedDoc.title}</h3>
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
                                        <div className="w-full bg-foreground/10 h-1.5 mt-3 rounded-full overflow-hidden">
                                            <div className="bg-gradient-to-r from-orange-400 to-orange-500 h-full transition-all" style={{ width: `${percent}%` }}></div>
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
