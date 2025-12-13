import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Bot, User, LogOut, Hexagon, ArrowRight, Lock, Mail } from 'lucide-react';

export default function DicodingDashboard() {
    const [session, setSession] = useState<any>(null);
    const [userName, setUserName] = useState('');

    // State untuk Form Login
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // 1. Cek Status Login saat halaman dibuka
    useEffect(() => {
        checkSession();

        // Dengarkan perubahan login/logout realtime
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
                setUserName(name);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
            const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
            setUserName(name);
        }
    };

    // 2. Fungsi Login / Daftar
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isRegisterMode) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } },
                });
                if (error) throw error;
                alert('Pendaftaran berhasil! Anda otomatis masuk.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
            // Kita TIDAK navigate kemana-mana, tetap di halaman ini sesuai request
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    // 3. Fungsi Logout
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setUserName('');
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row font-sans">

            {/* --- BAGIAN KIRI: BRANDING DICODING --- */}
            <div className="w-full md:w-1/2 bg-[#2d3e50] text-white flex flex-col justify-center items-center p-12 relative overflow-hidden">
                {/* Hiasan background */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-1/3 translate-y-1/3"></div>

                <div className="relative z-10 text-center">
                    <div className="mb-8 flex justify-center">
                        <img
                            src="/dicoding-logo.png"
                            alt="Logo Dicoding"
                            className="w-70 h-auto object-contain drop-shadow-lg" // Sesuaikan w-48 (lebar) sesuai selera
                        />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                        Dashboard <br /> <span className="text-emerald-400">Dicoding</span>
                    </h1>
                    <p className="text-gray-300 text-lg max-w-md mx-auto">
                        Platform belajar pemrograman terdepan di Indonesia. Bangun karir digitalmu sekarang.
                    </p>
                </div>
            </div>

            {/* --- BAGIAN KANAN: INTERAKSI --- */}
            <div className="w-full md:w-1/2 bg-gray-50 flex flex-col relative">

                {/* HEADER POJOK KANAN (Hanya muncul jika Login) */}
                {session && (
                    <div className="absolute top-0 right-0 p-6 flex items-center gap-4 z-20">
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Welcome back,</p>
                            <p className="text-sm font-bold text-gray-800">{userName}</p>
                        </div>
                        <div className="w-10 h-10 bg-[#2d3e50] text-white rounded-full flex items-center justify-center font-bold">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* KONTEN TENGAH */}
                <div className="flex-1 flex items-center justify-center p-8">

                    {session ? (
                        // --- TAMPILAN SETELAH LOGIN (DASHBOARD AREA) ---
                        <div className="text-center w-full max-w-lg">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Kelas Saya</h2>
                                <p className="text-gray-500 mb-6">Lanjutkan progres belajar terakhir Anda.</p>

                                {/* Contoh List Kelas Dummy agar terlihat seperti Dashboard LMS */}
                                <div className="space-y-3 text-left">
                                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex justify-between items-center">
                                        <span className="font-medium text-gray-700">Belajar Dasar Web</span>
                                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">80%</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex justify-between items-center">
                                        <span className="font-medium text-gray-700">Menjadi Android Developer</span>
                                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">20%</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-gray-400 text-sm">
                                Butuh bantuan belajar? <br /> Klik logo <b>Coddy</b> di pojok kanan bawah.
                            </p>
                        </div>

                    ) : (
                        // --- FORM LOGIN / DAFTAR ---
                        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                                {isRegisterMode ? 'Daftar Akun' : 'Masuk Dashboard'}
                            </h2>

                            <form className="space-y-4" onSubmit={handleAuth}>
                                {isRegisterMode && (
                                    <div className="relative">
                                        <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                        <input type="text" placeholder="Nama Lengkap" required className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#2d3e50] transition-all" value={fullName} onChange={e => setFullName(e.target.value)} />
                                    </div>
                                )}
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input type="email" placeholder="Email" required className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#2d3e50] transition-all" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input type="password" placeholder="Password" required className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#2d3e50] transition-all" value={password} onChange={e => setPassword(e.target.value)} />
                                </div>

                                <button disabled={loading} className="w-full bg-[#2d3e50] text-white py-3 rounded-xl font-bold hover:bg-[#1a2530] transition-all flex justify-center items-center gap-2">
                                    {loading ? 'Memproses...' : (isRegisterMode ? 'Buat Akun' : 'Masuk')}
                                    {!loading && <ArrowRight className="w-4 h-4" />}
                                </button>
                            </form>

                            <div className="mt-6 text-center text-sm text-gray-500">
                                {isRegisterMode ? 'Sudah punya akun? ' : 'Belum punya akun? '}
                                <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="text-[#2d3e50] font-bold hover:underline">
                                    {isRegisterMode ? 'Login' : 'Daftar'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- FLOATING CODDY BUTTON (HANYA MUNCUL JIKA LOGIN) --- */}
                {session && (
                    <div className="fixed bottom-8 right-8 z-50 animate-bounce-slow">
                        {/* Tooltip kecil */}
                        <div className="absolute bottom-full right-0 mb-2 w-max bg-gray-800 text-white text-xs px-3 py-1 rounded-lg opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                            Tanya Coddy
                        </div>

                        <button
                            onClick={() => navigate('/chat')}
                            className="w-16 h-16 bg-white rounded-full shadow-2xl border-2 border-emerald-500 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer group"
                        >
                            {/* Icon Robot Coddy */}
                            <img
                                src="/coddy-logo.svg"
                                alt="Tanya Coddy"
                                className="w-16 h-16 object-contain group-hover:rotate-12 transition-transform"
                            />

                            {/* Dot Online */}
                            <span className="absolute top-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}