"use client";

type DocumentCardProps = {
    icon: string;
    name: string;
    meta: string;
    viewMode: "grid" | "list";
    onDelete?: () => void;
};

export default function DocumentCard({
    icon,
    name,
    meta,
    viewMode,
    onDelete,
}: DocumentCardProps) {
    return (
        <div
            className={`group border border-gray-200 bg-white rounded-xl cursor-pointer hover:border-black hover:shadow-sm hover:bg-neutral-50 transition-all relative 
            ${viewMode === "grid"
                ? "p-5 flex flex-col gap-2 text-left"
                : "p-4 flex items-center gap-4"
            }`}
        >
            <i
                className={`fa-solid ${icon} text-[#122F35] ${
                    viewMode === "grid" ? "text-2xl mb-1" : "text-xl"
                }`}
            />

            <div className={viewMode === "list" ? "flex-1 min-w-0" : "w-full"}>
                <span className="text-sm font-medium text-black block truncate w-full mb-1">
                    {name}
                </span>
                <span className="text-xs text-gray-400 block">{meta}</span>
            </div>

            <button
                aria-label="Delete document"
                onClick={onDelete}
                className={`absolute right-2 top-2 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 rounded-md transition-all cursor-pointer focus:outline-none 
                ${viewMode === "list"
                    ? "relative top-0 right-0 border border-transparent opacity-100"
                    : ""
                }`}
            >
                <i className="fa-solid fa-trash text-sm" />
            </button>
        </div>
    );
}