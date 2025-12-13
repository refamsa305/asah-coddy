import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
    ArrowLeft, CheckCircle, Circle, Trophy,
    Target, ChevronRight, Lock
} from 'lucide-react';

interface CourseDetail {
    course_id: number;
    course_name: string;
    hours_to_study: number;
    level_name: string;
    is_graduated: boolean;
    description?: string; // Optional desc
}

interface RoadmapMeta {
    name: string;
    description: string;
}

export default function RoadmapDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<CourseDetail[]>([]);
    const [meta, setMeta] = useState<RoadmapMeta>({ name: '', description: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchData(Number(id));
    }, [id]);

    const fetchData = async (pathId: number) => {
        try {
            setLoading(true);
            // 1. Ambil Info Roadmap
            const { data: pathData } = await supabase
                .from('learning_paths')
                .select('name, description')
                .eq('id', pathId)
                .single();
            if (pathData) setMeta(pathData);

            // 2. Ambil Materi (RPC)
            const { data: courseData, error } = await supabase.rpc('get_courses_by_learning_path', {
                p_learning_path_id: pathId
            });
            if (error) throw error;
            setCourses(courseData || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (courseId: number, currentStatus: boolean) => {
        setCourses(prev => prev.map(c =>
            c.course_id === courseId ? { ...c, is_graduated: !currentStatus } : c
        ));
        await supabase.rpc('set_course_progress', {
            p_course_id: courseId,
            p_is_graduated: !currentStatus
        });
    };

    // Kalkulasi Statistik
    const completedCount = courses.filter(c => c.is_graduated).length;
    const totalCount = courses.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Grouping Level
    const groupedCourses = courses.reduce((acc, course) => {
        (acc[course.level_name] = acc[course.level_name] || []).push(course);
        return acc;
    }, {} as Record<string, CourseDetail[]>);

    // Urutan Level
    const levelOrder = ["Dasar", "Pemula", "Menengah", "Mahir", "Profesional"];
    const sortedLevels = Object.keys(groupedCourses).sort(
        (a, b) => levelOrder.indexOf(a) - levelOrder.indexOf(b)
    );

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-32 font-sans">

            {/* HEADER NAVIGASI */}
            <div className="bg-white px-6 py-4 sticky top-0 z-20 shadow-sm border-b border-gray-100">
                <div className="max-w-5xl mx-auto flex items-center gap-3 text-gray-500">
                    {/* Ubah tujuannya ke '/roadmaps' */}
                    <button onClick={() => navigate('/roadmaps')} className="hover:text-emerald-500 transition flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
                    </button>
                    <span className="text-gray-300">|</span>
                    <span>Ganti Learning Path</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* PROGRESS SECTION (Mirip Gambar 1) */}
                <div className="bg-white rounded-3xl p-8 mb-12 shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

                        {/* Teks Kiri */}
                        <div className="w-full md:w-2/3">
                            <h1 className="text-gray-500 text-sm font-medium mb-1">Learning Roadmap Anda</h1>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">{meta.name} Path</h2>

                            {/* Progress Bar Linear */}
                            <div className="w-full bg-gray-100 h-3 rounded-full mb-3 overflow-hidden">
                                <div
                                    className="bg-teal-400 h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-400">
                                {completedCount} dari {totalCount} skill diselesaikan
                            </p>
                        </div>

                        {/* Trophy Kanan (Circular Progress) */}
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-gray-400">Progress Total</p>
                                <p className="text-xl font-bold text-teal-600">{progressPercent}%</p>
                            </div>
                            <div className="relative w-16 h-16 flex items-center justify-center">
                                {/* Circle Background */}
                                <svg className="absolute w-full h-full transform -rotate-90">
                                    <circle cx="32" cy="32" r="28" stroke="#f3f4f6" strokeWidth="6" fill="transparent" />
                                    <circle
                                        cx="32" cy="32" r="28"
                                        stroke="#14b8a6" // Teal-500
                                        strokeWidth="6"
                                        fill="transparent"
                                        strokeLinecap="round"
                                        strokeDasharray={175}
                                        strokeDashoffset={175 - (175 * progressPercent) / 100}
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="bg-teal-500 rounded-full p-2 relative z-10 shadow-lg shadow-teal-200">
                                    <Trophy className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* TIMELINE SECTION */}
                <div className="relative">
                    {/* Garis Tengah Biru Putus-putus (Connecting Line) */}
                    <div className="absolute left-[19px] top-4 bottom-0 w-0.5 border-l-2 border-dashed border-sky-200 z-0"></div>

                    <div className="space-y-12">
                        {sortedLevels.map((levelName) => (
                            <div key={levelName} className="relative z-10">

                                {/* Level Header (Icon Target) */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-teal-500 border-4 border-white shadow-md flex items-center justify-center flex-shrink-0 z-10">
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-700">{levelName}</h3>
                                    <div className="h-[1px] flex-1 bg-gray-100"></div> {/* Garis horizontal hiasan */}
                                </div>

                                {/* Grid Card Materi */}
                                <div className="pl-14 grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {groupedCourses[levelName].map((course) => (
                                        <div
                                            key={course.course_id}
                                            onClick={() => handleToggle(course.course_id, course.is_graduated)}
                                            className={`
                        p-6 rounded-2xl border transition-all duration-300 cursor-pointer relative group
                        flex flex-col justify-between min-h-[160px]
                        ${course.is_graduated
                                                    ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                                                    : 'bg-white border-gray-200 hover:border-teal-300 hover:shadow-md'}
                      `}
                                        >
                                            {/* Top Section: Icon & Title */}
                                            <div>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className={`
                             w-10 h-10 rounded-full flex items-center justify-center mb-2
                             ${course.is_graduated ? 'bg-emerald-200 text-emerald-700' : 'bg-gray-50 text-gray-400'}
                          `}>
                                                        {course.is_graduated ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                                    </div>
                                                    {/* Jam Belajar Badge */}
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                                                        {course.hours_to_study} Jam
                                                    </span>
                                                </div>

                                                <h4 className={`font-bold text-lg leading-snug mb-2 ${course.is_graduated ? 'text-emerald-900' : 'text-gray-800'}`}>
                                                    {course.course_name}
                                                </h4>

                                                {/* Deskripsi Statis (Placeholder mirip desain) */}
                                                <p className="text-sm text-gray-500 line-clamp-2">
                                                    Pelajari materi {course.course_name} secara mendalam untuk menguasai level {levelName}.
                                                </p>
                                            </div>

                                            {/* Bottom Section: Action Text */}
                                            <div className="mt-4 pt-4 border-t border-dashed border-gray-200/50 flex items-center text-sm font-semibold">
                                                {course.is_graduated ? (
                                                    <span className="text-emerald-600 flex items-center gap-1">
                                                        <CheckCircle className="w-4 h-4" /> Selesai
                                                    </span>
                                                ) : (
                                                    <span className="text-teal-500 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                                        Lanjutkan <ChevronRight className="w-4 h-4" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Penutup Garis Bawah (Agar garis putus tidak menggantung jelek) */}
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-2.5 h-2.5 rounded-full bg-sky-200 ml-[15px]"></div>
                            <span className="text-sm text-gray-400 italic">Perjalanan berlanjut...</span>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}