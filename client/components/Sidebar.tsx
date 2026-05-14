"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { debugLog } from "@/utils/logger";

import ragLogoName from "@/app/resources/rag-logoName.png";
import { useAuth } from "@/contexts/authContext";

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

interface NavCategory {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  role?: "owner" | "superadmin";
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen: boolean;
  toggleMobile: () => void;
}

export default function Sidebar({
  role = "owner",
  isCollapsed,
  toggleSidebar,
  isMobileOpen,
  toggleMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "Main Menu",
  ]);
  const profileRef = useRef<HTMLDivElement>(null);

  // Navigation structure based on role
  const ownerNavItems: NavItem[] = [
    { name: "Dashboard", path: "/dashboard", icon: "fa-border-all" },
    { name: "AI Chat", path: "/chat", icon: "fa-message" },
    { name: "Documents", path: "/documents", icon: "fa-folder-open" },
    // { name: "Recommendations", path: "/recommendations", icon: "fa-circle-info" },
  ];

  const superadminNav: NavCategory[] = [
    {
      title: "Main Menu",
      items: [
        { name: "Dashboard", path: "/dashboard_admin", icon: "fa-border-all" },
      ],
    },
    {
      title: "Manage",
      items: [
        {
          name: "Companies",
          path: "/manage_admin/companies",
          icon: "fa-building",
        },
        {
          name: "Business Lines",
          path: "/manage_admin/business-lines",
          icon: "fa-diagram-project",
        },
        { name: "Users", path: "/manage_admin/users", icon: "fa-users" },
      ],
    },
  ];

  const toggleCategory = (title: string) => {
    setExpandedCategories((prev) =>
      prev.includes(title)
        ? prev.filter((cat) => cat !== title)
        : [...prev, title],
    );
  };

  const isSuperadmin = role === "superadmin";
  const { profile, signOut } = useAuth();
  const displayName = profile?.name ?? "Unknown User";
  const displayRole = profile?.role ?? role;
  const avatarInitials = profile?.name
    ? profile.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : displayRole.charAt(0).toUpperCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <nav className="flex flex-col flex-1 p-4 gap-1 overflow-y-auto">
          {isSuperadmin
            ? // Superadmin categorized navigation
              superadminNav.map((category) => (
                <div key={category.title}>
                  {/* Category header */}
                  {!isCollapsed && (
                    <button
                      onClick={() => toggleCategory(category.title)}
                      className="
                                            w-full flex items-center justify-between
                                            px-4 py-2.5 mb-1
                                            text-xs font-semibold text-gray-400 uppercase tracking-wider
                                            hover:text-gray-300
                                            transition-colors
                                        "
                    >
                      {category.title}
                      <i
                        className={`fa-solid fa-chevron-down text-xs transition-transform ${
                          expandedCategories.includes(category.title)
                            ? ""
                            : "-rotate-90"
                        }`}
                      ></i>
                    </button>
                  )}

                  {/* Category items */}
                  {expandedCategories.includes(category.title) &&
                    category.items.map((item) => (
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
                                            py-3 mb-1
                                            ${isCollapsed ? "justify-center px-0" : "gap-4 px-4"}
                                            ${
                                              pathname === item.path
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
                </div>
              ))
            : // Owner simple navigation
              ownerNavItems.map((item) => (
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
                                    ${
                                      pathname === item.path
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

          <div className="flex-1" />

          {/* ── Profile Section ── */}
          <div ref={profileRef} className="relative">
            {/* Dropdown — opens upward */}
            {showProfileMenu && (
              <div
                className="
                                absolute left-0 right-0 bottom-[calc(100%+8px)]
                                bg-[#0D1F22]
                                border border-[#1a3f47]
                                rounded-lg
                                shadow-xl shadow-black/40
                                overflow-hidden
                                z-10
                            "
              >
                {/* User info header inside dropdown */}
                <div className="px-4 py-3 border-b border-[#1a3f47]">
                  <p className="text-sm font-semibold text-white truncate">
                    First Name
                  </p>
                  <p className="text-xs text-[#0DBBC4]/70 truncate">
                    first@email.com
                  </p>
                </div>

                <button
                  className="
                                    w-full flex items-center gap-3
                                    px-4 py-2.5
                                    text-sm text-gray-300
                                    hover:bg-[#122F35] hover:text-white
                                    transition-colors
                                "
                >
                  <i className="fa-solid fa-gear w-4 text-center text-gray-400"></i>
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => {
                    debugLog("AUTH", "Sidebar logout click");
                    void signOut();
                    if (isMobileOpen) toggleMobile();
                  }}
                  className="
                                        flex items-center gap-3
                                        px-4 py-2.5
                                        text-sm text-gray-300
                                        hover:bg-[#122F35] hover:text-white
                                        border-t border-[#1a3f47]
                                        transition-colors
                                    "
                >
                  <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center text-gray-400"></i>
                  <span>Log out</span>
                </button>
              </div>
            )}

            {/* Profile trigger row */}
            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
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
