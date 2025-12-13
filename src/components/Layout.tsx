import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MessageSquare, Map, LogOut, Bot } from 'lucide-react';

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [userName, setUserName] = useState('User');
    const [userProfile, setUserProfile] = useState<{ selected_interest: string | null, competency_level: string | null } | null>(null);

    // Cek Halaman Aktif (untuk highlight tombol bawah)
    const isActive = (path: string) => {
        if (path === '/roadmaps') {
            // Aktif jika di halaman list /roadmaps ATAU detail /roadmap/:id
            return location.pathname === '/roadmaps' || location.pathname.startsWith('/roadmap/');
        }
        return location.pathname === path;
    };

    // Ambil Data User (Nama & Profile) dari Supabase saat layout dimuat
    useEffect(() => {
        const getUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Ambil nama
                const name = user.user_metadata?.full_name || user.email?.split('@')[0];
                setUserName(name);

                // Ambil Profile (Interest & Level)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('selected_interest, competency_level')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setUserProfile(profile);
                }
            }
        };

        // Listen for custom event 'profileUpdated'
        const handleProfileUpdate = () => {
            getUserData();
        };

        window.addEventListener('profileUpdated', handleProfileUpdate);
        getUserData();

        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate);
        };
    }, []);

    // Fungsi Logout
    const handleLogout = async () => {
        if (window.confirm('Apakah Anda yakin ingin keluar?')) {
            await supabase.auth.signOut();
            navigate('/'); // Kembali ke Dashboard Dicoding (halaman awal)
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-24 font-sans">
            {/* pt-24: Ruang untuk Header Atas. pb-24: Ruang untuk Menu Bawah */}

            {/* --- HEADER ATAS (LOGO & USER) --- */}
            <div className="fixed top-0 left-0 right-0 bg-white z-50 px-6 py-4 shadow-sm flex justify-between items-center border-b border-gray-100 h-20">

                {/* KIRI: Logo & Slogan */}
                <div className="flex items-center gap-3">
                    {/* Icon Robot */}
                    <img
                        src="/coddy-logo.svg"
                        alt="Tanya Coddy"
                        className="w-16 h-16 object-contain group-hover:rotate-12 transition-transform"
                    />
                    {/* Teks Coddy + Slogan */}
                    <div className="flex flex-col justify-center">
                        <h1 className="font-bold text-xl text-gray-800 leading-none mb-0.5">Coddy</h1>
                        <p className="text-[10px] text-gray-400 font-medium tracking-wide">Your coding friends</p>
                    </div>
                </div>

                {/* KANAN: User Profile & Logout */}
                <div className="flex items-center gap-4">



                    {/* Garis Pemisah Kecil */}
                    <div className="h-6 w-[1px] bg-gray-200 hidden md:block"></div>

                    {/* Info User */}
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-400">Halo,</p>
                            <p className="text-sm font-bold text-gray-700 max-w-[150px] truncate">{userName}</p>
                        </div>

                        {/* Chips Interest & Level */}
                        {userProfile?.selected_interest && (
                            <div className="hidden lg:flex flex-col items-end gap-1 mr-2">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">
                                    {userProfile.selected_interest}
                                </span>
                                {userProfile.competency_level && (
                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 uppercase tracking-wider">
                                        {userProfile.competency_level}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Avatar Inisial */}
                        <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm border border-emerald-200">
                            {userName.charAt(0).toUpperCase()}
                        </div>

                        {/* Tombol Logout */}
                        <button
                            onClick={handleLogout}
                            className="ml-1 p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Keluar"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- KONTEN UTAMA (Tempat Halaman Berubah-ubah) --- */}
            <Outlet />

            {/* --- BOTTOM NAVIGATION (MENU BAWAH) --- */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">

                {/* Tombol Chat */}
                <Link to="/chat" className="flex flex-col items-center gap-1 group w-16">
                    <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive('/chat') ? 'bg-emerald-500 shadow-lg shadow-emerald-200 translate-y-[-5px]' : 'bg-transparent'}`}>
                        <MessageSquare className={`w-6 h-6 ${isActive('/chat') ? 'text-white' : 'text-gray-400 group-hover:text-emerald-500'}`} />
                    </div>
                    <span className={`text-[10px] font-bold ${isActive('/chat') ? 'text-emerald-600' : 'text-gray-400'}`}>Chat</span>
                </Link>

                {/* Tombol Roadmap (LINK SUDAH DIPERBAIKI KE /roadmaps) */}
                <Link to="/roadmaps" className="flex flex-col items-center gap-1 group w-16">
                    <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive('/roadmaps') ? 'bg-emerald-500 shadow-lg shadow-emerald-200 translate-y-[-5px]' : 'bg-transparent'}`}>
                        <Map className={`w-6 h-6 ${isActive('/roadmaps') ? 'text-white' : 'text-gray-400 group-hover:text-emerald-500'}`} />
                    </div>
                    <span className={`text-[10px] font-bold ${isActive('/roadmaps') ? 'text-emerald-600' : 'text-gray-400'}`}>Roadmap</span>
                </Link>
            </div>
        </div>
    );
}