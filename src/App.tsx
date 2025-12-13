import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DicodingDashboard from './pages/DicodingDashboard';
import ChatPage from './pages/ChatPage';
import RoadmapDetail from './pages/RoadmapDetail';
import RoadmapHome from './pages/RoadmapHome';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop'; // <--- Import ini

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop /> {/* <--- Pasang di sini agar aktif di semua halaman */}

      <Routes>
        {/* ... (kode routing lainnya tetap sama) ... */}
        <Route path="/" element={<DicodingDashboard />} />

        <Route element={<AuthGuard />}>
          <Route element={<Layout />}>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/roadmaps" element={<RoadmapHome />} />
            <Route path="/roadmap/:id" element={<RoadmapDetail />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;