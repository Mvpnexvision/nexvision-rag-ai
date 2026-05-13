"use client";

export default function Chat() {
    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto relative text-black">

            {/* Thread */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                {/* User Msg */}
                <div className="flex gap-4 max-w-[85%] self-end flex-row-reverse">
                    <div className="px-5 py-4 rounded-xl text-sm leading-relaxed bg-neutral-100 text-black rounded-br-sm">
                        Based on the uploaded requirements doc, what are the primary milestones for Phase 1?
                    </div>
                </div>

                {/* AI Msg */}
                <div className="flex gap-4 max-w-[85%] self-start">
                    <div className="w-8 h-8 rounded-md bg-black text-white flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-robot"></i>
                    </div>
                    <div className="px-5 py-4 rounded-xl text-sm leading-relaxed bg-white border border-gray-200 rounded-bl-sm">
                        Based on the context provided in <strong>Project_Requirements_v2.docx</strong>, here are the primary milestones for Phase 1: <br /><br />
                        1. Finalize UI/UX wireframes (Due: Oct 15)<br />
                        2. Setup database schema and Next.js boilerplate (Due: Oct 20)<br />
                        3. Implement secure authentication (Due: Oct 25)<br />
                        <br />
                        Would you like me to detail the deliverables for Phase 2?
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 sm:px-8 sm:pb-8 bg-neutral-50">
                <div className="flex gap-2 mb-3 flex-wrap">
                    <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 text-black">
                        <i className="fa-solid fa-file-word text-gray-500" aria-hidden="true"></i>
                        <span>Project_Requirements_v2.docx</span>
                        <button aria-label="Remove file" onClick={() => {}} className="ml-2 text-gray-400 hover:text-black">
                            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl flex items-end p-2 shadow-sm focus-within:border-black transition-colors">
                    <button aria-label="Attach file" className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md transition-colors shrink-0">
                        <i className="fa-solid fa-paperclip" aria-hidden="true"></i>
                    </button>
                    <textarea
                        placeholder="Ask a question about your documents..."
                        rows={1}
                        aria-label="Message input"
                        className="flex-1 border-none resize-none p-2 text-sm outline-none bg-transparent max-h-36 min-h-9"
                    ></textarea>
                    <button aria-label="Send message" className="w-9 h-9 flex items-center justify-center bg-black text-white hover:bg-neutral-800 rounded-md transition-colors shrink-0">
                        <i className="fa-solid fa-arrow-up" aria-hidden="true"></i>
                    </button>
                </div>
                <div className="text-center text-xs text-black mt-3">
                    AI can make mistakes. Consider verifying important information.
                </div>
            </div>
        </div>
    );
}