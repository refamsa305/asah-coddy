# Coddy - Teman Ngodingmu

Platform pembelajaran coding dengan pendekatan conversational-first, di mana seluruh pengalaman pengguna (onboarding, asesmen, roadmap, tracking) terjadi dalam satu antarmuka chat yang modern dan interaktif.

## 🚀 Fitur Utama

- **Onboarding Percakapan Interaktif**: Pengalaman onboarding yang natural melalui chat
- **Roadmap Visual Adaptif**: Visualisasi learning path menggunakan React Flow
- **Progress Tracking Proaktif**: Sistem tracking pembelajaran yang real-time
- **Rekomendasi Kelas Kontekstual**: Saran kelas yang disesuaikan dengan profil user
- **Animasi Smooth**: Transisi dan animasi menggunakan Framer Motion

## 🛠️ Teknologi

- **React 18** - Library UI
- **Vite** - Build tool & dev server
- **Tailwind CSS 4** - Styling
- **Motion (Framer Motion)** - Animasi
- **React Flow** - Visualisasi roadmap
- **Lucide React** - Icons
- **Gemini** - Chatbot
- **Supabase** - Database

## Model Machine Learning
Proyek Coddy mengadopsi arsitektur modern Cloud-Native. Kami tidak melatih model dari nol.
Sebaliknya, kami menggunakan layanan Large Language Model siap pakai, yaitu Gemini 1.5 Flash API, sebagai Core Intelligence dari mentor Coddy.
Dengan menggunakan API, kami tidak memiliki file model fisik untuk diunggah. Keunggulan arsitektur ini adalah Skalabilitas Instan dan Biaya Operasional yang Terkendali. Inti kecerdasan buatan kami ada di Prompt Engineering yang kami tanamkan di dalam Edge Function, yang membuat Gemini dapat membaca Minat, Level, dan Progres user dari database secara real-time.
**Functions ML** - https://drive.google.com/drive/folders/1wSaJaT1OE28t1aqXBJK_INxzL7w7ZMqW?usp=sharing

## 📁 Struktur Folder

```
asah-coddy/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── ChatInterface.tsx
│   │   ├── RoadmapInChat.tsx
│   │   └── ...
│   ├── styles/         # Global styles
│   │   └── globals.css
│   ├── App.tsx         # Main App component
│   └── main.tsx        # Entry point
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.ts      # Vite configuration
└── README.md          # Documentation
```

## 🎨 Design System

- **Primary Color**: #36BFB0 (Teal)
- **Typography**: Custom font sizing dengan CSS variables
- **Spacing**: Tailwind default spacing scale
- **Animations**: Smooth transitions dengan Motion

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🎯 Learning Paths

- Front-End Web Developer
- Android Developer
- Data Scientist
- MLOps Engineer
- Back-End Developer JavaScript
- Back-End Developer Python
- Gen AI Engineer
- AI Engineer
- React Developer
- Multi-Platform App Developer
- iOS Developer
- Google Cloud Professional
- DevOps Engineer

## 📱 Responsive Design

Aplikasi fully responsive dan dapat digunakan di berbagai ukuran layar:
- Desktop (>= 1024px)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## 📝 License

MIT License - feel free to use this project for learning purposes.
