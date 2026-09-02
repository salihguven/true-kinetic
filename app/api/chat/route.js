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

    const systemInstruction = `Sen True Kinetic Studios ekibinin dahili AI asistanısın.
KRİTİK GÜVENLİK KURALI:
Eğer kullanıcı mesajında:
- Hakaret, küfür, aşağılama,
- Tehdit, şiddet, yasadışı eylemler/yazılımlar,
- Cinsel, müstehcen, taciz veya ahlak dışı ifadeler içeriyorsa;
KESİNLİKLE CEVAP VERME! Yanıtının EN BAŞINA tam olarak "[SECURITY_ALERT]" yaz ve ardından tek bir cümleyle stüdyo kurallarını ihlal ettiğini, bu eylemin yönetime raporlandığını belirt.

Normal oyun geliştirme (Luau script, 3D modelleme, ses tasarımı, oyun kurgusu) sorularına ise profesyonel ve Türkçe yanıt ver.`;

    const contents = [];

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
      parts: [{ text: `${systemInstruction}\n\nKullanıcı Mesajı: ${message}` }]
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.2
        }
      })
    });

    const data = await response.json();

    // HATA VE KOTA AŞIMI KONTROLÜ
    if (!response.ok) {
      // Eğer ücretsiz kota / dakikalık istek sınırı (Rate Limit 429) aşıldıysa:
      if (
        response.status === 429 ||
        data.error?.message?.toLowerCase().includes("quota") ||
        data.error?.status === "RESOURCE_EXHAUSTED"
      ) {
        return NextResponse.json(
          { error: "⏳ Stüdyo AI Asistanı kısa süreli istek sınırına ulaştı (Rate Limit). Lütfen yaklaşık 20-30 saniye sonra tekrar deneyiniz." },
          { status: 429 }
        );
      }

      const errorDetail = data.error?.message || "Yapay zeka servisi şu anda yanıt veremiyor.";
      return NextResponse.json({ error: errorDetail }, { status: response.status });
    }

    const rawReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Yanıt alınamadı.";
    const isSecurityAlert = rawReply.includes("[SECURITY_ALERT]");
    const cleanReply = rawReply.replace("[SECURITY_ALERT]", "").trim();

    return NextResponse.json({
      reply: cleanReply,
      isViolation: isSecurityAlert
    });
  } catch (error) {
    console.error("Chat route hatası:", error);
    return NextResponse.json(
      { error: "Sunucu tarafında beklenmeyen bir hata oluştu. Lütfen tekrar deneyiniz." },
      { status: 500 }
    );
  }
}