// supabase/functions/coddy-chat/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? ''

// CORS headers
const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GEMINI_MODEL_ID = 'gemini-robotics-er-1.5-preview'

interface ChatRequestBody {
    question?: string,
}

console.log('[coddy-chat] edge function loaded')

// Helper untuk response JSON + CORS
function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
        },
    })
}

Deno.serve(async (req: Request) => {
    const startTime = Date.now()
    const url = new URL(req.url)

    // 1) Handle preflight CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2) Hanya izinkan POST
        if (req.method !== 'POST') {
            return jsonResponse({ error: 'Method not allowed' }, 405)
        }

        // 3) Parse body
        let body: ChatRequestBody
        try {
            body = await req.json()
        } catch (err) {
            return jsonResponse({ error: 'Invalid JSON body' }, 400)
        }

        const question = body.question?.trim()
        if (!question) {
            return jsonResponse({ error: 'Question is required' }, 400)
        }

        // 4) Setup Supabase client
        const authHeader = req.headers.get('Authorization') ?? ''
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: { Authorization: authHeader },
            },
        })

        // 5) Pastikan user login
        const token = authHeader.replace('Bearer ', '')
        const { data: userData, error: userError } = await supabase.auth.getUser(token)

        if (userError || !userData?.user) {
            return jsonResponse({ error: 'Unauthorized' }, 401)
        }

        // 6) Ambil ringkasan learning path + progress user (RPC)
        const { data: lpProgress, error: lpError } = await supabase.rpc('get_learning_paths_with_progress')
        if (lpError) {
            console.error('RPC Error:', lpError)
            // Lanjut saja meski error, agar chat tidak mati total (opsional)
        }

        // 7) Ambil metadata learning path
        const { data: learningPaths } = await supabase.from('learning_paths').select('*')

        // 8) Ambil daftar course
        const { data: courses } = await supabase.from('courses').select('*')

        // 9) Ambil daftar level
        const { data: courseLevels } = await supabase.from('course_levels').select('*')

        // 10) Ambil user profile (interest & competency)
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('selected_interest, competency_level')
            .eq('id', userData.user.id)
            .single()

        // Helper untuk memotong data agar prompt tidak kepanjangan
        const safeJson = (data: any) => JSON.stringify(data ?? []).slice(0, 5000)

        // 11) Susun prompt untuk Gemini
        const systemInstruction = `
Kamu adalah **Coddy**, asisten belajar pribadi untuk platform Dicoding.
Gaya bicara: Santai, gaul (bisa lu/gua jika user mulai duluan), tapi tetap sopan, suportif, dan memotivasi.
Tugas: Membantu user merencanakan roadmap belajar dan menjawab pertanyaan teknis coding.

Data Konteks User (JSON):
1. User Profile: Interest=${userProfile?.selected_interest ?? 'Belum Ada'}, Level=${userProfile?.competency_level ?? 'Belum Ada'}
2. Progress User: ${safeJson(lpProgress)}
3. Daftar Learning Path: ${safeJson(learningPaths)}
4. Daftar Kursus: ${safeJson(courses)}
5. Level Kursus: ${safeJson(courseLevels)}

INSTRUKSI KHUSUS:
- Jawablah pertanyaan user berdasarkan data di atas.
- Jika user bertanya "Progress saya gimana?", baca data Progress User.
- Jika user bingung mau belajar apa, pandu mereka memilih Learning Path yang sesuai minat.
- Jangan mengarang data kursus yang tidak ada di daftar.
- Jika user curhat di luar topik belajar, tanggapi singkat dan sopan lalu arahkan kembali ke belajar.
`

        // 12) Cek API key Gemini
        if (!geminiApiKey) {
            return jsonResponse({ error: 'Gemini API key is not configured' }, 500)
        }

        // 13) Panggil Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_ID}:generateContent`

        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': geminiApiKey,
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: [{ role: 'user', parts: [{ text: question }] }],
            }),
        })

        const geminiJson = await geminiResponse.json()

        if (!geminiResponse.ok) {
            console.error('Gemini API Error:', geminiJson)
            return jsonResponse({ error: 'Gemini API error', details: geminiJson }, 502)
        }

        const answer = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, saya sedang pusing. Coba tanya lagi nanti.'

        return jsonResponse({ answer }, 200)

    } catch (err) {
        console.error('Unhandled Error:', err)
        return jsonResponse({ error: 'Internal server error' }, 500)
    }
})