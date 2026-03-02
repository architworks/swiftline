import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/actions'
import DashboardUploader from '@/components/DashboardUploader'

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
            <nav className="w-full flex justify-between items-center border-b pb-4">
                <div className="font-bold text-xl">Swiftline</div>
                <div className="flex items-center gap-4">
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
                            {documents.map((doc: any) => {
                                const progress = doc.reading_progress[0]
                                const percent = progress?.percent_complete || 0
                                return (
                                    <div key={doc.id} className="border p-4 rounded-lg flex flex-col gap-2 hover:border-blue-500 transition-colors cursor-pointer">
                                        <h3 className="font-medium truncate" title={doc.title}>{doc.title}</h3>
                                        <div className="flex justify-between text-xs text-foreground/60">
                                            <span>{doc.total_word_count.toLocaleString()} words</span>
                                            <span>{Math.round(percent)}% read</span>
                                        </div>
                                        <div className="w-full bg-btn-background h-1.5 mt-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full" style={{ width: `${percent}%` }}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
