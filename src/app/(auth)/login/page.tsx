import Link from 'next/link'
import { login, signInWithGoogle } from '@/app/actions'
import ThemeToggle from '@/components/ThemeToggle'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const { message } = await searchParams

    return (
        <div className="flex-1 flex flex-col w-full h-screen items-center justify-center bg-background px-4">


            <div className="absolute right-4 top-4 sm:right-8 sm:top-8">
                <ThemeToggle />
            </div>

            <div className="animate-in w-full max-w-sm sm:max-w-md flex flex-col bg-background/50 backdrop-blur-md rounded-2xl shadow-xl border border-foreground/10 p-8 sm:p-10">
                <div className="flex flex-col mb-8 text-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                    <p className="text-sm text-foreground/60">Sign in to your Swiftline account to access your library.</p>
                </div>

                <form className="flex-1 flex flex-col w-full gap-4 text-foreground">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" htmlFor="email">
                            Email address
                        </label>
                        <input
                            className="rounded-lg px-4 py-2.5 bg-foreground/5 border border-foreground/10 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            name="email"
                            placeholder="architmishrapro@gmail.com"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium" htmlFor="password">
                            Password
                        </label>
                        <input
                            className="rounded-lg px-4 py-2.5 bg-foreground/5 border border-foreground/10 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        formAction={login}
                        className="bg-foreground text-background font-medium rounded-lg px-4 py-2.5 mt-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
                    >
                        Sign In
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-foreground/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-3 text-foreground/50 tracking-wider">
                            Or continue with
                        </span>
                    </div>
                </div>

                <form>
                    <button
                        formAction={signInWithGoogle}
                        className="w-full bg-background hover:bg-foreground/5 text-foreground font-medium rounded-lg px-4 py-2.5 border border-foreground/10 flex items-center justify-center gap-3 transition-colors shadow-sm"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            <path d="M1 1h22v22H1z" fill="none" />
                        </svg>
                        Google
                    </button>
                </form>

                {message && (
                    <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center">
                        {message}
                    </div>
                )}

                <div className="text-sm mt-8 text-center text-foreground/60">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    )
}
