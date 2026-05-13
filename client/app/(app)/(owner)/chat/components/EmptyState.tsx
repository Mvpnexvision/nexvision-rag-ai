"use client";

interface EmptyStateProps {
    onSuggestionClick: (text: string) => void;
}

export default function EmptyState({ onSuggestionClick }: EmptyStateProps) {
    const suggestions = [
        { title: "Summarize document", desc: "Give me a quick overview of the key points." },
        { title: "Extract action items", desc: "List all tasks and deadlines from the file." },
        { title: "Identify risks", desc: "Find potential issues mentioned in the text." },
        { title: "Draft an email", desc: "Write an update based on these requirements." }
    ];

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center h-full py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-6 border border-gray-200 shadow-sm">
                <i className="fa-solid fa-sparkles text-2xl text-black"></i>
            </div>

            <h2 className="text-2xl font-semibold text-black mb-3">
                How can I help you today?
            </h2>

            <p className="text-gray-500 max-w-md mx-auto mb-10 text-sm">
                Upload your documents and ask questions to extract insights, summarize data, or generate reports instantly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full text-left">
                {suggestions.map((item, index) => (
                    <button
                        key={index}
                        onClick={() => onSuggestionClick(`${item.title}: ${item.desc}`)}
                        className="p-4 border border-gray-200 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer group text-left"
                    >
                        <span className="font-medium text-black block mb-1 group-hover:text-neutral-700 transition-colors">
                            {item.title}
                        </span>
                        <span className="text-xs text-gray-500">
                            {item.desc}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}