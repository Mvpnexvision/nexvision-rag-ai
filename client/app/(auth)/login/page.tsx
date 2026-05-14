"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link"; // In-add ko 'to para sa client-side routing
// Make sure this path is correct based on your file structure
import ragLogo from "../../resources/rag-logoName.png";

export default function Login() {
    const router = useRouter();
    const [role, setRole] = useState<'owner' | 'admin'>('owner');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        router.push("/dashboard");
    };

    const isOwner = role === 'owner';

    return (
        // Static background gradient na lang, hindi na magbabago
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#122F35] to-[#081518]">

            <div className="bg-[#141414] p-8 sm:p-12 rounded-xl shadow-2xl w-full max-w-md">

                <div className="mb-8 flex justify-center">
                    <Image
                        src={ragLogo}
                        alt="DocuAI Logo"
                        width={200}
                        height={200}
                        className="w-32 sm:w-40 md:w-48 h-auto object-contain"
                        priority
                    />
                </div>

                <form onSubmit={handleLogin}>
                    <div className="mb-5">
                        <label className="block text-sm font-medium mb-2 text-white" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            placeholder="name@company.com"
                            required
                            className="w-full p-3 border border-gray-600 bg-[#1e1e1e] text-white rounded-md text-sm focus:outline-none focus:border-white transition-colors"
                        />
                    </div>
                    <div className="mb-5">
                        <label className="block text-sm font-medium mb-2 text-white" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            placeholder="••••••••"
                            required
                            className="w-full p-3 border border-gray-600 bg-[#1e1e1e] text-white rounded-md text-sm focus:outline-none focus:border-white transition-colors"
                        />
                    </div>

                    {/* Fixed height (h-6) para hindi magalaw yung login button pag nawala yung link */}
                    <div className="flex justify-end mb-6 text-sm h-6">
                        {isOwner && (
                            // Pinalitan ko yung <a> tag ng <Link> component
                            <Link href="/register" className="hover:underline transition-colors text-gray-400 hover:text-white">
                                Don&apos;t have an account?
                            </Link>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#0DBBC4] text-white hover:bg-[#0aa3ab] px-5 py-3 rounded-md text-sm font-medium transition-colors"
                    >
                        Log In
                    </button>
                </form>

                {/* Role Selection Buttons */}
                <div className="mt-8 pt-6 border-t border-gray-700 flex gap-4">
                    <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors border ${role === 'admin'
                            ? 'bg-[#0DBBC4] text-white border-[#0DBBC4]'
                            : 'bg-transparent border-gray-500 text-gray-400 hover:text-white hover:border-gray-400'
                            }`}
                    >
                        Admin
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('owner')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors border ${role === 'owner'
                            ? 'bg-[#0DBBC4] text-white border-[#0DBBC4]'
                            : 'bg-transparent border-gray-500 text-gray-400 hover:text-white hover:border-gray-400'
                            }`}
                    >
                        Company Owner
                    </button>
                </div>

            </div>
        </div>
    );
}