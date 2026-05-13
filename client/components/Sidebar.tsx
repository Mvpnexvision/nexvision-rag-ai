"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

import ragLogoName from "@/app/resources/rag-logoName.png";

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    isMobileOpen: boolean;
    toggleMobile: () => void;
}

export default function Sidebar({
    isCollapsed,
    toggleSidebar,
    isMobileOpen,
    toggleMobile,
}: SidebarProps) {
    const pathname = usePathname();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

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
                    className="fixed inset-0 z-40 bg-black/40 md:hidden"
                    onClick={toggleMobile}
                />
            )}

            <aside
                className={`
                    fixed md:relative top-0 bottom-0 left-0 z-50
                    flex flex-col
                    bg-[#101B1D]
                    border-r border-[#122F35]
                    transition-all duration-300 ease-in-out
                    ${isCollapsed ? "w-[72px]" : "w-[260px]"}
                    ${isMobileOpen
                        ? "translate-x-0"
                        : "-translate-x-full md:translate-x-0"
                    }
                `}
            >
                {/* Header */}
                <div
                    className={`
                        h-16 border-b border-[#122F35]
                        flex items-center
                        ${isCollapsed ? "justify-center" : "justify-between px-5"}
                    `}
                >
                    {/* Logo Name - only show when expanded */}
                    {!isCollapsed && (
                        <Image
                            src={ragLogoName}
                            alt="RAG Logo Name"
                            width={120}
                            height={24}
                        />
                    )}

                    {/* Desktop Toggle - Always visible on desktop, sole expand/collapse mechanism */}
                    <button
                        aria-label="Toggle sidebar"
                        onClick={toggleSidebar}
                        className="
                            hidden md:flex
                            w-9 h-9
                            items-center justify-center
                            rounded-md
                            text-white
                            hover:bg-[#122F35]
                            hover:text-[#0DBBC4]
                            transition-colors
                            flex-shrink-0
                        "
                    >
                        <i className="fa-solid fa-bars"></i>
                    </button>

                    {/* Mobile Close */}
                    <button
                        aria-label="Toggle mobile menu"
                        onClick={toggleMobile}
                        className="
                            md:hidden flex
                            w-9 h-9
                            items-center justify-center
                            rounded-md
                            text-white
                            hover:bg-[#122F35]
                            hover:text-[#0DBBC4]
                            transition-colors
                        "
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col flex-1 p-4 gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            aria-label={item.name}
                            onClick={() => isMobileOpen && toggleMobile()}
                            className={`
                                flex items-center
                                rounded-md
                                text-sm font-medium
                                transition-colors
                                py-3
                                ${isCollapsed ? "justify-center px-0" : "gap-4 px-4"}
                                ${pathname === item.path
                                    ? "bg-[#122F35] text-[#0DBBC4]"
                                    : "text-white hover:bg-[#122F35] hover:text-[#0DBBC4]"
                                }
                            `}
                        >
                            <i
                                className={`fa-solid ${item.icon} text-lg w-5 text-center`}
                            ></i>

                            {!isCollapsed && <span>{item.name}</span>}
                        </Link>
                    ))}

                    <div className="flex-1"></div>

                    {/* Profile Section */}
                    <div className="relative mb-4">
                        <button
                            onMouseEnter={() => setShowProfileMenu(true)}
                            onMouseLeave={() => setShowProfileMenu(false)}
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className={`
                                w-full
                                flex items-center
                                rounded-md
                                text-sm font-medium
                                transition-colors
                                py-3
                                ${isCollapsed ? "justify-center px-0" : "gap-4 px-4"}
                                ${showProfileMenu
                                    ? "bg-[#122F35] text-[#0DBBC4]"
                                    : "text-white hover:bg-[#122F35] hover:text-[#0DBBC4]"
                                }
                            `}
                        >
                            {/* Avatar */}
                            <div
                                className="
                                    w-10 h-10
                                    rounded-full
                                    bg-gray-400
                                    flex items-center justify-center
                                    flex-shrink-0
                                "
                            >
                                <i className="fa-solid fa-user text-sm text-white"></i>
                            </div>

                            {/* Profile Info - only show when expanded */}
                            {!isCollapsed && (
                                <>
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-medium">
                                            First Name
                                        </p>

                                        <p className="text-xs text-gray-400">
                                            Staff
                                        </p>
                                    </div>

                                    <i
                                        className={`
                                            fa-solid fa-chevron-down
                                            text-xs
                                            transition-transform
                                            ${showProfileMenu
                                                ? "rotate-180"
                                                : ""
                                            }
                                        `}
                                    ></i>
                                </>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {showProfileMenu && (
                            <div
                                onMouseEnter={() => setShowProfileMenu(true)}
                                onMouseLeave={() => setShowProfileMenu(false)}
                                className="
                                    absolute
                                    left-0 right-0
                                    bottom-[110%]
                                    bg-[#0A1618]
                                    border border-[#1a3f47]
                                    rounded-md
                                    shadow-lg
                                    overflow-hidden
                                    z-10
                                "
                            >
                                <button
                                    className="
                                        w-full
                                        flex items-center gap-3
                                        px-4 py-3
                                        text-sm text-left
                                        text-white
                                        hover:bg-[#122F35]
                                        transition-colors
                                    "
                                >
                                    <i className="fa-solid fa-gear text-lg w-5"></i>
                                    <span>Settings</span>
                                </button>

                                <Link
                                    href="/"
                                    className="
                                        flex items-center gap-3
                                        px-4 py-3
                                        text-sm
                                        text-white
                                        border-t border-[#0a1618]
                                        hover:bg-[#122F35]
                                        transition-colors
                                    "
                                >
                                    <i className="fa-solid fa-arrow-right-from-bracket text-lg w-5"></i>
                                    <span>Logout</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>
            </aside>
        </>
    );
}