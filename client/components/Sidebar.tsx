"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, type ReactElement } from "react";

import ragLogoName from "@/app/resources/rag-logoName.png";
import { useAuth } from "@/contexts/authContext";
import { debugLog } from "@/utils/logger";

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
}: SidebarProps): ReactElement {
  const pathname = usePathname();
  const { signOut, profile, user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const displayName =
    profile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Guest";
  const displayEmail = profile?.email || user?.email || "Not signed in";
  const displayRole = profile?.role || "User";
  const avatarInitials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: "fa-border-all" },
    { name: "AI Chat", path: "/chat", icon: "fa-message" },
    { name: "Documents", path: "/documents", icon: "fa-folder-open" },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => {
            debugLog("UI", "Sidebar overlay click");
            toggleMobile();
          }}
        />
      )}

      <aside
        className={`
                    fixed md:relative top-0 bottom-0 left-0 z-50
                    flex flex-col
                    bg-[#101B1D]
                    border-r border-[#122F35]
                    transition-all duration-300 ease-in-out
                    ${isCollapsed ? "w-18" : "w-65"}
                    ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
      >
        <div
          className={`
                        h-16 border-b border-[#122F35]
                        flex items-center
                        ${isCollapsed ? "justify-center" : "justify-between px-5"}
                    `}
        >
          {!isCollapsed && (
            <Image
              src={ragLogoName}
              alt="RAG Logo Name"
              width={120}
              height={24}
            />
          )}

          <button
            aria-label="Toggle sidebar"
            onClick={() => {
              debugLog("UI", "Sidebar toggle");
              toggleSidebar();
            }}
            className="hidden md:flex w-9 h-9 items-center justify-center rounded-md text-white hover:bg-[#122F35] hover:text-[#0DBBC4] transition-colors shrink-0"
          >
            <i className="fa-solid fa-bars" />
          </button>

          <button
            aria-label="Toggle mobile menu"
            onClick={() => {
              debugLog("UI", "Sidebar mobile toggle");
              toggleMobile();
            }}
            className="md:hidden flex w-9 h-9 items-center justify-center rounded-md text-white hover:bg-[#122F35] hover:text-[#0DBBC4] transition-colors"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <nav className="flex flex-col flex-1 p-4 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              aria-label={item.name}
              onClick={() => {
                debugLog("UI", `Sidebar nav: ${item.path}`);
                if (isMobileOpen) toggleMobile();
              }}
              className={`
                                flex items-center
                                rounded-md
                                text-sm font-medium
                                transition-colors
                                py-3
                                ${isCollapsed ? "justify-center px-0" : "gap-4 px-4"}
                                ${pathname === item.path ? "bg-[#122F35] text-[#0DBBC4]" : "text-white hover:bg-[#122F35] hover:text-[#0DBBC4]"}
                            `}
            >
              <i className={`fa-solid ${item.icon} text-lg w-5 text-center`} />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          ))}

          <div className="flex-1" />

          <div ref={profileRef} className="relative">
            {showProfileMenu && (
              <div className="absolute left-0 right-0 bottom-[calc(100%+8px)] bg-[#0D1F22] border border-[#1a3f47] rounded-lg shadow-xl shadow-black/40 overflow-hidden z-10">
                <div className="px-4 py-3 border-b border-[#1a3f47]">
                  <p className="text-sm font-semibold text-white truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-[#0DBBC4]/70 truncate">
                    {displayEmail}
                  </p>
                </div>

                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#122F35] hover:text-white transition-colors">
                  <i className="fa-solid fa-gear w-4 text-center text-gray-400" />
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    debugLog("AUTH", "Sidebar logout click");
                    void signOut();
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#122F35] hover:text-white border-t border-[#1a3f47] transition-colors"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center text-gray-400" />
                  <span>Log out</span>
                </button>
              </div>
            )}

            <button
              onClick={() => {
                debugLog("UI", "Profile menu toggle");
                setShowProfileMenu((prev) => !prev);
              }}
              className={`
                                w-full group
                                flex items-center gap-3
                                px-3 py-2.5
                                rounded-lg
                                transition-colors
                                ${showProfileMenu ? "bg-[#122F35]" : "hover:bg-[#122F35]/60"}
                                ${isCollapsed ? "justify-center" : ""}
                            `}
            >
              <div className="w-8 h-8 rounded-full shrink-0 bg-linear-to-br from-[#0DBBC4]/30 to-[#0DBBC4]/10 border border-[#0DBBC4]/30 flex items-center justify-center">
                <span className="text-xs font-semibold text-[#0DBBC4]">
                  {avatarInitials}
                </span>
              </div>

              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-white truncate leading-tight">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 truncate leading-tight">
                      {displayRole}
                    </p>
                  </div>

                  <i className="fa-solid fa-ellipsis text-xs text-gray-500 group-hover:text-gray-300 transition-colors" />
                </>
              )}
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
