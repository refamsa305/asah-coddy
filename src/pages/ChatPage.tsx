import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TextareaAutosize from 'react-textarea-autosize';
import { Send, Bot, User, Loader2, Play } from 'lucide-react';

// --- TIPE DATA ---

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    isQuiz?: boolean;
    quizOptions?: { text: string; category?: string; isCorrect?: boolean }[];
}

interface InterestQuestion {
    id: number;
    question_text: string;
    options: any;
}

interface TechQuestion {
    id: number;
    tech_category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    question_text: string;
    options: any;
    correct_answer: string;
}

// Mapping Interest -> Tech Categories
const INTEREST_TO_TECH_MAP: Record<string, string[]> = {
    "Artificial Intelligence": ["Machine Learning", "Data"],
    "Mobile Development": ["Android", "iOS", "Multi Platform"],
    "Web Development": ["Web"],
    "Cloud Computing": ["Cloud Computing"],
};

export default function ChatPage() {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // State User Profile
    const [userProfile, setUserProfile] = useState<{ selected_interest: string, competency_level: string } | null>(null);

    useEffect(() => {
        const checkProfile = async () => {
             const { data: { user } } = await supabase.auth.getUser();
             if (user) {
                 const { data: profile } = await supabase
                     .from('profiles')
                     .select('selected_interest, competency_level')
                     .eq('id', user.id)
                     .single();
                 
                 if (profile && profile.selected_interest) {
                     setUserProfile(profile);
                     // Update Welcome Message
                     setMessages(prev => prev.map(msg => 
                        msg.id === 'welcome' 
                        ? { ...msg, text: `Halo! 👋 Profil minatmu saat ini: **${profile.selected_interest}** dengan level **${profile.competency_level}**. Mau tes ulang?` }
                        : msg
                     ));
                 }
             }
        };
        checkProfile();
    }, []);

    // State Global
    const [mode, setMode] = useState<'chat' | 'interest_quiz' | 'tech_quiz'>('chat');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // --- State Interest Quiz ---
    const [interestQuestions, setInterestQuestions] = useState<InterestQuestion[]>([]);
    const [currentInterestIndex, setCurrentInterestIndex] = useState(0);
    const [interestScores, setInterestScores] = useState<Record<string, number>>({});
    const [finalInterest, setFinalInterest] = useState('');

    // --- State Tech Quiz ---
    const [techQuestions, setTechQuestions] = useState<TechQuestion[]>([]);
    const [currentTechIndex, setCurrentTechIndex] = useState(0);
    const [techResults, setTechResults] = useState<{
        category: string;
        difficulty: string;
        isCorrect: boolean;
    }[]>([]);

    // Pesan Awal
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            text: 'Halo! 👋 Saya Coddy. Sebelum kita mulai, yuk cari tahu minat coding kamu dulu!',
            isQuiz: true,
            quizOptions: []
        }
    ]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ============================================================
    // BAGIAN 1: INTEREST QUIZ 
    // ============================================================

    const startInterestQuiz = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('interest_questions').select('*').order('id');
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Data pertanyaan kosong.');

            setInterestQuestions(data);
            setMode('interest_quiz');
            setCurrentInterestIndex(0);
            setInterestScores({});
            showInterestQuestion(data[0]);
        } catch (err: any) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: 'Error: ' + err.message }]);
        } finally {
            setIsLoading(false);
        }
    };

    const showInterestQuestion = (question: InterestQuestion) => {
        let parsedOptions = question.options;
        if (typeof question.options === 'string') {
            try { parsedOptions = JSON.parse(question.options); } catch (e) { }
        }
        setMessages(prev => [...prev, {
            id: `int-${question.id}`,
            role: 'assistant',
            text: question.question_text,
            isQuiz: true,
            quizOptions: parsedOptions
        }]);
    };

    const handleInterestAnswer = (optionText: string, category: string) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: optionText }]);

        const newScores = { ...interestScores, [category]: (interestScores[category] || 0) + 1 };
        setInterestScores(newScores);

        const nextIndex = currentInterestIndex + 1;
        if (nextIndex < interestQuestions.length) {
            setCurrentInterestIndex(nextIndex);
            setTimeout(() => showInterestQuestion(interestQuestions[nextIndex]), 500);
        } else {
            setTimeout(() => finishInterestQuiz(newScores), 500);
        }
    };

    const finishInterestQuiz = (scores: Record<string, number>) => {
        const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const topScore = entries[0][1];
        const winners = entries.filter(e => e[1] === topScore);

        if (winners.length > 1) {
            const tiedCats = winners.map(w => w[0]);
            setMessages(prev => [...prev, {
                id: 'tie-break',
                role: 'assistant',
                text: `Skor seri antara **${tiedCats.join('** dan **')}**. Pilih satu yang paling kamu suka:`,
                isQuiz: true,
                quizOptions: tiedCats.map(c => ({ text: c, category: c }))
            }]);
        } else {
            const winner = winners[0][0];
            setFinalInterest(winner);
            setMessages(prev => [...prev, {
                id: 'int-result',
                role: 'assistant',
                text: `🎉 Minatmu ada di **${winner}**!`
            }]);

            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: 'offer-tech',
                    role: 'assistant',
                    text: `Siap untuk menguji skill teknis di bidang ${winner}?`,
                    isQuiz: true,
                    quizOptions: [
                        { text: "Gas! Mulai Tes Teknis 🚀", category: "START_TECH" },
                        { text: "Nanti dulu deh", category: "CANCEL_TECH" }
                    ]
                }]);
            }, 800);
        }
    };

    // ============================================================
    // BAGIAN 2: TECH QUIZ
    // ============================================================

    const startTechQuiz = async () => {
        setIsLoading(true);
        setMode('tech_quiz');
        setTechResults([]);

        try {
            const targetCategories = INTEREST_TO_TECH_MAP[finalInterest] || ["Web"];

            setMessages(prev => [...prev, {
                id: 'tech-loading',
                role: 'assistant',
                text: `Menyiapkan soal untuk: ${targetCategories.join(', ')}...`
            }]);

            const { data, error } = await supabase
                .from('tech_questions')
                .select('*')
                .in('tech_category', targetCategories);

            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Soal teknis tidak ditemukan.');

            const selectedQuestions = generateQuestionSet(data as TechQuestion[], targetCategories);

            if (selectedQuestions.length === 0) throw new Error('Gagal menyusun soal.');

            setTechQuestions(selectedQuestions);
            setCurrentTechIndex(0);

            showTechQuestion(selectedQuestions[0], 0, selectedQuestions.length);

        } catch (err: any) {
            setMessages(prev => [...prev, { id: 'err', role: 'assistant', text: 'Gagal: ' + err.message }]);
            setMode('chat');
        } finally {
            setIsLoading(false);
        }
    };

    const generateQuestionSet = (allQuestions: TechQuestion[], categories: string[]) => {
        const levels = ['beginner', 'intermediate', 'advanced'] as const;
        const finalSet: TechQuestion[] = [];
        const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);

        levels.forEach(level => {
            const levelQuestions = allQuestions.filter(q => q.difficulty === level);

            if (categories.length === 1) {
                const catQ = shuffle(levelQuestions.filter(q => q.tech_category === categories[0]));
                finalSet.push(...catQ.slice(0, 2));
            }
            else if (categories.length === 2) {
                categories.forEach(cat => {
                    const catQ = shuffle(levelQuestions.filter(q => q.tech_category === cat));
                    if (catQ.length > 0) finalSet.push(catQ[0]);
                });
            }
            else if (categories.length >= 3) {
                categories.slice(0, 3).forEach(cat => {
                    const catQ = shuffle(levelQuestions.filter(q => q.tech_category === cat));
                    if (catQ.length > 0) finalSet.push(catQ[0]);
                });
            }
        });

        return finalSet;
    };

    const showTechQuestion = (q: TechQuestion, index: number, total: number) => {
        let opts: string[] = [];
        // Deteksi tipe data options (JSONB Array atau String JSON)
        if (Array.isArray(q.options)) {
            opts = q.options;
        } else if (typeof q.options === 'string') {
            try { opts = JSON.parse(q.options); } catch (e) { opts = []; }
        }

        const quizOptions = opts.map(opt => ({
            text: opt,
            category: opt === q.correct_answer ? 'CORRECT' : 'WRONG'
        }));

        setMessages(prev => [...prev, {
            id: `tech-${q.id}-${Date.now()}`,
            role: 'assistant',
            text: `[Soal ${index + 1}/${total} - ${q.difficulty.toUpperCase()} - ${q.tech_category}]\n\n${q.question_text}`,
            isQuiz: true,
            quizOptions: quizOptions
        }]);
    };

    const handleTechAnswer = (optionText: string, status: string) => {
        const isCorrect = status === 'CORRECT';
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'user',
            text: optionText
        }]);

        const currentQ = techQuestions[currentTechIndex];
        setTechResults(prev => [...prev, {
            category: currentQ.tech_category,
            difficulty: currentQ.difficulty,
            isCorrect: isCorrect
        }]);

        const nextIndex = currentTechIndex + 1;
        if (nextIndex < techQuestions.length) {
            setCurrentTechIndex(nextIndex);
            setTimeout(() => showTechQuestion(techQuestions[nextIndex], nextIndex, techQuestions.length), 600);
        } else {
            setTimeout(() => finishTechQuiz(), 800);
        }
    };

    const finishTechQuiz = async () => {
        setMode('chat');

        // 1. Hitung Kategori Dominan
        const catScores: Record<string, number> = {};
        techResults.forEach(r => {
            if (r.isCorrect) {
                catScores[r.category] = (catScores[r.category] || 0) + 1;
            }
        });

        const sortedCats = Object.entries(catScores).sort((a, b) => b[1] - a[1]);
        const dominantCategory = sortedCats.length > 0 ? sortedCats[0][0] : finalInterest;

        // 2. Hitung Level
        const stats = {
            beginner: { total: 0, correct: 0 },
            intermediate: { total: 0, correct: 0 },
            advanced: { total: 0, correct: 0 }
        };

        techResults.forEach(r => {
            const lvl = r.difficulty as keyof typeof stats;
            stats[lvl].total++;
            if (r.isCorrect) stats[lvl].correct++;
        });

        let finalLevel = "Beginner";
        const passBeginner = stats.beginner.total > 0 && stats.beginner.correct === stats.beginner.total;
        const passIntermediate = stats.intermediate.total > 0 && stats.intermediate.correct === stats.intermediate.total;
        const passAdvanced = stats.advanced.total > 0 && stats.advanced.correct === stats.advanced.total;

        if (passBeginner && passIntermediate && passAdvanced) finalLevel = "Advanced";
        else if (passBeginner && passIntermediate) finalLevel = "Intermediate";
        else finalLevel = "Beginner";

        // 3. SIMPAN KE DATABASE
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase.from('profiles').upsert({
                    id: user.id,
                    selected_interest: dominantCategory,
                    competency_level: finalLevel
                });
                if (error) console.error('Gagal simpan profil:', error);
                else {
                    // Dispatch Custom Event agar Navbar update otomatis
                    window.dispatchEvent(new Event('profileUpdated'));
                }
            }
        } catch (err) {
            console.error('Error saving profile:', err);
        }

        const totalCorrect = techResults.filter(r => r.isCorrect).length;
        const totalSoal = techQuestions.length;

        const resultMsg = `
🏁 **Hasil Tes Teknis Selesai!**

📊 Skor: ${totalCorrect} / ${totalSoal} Benar
🏆 Level Kompetensi: **${finalLevel}**
💡 Kategori Dominan: **${dominantCategory}**

Coddy merekomendasikan kamu mengambil learning path: **${dominantCategory} - Level ${finalLevel}**.
`;

        setMessages(prev => [...prev, {
            id: 'final-res',
            role: 'assistant',
            text: resultMsg
        }]);

        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: 'closing',
                role: 'assistant',
                text: 'Data sudah saya simpan. Sekarang kamu bisa tanya apa saja tentang materi belajar atau saran karir!',
            }]);
        }, 1000);
    };

    // ============================================================
    // BAGIAN 3: HANDLER UMUM
    // ============================================================

    const handleManualSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userText = input.trim();
        setInput('');
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
        setIsLoading(true);

        // Reset height textarea manually if needed (TextareaAutosize handles it mostly, but good to be safe)
        
        try {
            const { data, error } = await supabase.functions.invoke('coddy-chat', {
                body: { question: userText }
            });
            if (error) throw error;
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: data.answer || "Maaf, error." }]);
        } catch (err: any) {
            setMessages(prev => [...prev, { id: 'err', role: 'assistant', text: 'Error: ' + err.message }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleManualSend();
        }
    };

    const onOptionClick = (optText: string, category: string) => {
        if (category === 'START_TECH') {
            startTechQuiz();
        } else if (category === 'CANCEL_TECH') {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: optText }]);
            setMessages(prev => [...prev, { id: 'cancel', role: 'assistant', text: 'Oke, tes teknis dibatalkan. Kamu bisa chat biasa sekarang.' }]);
            setMode('chat');
        } else if (mode === 'interest_quiz') {
            handleInterestAnswer(optText, category);
        } else if (mode === 'tech_quiz') {
            handleTechAnswer(optText, category);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] bg-gray-50">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-emerald-100'}`}>
                                {msg.role === 'user' ? <User className="w-5 h-5 text-gray-500" /> : <Bot className="w-5 h-5 text-emerald-600" />}
                            </div>
                            <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-emerald-500 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : ''}`}>
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            // Custom styling for specific elements if needed
                                            p: ({node, ...props}) => <p className="mb-0 text-sm" {...props} />,
                                            pre: ({node, ...props}) => <pre className="bg-gray-800 text-white p-2 rounded-lg my-2 overflow-x-auto" {...props} />,
                                            code: ({node, className, ...props}: any) => {
                                                const match = /language-(\w+)/.exec(className || '')
                                                return match ? (
                                                    <code className={className} {...props} /> 
                                                ) : (
                                                    <code className="bg-black/10 px-1 py-0.5 rounded text-xs" {...props} />
                                                )
                                            }
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>

                        {msg.isQuiz && index === messages.length - 1 && !isLoading && (
                            <div className="mt-3 ml-11 space-y-2 w-full max-w-[80%]">
                                {msg.id === 'welcome' && mode === 'chat' && (
                                    <button onClick={startInterestQuiz} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-full hover:bg-emerald-700 shadow-md font-medium text-sm transition-transform hover:scale-105">
                                        <Play className="w-4 h-4 fill-white" /> {userProfile ? "Test Ulang" : "Mulai Cari Minat"}
                                    </button>
                                )}

                                {msg.quizOptions && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {msg.quizOptions.map((opt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => onOptionClick(opt.text, opt.category || '')}
                                                className="text-left bg-white border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-500 text-gray-700 px-4 py-3 rounded-xl transition-all text-sm shadow-sm active:scale-95"
                                            >
                                                {opt.text}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><Bot className="w-5 h-5 text-emerald-600" /></div>
                        <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" /><span className="text-xs text-gray-400">Coddy sedang berpikir...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="bg-white p-4 border-t border-gray-200">
                <form onSubmit={handleManualSend} className="flex gap-2 relative items-end">
                    <TextareaAutosize
                        ref={textareaRef}
                        minRows={1}
                        maxRows={4}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={mode !== 'chat' ? "Pilih jawaban di atas..." : "Tanya sesuatu... (Shift+Enter untuk baris baru)"}
                        className="flex-1 bg-gray-100 text-gray-800 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all pr-12 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                        disabled={isLoading || mode !== 'chat'}
                    />
                    <button type="submit" disabled={isLoading || !input.trim() || mode !== 'chat'} className="bg-emerald-500 text-white p-2.5 rounded-full hover:bg-emerald-600 disabled:opacity-50 transition-colors mb-1">
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}