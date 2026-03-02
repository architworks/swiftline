import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import { Zap, BookOpen, Gauge, Bookmark, ChevronRight, Github } from 'lucide-react'

export default async function Index() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return redirect('/dashboard')
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="flex justify-between items-center px-8 py-4 max-w-6xl mx-auto w-full shrink-0">
        <div className="font-bold text-xl flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500 fill-orange-500" />
          Swiftline
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-orange-500/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto gap-4">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-500 text-xs font-semibold px-4 py-1.5 rounded-full border border-orange-500/20">
            <Zap className="w-3 h-3 fill-orange-500" />
            RSVP Speed Reading
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none">
            Read faster.<br />
            <span className="text-orange-500">Think deeper.</span>
          </h1>

          <p className="text-base text-foreground/60 max-w-md leading-relaxed">
            Swiftline flashes one word at a time to your visual sweet spot — so your eyes never wander and your brain absorbs everything.
          </p>

          <div className="flex items-center gap-4 mt-1">
            <Link href="/signup" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-7 py-3 rounded-full transition-all shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95">
              Start Reading Free
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="px-6 pb-5 shrink-0">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4">
          {[
            { icon: <Gauge className="w-5 h-5 text-orange-500" />, title: 'Adaptive Speed', desc: 'Go from 200 to 800+ WPM with fine-tuned controls.' },
            { icon: <BookOpen className="w-5 h-5 text-orange-500" />, title: 'Any Format', desc: 'Upload PDFs, EPUBs, DOCX, Markdown, or plain text.' },
            { icon: <Bookmark className="w-5 h-5 text-orange-500" />, title: 'Smart Bookmarks', desc: 'Save your place and annotate any moment in the text.' },
          ].map((f) => (
            <div key={f.title} className="bg-foreground/5 hover:bg-orange-500/5 border border-foreground/10 hover:border-orange-500/20 rounded-xl p-4 flex flex-col gap-2 transition-all">
              {f.icon}
              <h3 className="font-bold text-sm">{f.title}</h3>
              <p className="text-xs text-foreground/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 px-8 border-t border-foreground/10 flex items-center justify-between max-w-6xl mx-auto w-full shrink-0">
        <div className="flex items-center gap-2 text-xs text-foreground/50">
          <Zap className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
          <span>Swiftline — built by <span className="font-semibold text-foreground/80">Archit Mishra</span> · <a href="mailto:architmishrapro@gmail.com" className="hover:text-foreground/80 transition-colors">architmishrapro@gmail.com</a></span>
        </div>
        <a href="https://github.com/architworks/swiftline" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-foreground/50 hover:text-foreground transition-colors">
          <Github className="w-3.5 h-3.5" />
          GitHub
        </a>
      </footer>
    </div>
  )
}
