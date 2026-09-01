// app/api/chat/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { message, history } = body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY tanımlanmamış. .env.local dosyanızı kontrol edin." },
        { status: 500 }
      );
    }

    // Google Gemini 3.6 Flash Endpoint
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const systemInstruction = "Sen True Kinetic Studios oyun ve teknoloji stüdyosunun resmi AI Asistanısın. Ekip üyelerine Roblox Luau scriptleri, Blender 3D modelleme, ses tasarımı ve oyun geliştirme konularında profesyonel, temiz kod örnekli ve Türkçe yardım et.";

    const contents = [];

    // Geçmiş konuşmalar
    if (history && Array.isArray(history)) {
      history.forEach((h) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }

    // Kullanıcının yeni sorusu
    contents.push({
      role: "user",
      parts: [{ text: `${systemInstruction}\n\nSoru: ${message}` }]
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorDetail = data.error?.message || "Gemini API isteği reddetti.";
      return NextResponse.json({ error: errorDetail }, { status: response.status });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Yanıt alınamadı.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat route hatası:", error);
    return NextResponse.json(
      { error: error.message || "Sunucu tarafında beklenmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}