type StatCardProps = {
    icon: string;
    title: string;
    value: string | number;
};

export default function StatCard({ icon, title, value }: StatCardProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-start gap-4">
            <i className={`${icon} text-2xl text-gray-500 mt-1`} />
            <div>
                <h3 className="text-xs font-medium text-black uppercase tracking-wider">
                    {title}
                </h3>
                <p className="text-2xl font-semibold text-black mt-1">{value}</p>
            </div>
        </div>
    );
}