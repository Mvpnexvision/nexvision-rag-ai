"use client";
import { useRouter } from "next/navigation";
import { debugLog } from "@/utils/logger";

export default function ForgotPassword() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    debugLog("AUTH", "Forgot password submit");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <div className="text-2xl font-semibold mb-8 flex items-center gap-2 text-black">
          <i className="fa-solid fa-layer-group "></i> DocuAI
        </div>
        <h2 className="text-xl font-medium mb-2 text-black">Forgot Password</h2>
        <p className="text-gray-500 text-sm mb-8">
          Enter your email to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label
              className="block text-sm font-medium mb-2 text-black"
              htmlFor="email"
            >
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
            onClick={() => debugLog("AUTH", "Forgot password button")}
            className="w-full bg-black text-white hover:bg-neutral-800 px-5 py-3 rounded-md text-sm font-medium transition-colors"
          >
            Reset Password
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500">
          Remembered your password?{" "}
          <a href="/login" className="font-semibold text-black">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
