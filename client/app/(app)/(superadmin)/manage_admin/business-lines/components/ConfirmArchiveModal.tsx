"use client";

interface ConfirmArchiveModalProps {
  isOpen: boolean;
  lineName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmArchiveModal({ isOpen, lineName, onConfirm, onClose }: ConfirmArchiveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-black">Archive Business Line</h2>
          <p className="mt-3 text-sm text-gray-600">Are you sure you want to archive <span className="font-semibold text-gray-900">{lineName}</span>? This will mark the business line as inactive.</p>
        </div>
        <div className="p-5 border-t border-gray-200 flex justify-end gap-3 bg-neutral-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors cursor-pointer focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer focus:outline-none"
          >
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}
