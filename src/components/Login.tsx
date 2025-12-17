import { SignIn } from "@clerk/clerk-react";

export default function Login() {

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="relative z-10 w-full max-w-md p-6">
                <div className="card-glass p-8 rounded-2xl border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/30 dark:bg-black/30">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                            Welcome Back
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Sign in to access your work log
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <SignIn
                            appearance={{
                                baseTheme: undefined, // relying on variables below, or could swap based on app theme
                                layout: {
                                    socialButtonsPlacement: 'top',
                                },
                                variables: {
                                    colorPrimary: 'rgb(59, 130, 246)', // Match Tailwind blue-500
                                    borderRadius: '0.75rem',
                                    fontFamily: 'Inter, sans-serif',
                                },
                                elements: {
                                    rootBox: "w-full",
                                    card: "shadow-none p-0 bg-transparent w-full",
                                    headerTitle: "hidden", // We use our own header
                                    headerSubtitle: "hidden",
                                    formButtonPrimary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/20 py-3",
                                    formFieldInput: "bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus:border-blue-500 transition-all rounded-xl",
                                    socialButtonsBlockButton: "bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 hover:bg-white/70 dark:hover:bg-black/30 transition-all rounded-xl",
                                    footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                                    dividerLine: "bg-gray-200 dark:bg-gray-700",
                                    dividerText: "text-gray-400 font-medium bg-transparent",
                                    formFieldLabel: "text-gray-600 dark:text-gray-300 font-medium",
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="text-center mt-8 text-xs text-gray-400 dark:text-gray-500 font-medium">
                    Secured by Clerk
                </div>
            </div>
        </div>
    );
}
