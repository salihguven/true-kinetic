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

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    // SIKI KORUMA VE KOTA TASARRUFU TALİMATI
    const systemInstruction = `Sen SADECE "True Kinetic Studios" ekibinin dahili oyun geliştirme asistanısın.
KESİN KURALLAR:
1. YALNIZCA Roblox Luau scriptleri, Blender 3D modelleme, oyun içi ses/müzik ve stüdyo proje süreçleriyle ilgili sorulara yanıt ver.
2. Konu dışı (genel donanım tavsiyeleri, günlük sohbet, felsefe, ödev, magazin, oyun geliştirme dışı her şey) sorular sorulduğunda KESİNLİKLE detaylı cevap verme! Sadece şu cümleyi söyle: "Ben yalnızca True Kinetic Studios oyun geliştirme ve stüdyo projeleri konularında destek veren bir asistanım. Lütfen geliştirme veya stüdyo işleriyle ilgili bir soru sorunuz."
3. Cevaplarını her zaman kısa, öz ve doğrudan amaca yönelik tut. Gereksiz uzun açıklamalardan kaçın.`;

    const contents = [];

    // Geçmiş konuşmalar (Son 4 mesajla sınırlandırdık, kota tasarrufu için)
    if (history && Array.isArray(history)) {
      history.slice(-4).forEach((h) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }

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
          maxOutputTokens: 800, // Kotayı korumak için token limitini düşürdük
          temperature: 0.3 // Sapmaları önlemek için daha katı yaptık
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