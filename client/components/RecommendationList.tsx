import Link from "next/link";

const prompts = [
    "Summarize the Q3 Financial Report highlights",
    "Extract all action items from Project Requirements v2",
    "Identify negative sentiment in Q1-Q2 User Feedback",
];

export default function RecommendationList() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-medium text-black mb-6">
                Recent Recommendations
            </h2>

            <ul className="flex flex-col gap-3">
                {prompts.map((prompt, i) => (
                    <li key={i}>
                        <Link
                            href="/chat"
                            className="p-4 bg-neutral-50 border border-gray-200 rounded-md text-sm text-black flex items-center gap-3 hover:border-black hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                        >
                            <i className="fa-solid fa-wand-magic-sparkles text-gray-400 text-lg" />
                            <span>{prompt}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}