import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRoadmaps } from '../services/api';
import { LearningPath } from '../types/schema';
import { Code, Database, Smartphone, Cloud, Brain } from 'lucide-react';

export default function RoadmapHome() {
    const [paths, setPaths] = useState<LearningPath[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRoadmaps().then(setPaths).catch(console.error);
    }, []);

    // Helper icon sederhana
    const getIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('web')) return <Code className="text-blue-500" />;
        if (n.includes('android') || n.includes('ios')) return <Smartphone className="text-pink-500" />;
        if (n.includes('data')) return <Database className="text-green-500" />;
        if (n.includes('cloud')) return <Cloud className="text-sky-500" />;
        return <Brain className="text-purple-500" />;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Pilih Learning Path Anda</h1>
            <p className="text-gray-500 text-center mb-10">Mulai perjalanan karir codingmu sekarang</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paths.map((path) => (
                    <div
                        key={path.learning_path_id}
                        onClick={() => navigate(`/roadmap/${path.learning_path_id}`)}
                        className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-100 flex flex-col"
                    >
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                            {getIcon(path.learning_path_name)}
                        </div>
                        <h3 className="font-bold text-lg mb-1">{path.learning_path_name}</h3>
                        <p className="text-sm text-gray-500 mb-6">{path.total_courses} Kelas • Est. {path.total_hours} Jam</p>

                        {/* Progress Bar */}
                        <div className="mt-auto">
                            <div className="flex justify-between text-xs font-semibold mb-1">
                                <span>Progress</span>
                                <span className="text-emerald-600">{path.progress_percent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full transition-all duration-500"
                                    style={{ width: `${path.progress_percent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}