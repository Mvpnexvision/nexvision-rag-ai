export default function UploadCard() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
            <h2 className="text-xl font-medium text-black mb-6">Quick Upload</h2>

            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-12 text-center bg-neutral-50 hover:border-black transition-colors cursor-pointer">
                <i className="fa-solid fa-cloud-arrow-up text-4xl text-black mb-4" />
                <p className="font-medium text-black mb-2">Drag and drop files here</p>
                <span className="text-sm text-black mb-4">or</span>

                <button className="bg-transparent border border-gray-200 text-black hover:bg-neutral-100 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Browse Files
                </button>

                <p className="text-xs text-black mt-4">
                    Supports PDF, DOCX, TXT, CSV
                </p>
            </div>
        </div>
    );
}