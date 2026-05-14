"use client";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const router = useRouter();

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <div className="text-2xl font-semibold mb-8 flex items-center gap-2 text-black">
          <i className="fa-solid fa-layer-group "></i> DocuAI
        </div>
        <h2 className="text-xl font-medium mb-2 text-black">Reset Password</h2>
        <p className="text-gray-500 text-sm mb-8">
          Enter your email to receive a password reset link.
        </p>

        <form onSubmit={handleReset}>
          <div className="mb-5">
            <label className="block text-sm font-medium mb-2 text-black" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="name@company.com"
              required
              className="w-full p-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black transition-colors text-black"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white p-3 rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors mb-6"
          >
            Send Reset Link
          </button>

          <p className="text-center text-sm text-gray-500">
            Remember your password?{" "}
            <a href="/login" className="text-black font-medium hover:underline">
              Log in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

