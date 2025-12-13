import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AuthGuard() {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Cek sesi saat ini
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // 2. Pasang pendengar jika status login berubah (misal logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return <div className="h-screen flex items-center justify-center">Loading...</div>;
    }

    // Jika tidak ada session (belum login), lempar ke halaman Login
    if (!session) {
        return <Navigate to="/login" replace />;
    }

    // Jika ada session, izinkan masuk ke halaman anak (Outlet)
    return <Outlet />;
}