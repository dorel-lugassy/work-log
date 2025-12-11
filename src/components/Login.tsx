import { SignIn } from "@clerk/clerk-react";

export default function Login() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    Work Log
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Track your work, manage your time.
                </p>
            </div>
            <SignIn />
        </div>
    );
}
