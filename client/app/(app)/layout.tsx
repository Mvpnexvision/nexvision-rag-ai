"use client";
import { useState } from "react";
import Sidebar from "../../components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-neutral-50 w-full">
            <Sidebar
                isCollapsed={isCollapsed}
                toggleSidebar={() => setIsCollapsed(!isCollapsed)}
                isMobileOpen={isMobileOpen}
                toggleMobile={() => setIsMobileOpen(!isMobileOpen)}
            />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
                    <button
                        aria-label="Open menu"
                        onClick={() => setIsMobileOpen(true)}
                        className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md"
                    >
                        <i className="fa-solid fa-bars" aria-hidden="true"></i>
                    </button>
                    <div className="font-semibold flex items-center gap-2">
                        <i className="fa-solid fa-layer-group" aria-hidden="true"></i>
                        <span>DocuAI</span>
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}