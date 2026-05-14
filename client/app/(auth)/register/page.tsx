"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const router = useRouter();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/chat");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#122F35] to-[#081518]">

      {/* Naka max-h-[90vh] para hindi lumagpas sa screen height, tapos flex column */}
      <div className="bg-[#141414] p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-md my-8 flex flex-col max-h-[90vh]">

        {/* Header Section (Fixed sa taas) */}
        <div className="text-center mb-6 shrink-0">
          <h2 className="text-2xl font-medium mb-2 text-white">Create an account</h2>
          <p className="text-gray-400 text-sm">
            Join us to start managing your documents with AI.
          </p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col overflow-hidden">

          {/* Scrollable Container para sa Inputs */}
          {/* Nilagyan ng minimalist custom webkit scrollbar classes */}
          <div className="flex-1 overflow-y-auto pr-3 space-y-5 
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-gray-700
            [&::-webkit-scrollbar-thumb]:rounded-full
            hover:[&::-webkit-scrollbar-thumb]:bg-gray-500"
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-white" htmlFor="name">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                placeholder="John Doe"
                required
                className="w-full p-3 border border-gray-600 bg-[#1e1e1e] text-white rounded-md text-sm focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <div>
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

            <div>
              <label className="block text-sm font-medium mb-2 text-white" htmlFor="companyName">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                placeholder="Acme Corp"
                required
                className="w-full p-3 border border-gray-600 bg-[#1e1e1e] text-white rounded-md text-sm focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white" htmlFor="companyType">
                Company Type
              </label>
              <select
                id="companyType"
                required
                defaultValue=""
                className="w-full p-3 border border-gray-600 bg-[#1e1e1e] text-white rounded-md text-sm focus:outline-none focus:border-white transition-colors appearance-none"
              >
                <option value="" disabled>Select company type</option>
                <option value="technology">Technology / IT</option>
                <option value="finance">Finance / Banking</option>
                <option value="healthcare">Healthcare</option>
                <option value="retail">Retail / E-commerce</option>
                <option value="education">Education</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Dinagdag ko ang pb-2 para may konting space sa pinaka-ilalim ng scroll */}
            <div className="pb-2">
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
          </div>

          {/* Action Section (Fixed sa ilalim) */}
          <div className="shrink-0 mt-6 pt-2 border-t border-[#1e1e1e]">
            <button
              type="submit"
              className="w-full bg-[#0DBBC4] text-white hover:bg-[#0aa3ab] px-5 py-3 rounded-md text-sm font-medium transition-colors mb-6 mt-4"
            >
              Create Account
            </button>

            <p className="text-center text-sm text-gray-400 pb-2">
              Already have an account?{" "}
              <Link href="/login" className="text-white font-medium hover:underline transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}