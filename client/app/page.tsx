"use client";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/chat");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <div className="text-2xl font-semibold mb-8 flex items-center gap-2">
          <i className="fa-solid fa-layer-group"></i> DocuAI
        </div>
        <h2 className="text-xl font-medium mb-2">Welcome back</h2>
        <p className="text-gray-500 text-sm mb-8">
          Enter your details to access your workspace.
        </p>

        <form onSubmit={handleLogin}>
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="name@company.com"
              required
              className="w-full p-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              required
              className="w-full p-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div className="flex justify-end mb-6 text-sm">
            <a href="#" className="hover:underline text-gray-600">
              Forgot Password?
            </a>
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white hover:bg-neutral-800 px-5 py-3 rounded-md text-sm font-medium transition-colors"
          >
            Log In
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500">
          Don&apos;t have an account? <a href="#" className="font-semibold text-black">Sign up</a>
        </p>
      </div>
    </div>
  );
}