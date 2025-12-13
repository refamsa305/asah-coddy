import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Paksa window scroll ke koordinat (0,0) setiap link berubah
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
