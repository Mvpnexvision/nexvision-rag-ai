"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    isMobileOpen: boolean;
    toggleMobile: () => void;
}

export default function Sidebar({ isCollapsed, toggleSidebar, isMobileOpen, toggleMobile }: SidebarProps) {
    const pathname = usePathname();

    const navItems = [
        { name: "Dashboard", path: "/dashboard", icon: "fa-border-all" },
        { name: "AI Chat", path: "/chat", icon: "fa-message" },
        { name: "Documents", path: "/documents", icon: "fa-folder-open" },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={toggleMobile}
                ></div>
            )}

            <aside
                className={`fixed md:relative top-0 bottom-0 left-0 z-50 bg-[#101B1D] border-r border-[#122F35] flex flex-col transition-all duration-300 ease-in-out
          ${isCollapsed ? "w-[72px]" : "w-[260px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
            >
                <div className={`h-16 flex items-center px-5 border-b border-[#122F35] ${isCollapsed ? "justify-center" : "justify-between"}`}>
                    {!isCollapsed && (
                        <div className="font-semibold text-lg flex items-center gap-2 text-white">
                            <i className="fa-solid fa-layer-group"></i> <span>DocuAI</span>
                        </div>
                    )}
                    <button aria-label="Toggle sidebar" onClick={toggleSidebar} className="hidden md:flex w-9 h-9 items-center justify-center text-white hover:bg-[#122F35] hover:text-[#0DBBC4] rounded-md transition-colors">
                        <i className="fa-solid fa-bars"></i>
                    </button>
                    <button aria-label="Toggle mobile menu" onClick={toggleMobile} className="md:hidden flex w-9 h-9 items-center justify-center text-white hover:bg-[#122F35] hover:text-[#0DBBC4] rounded-md transition-colors">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <nav className="p-4 flex flex-col gap-1 flex-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            aria-label={item.name}
                            onClick={() => isMobileOpen && toggleMobile()}
                            className={`flex items-center gap-4 px-4 py-3 rounded-md text-sm font-medium transition-colors ${pathname === item.path
                                    ? "bg-[#122F35] text-[#0DBBC4]"
                                    : "text-white hover:bg-[#122F35] hover:text-[#0DBBC4]"
                                } ${isCollapsed ? "justify-center px-0" : ""}`}
                        >
                            <i className={`fa-solid ${item.icon} text-lg w-5 text-center`}></i>
                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                    ))}

                    <div className="flex-1"></div>

                    <button aria-label="Settings" className={`flex items-center gap-4 px-4 py-3 rounded-md text-sm font-medium text-white hover:bg-[#122F35] hover:text-[#0DBBC4] transition-colors ${isCollapsed ? "justify-center px-0" : ""}`}>
                        <i className="fa-solid fa-gear text-lg w-5 text-center"></i>
                        {!isCollapsed && <span>Settings</span>}
                    </button>
                    <Link aria-label="Logout" href="/" className={`flex items-center gap-4 px-4 py-3 rounded-md text-sm font-medium text-white hover:bg-[#122F35] hover:text-[#0DBBC4] transition-colors ${isCollapsed ? "justify-center px-0" : ""}`}>
                        <i className="fa-solid fa-arrow-right-from-bracket text-lg w-5 text-center"></i>
                        {!isCollapsed && <span>Logout</span>}
                    </Link>
                </nav>
            </aside>
        </>
    );
}