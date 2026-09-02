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

    // 1. KATMAN: YEREL KELİME VE İHLAL PATTERN KONTROLÜ (Hızlı Yakalayıcı)
    const lowerMsg = (message || "").toLowerCase();
    const badPatterns = [
      "amk", "aq", "orospu", "piç", "sik", "yarrak", "sikeyim", "göt", "kahpe", "pezevenk",
      "ananı", "bacını", "tehdit", "öldür", "patlat", "hackle", "ddos", "porno", "sex", "sikiş",
      "meme", "amcık", "sürtük", "ibne", "gavat", "leak", "sızdır", "crack"
    ];

    const hasLocalViolation = badPatterns.some((w) => lowerMsg.includes(w));

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const systemInstruction = `Sen True Kinetic Studios ekibinin dahili AI asistanısın.
KRİTİK GÜVENLİK KURALI:
Eğer kullanıcı mesajında hakaret, küfür, tehdit, şiddet, yasadışı içerik veya cinsel ifadeler varsa;
KESİNLİKLE YANIT VERME! Yanıtının EN BAŞINA tam olarak "[SECURITY_ALERT]" yaz ve "Bu mesaj stüdyo kurallarını ihlal ettiği için yönetime raporlandı." de.`;

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

    if (!response.ok) {
      if (
        response.status === 429 ||
        data.error?.message?.toLowerCase().includes("quota") ||
        data.error?.status === "RESOURCE_EXHAUSTED"
      ) {
        return NextResponse.json(
          { error: "⏳ Stüdyo AI Asistanı kısa süreli istek sınırına ulaştı. Lütfen 20-30 saniye sonra tekrar deneyiniz." },
          { status: 429 }
        );
      }

      // Eğer Google API seviyesinde Safety Block yediyse:
      if (data.error?.message?.toLowerCase().includes("safety")) {
        return NextResponse.json({
          reply: "⚠️ Bu mesaj güvenlik ve stüdyo kurallarını ihlal ettiği için engellenmiş ve yönetici masasına raporlanmıştır.",
          isViolation: true
        });
      }

      const errorDetail = data.error?.message || "Yapay zeka servisi şu anda yanıt veremiyor.";
      return NextResponse.json({ error: errorDetail }, { status: response.status });
    }

    // Google API'nin Safety Kontrolü
    const candidate = data.candidates?.[0];
    const isGoogleSafetyBlock = candidate?.finishReason === "SAFETY" || data.promptFeedback?.blockReason === "SAFETY";

    const rawReply = candidate?.content?.parts?.[0]?.text || "";
    const isPromptAlert = rawReply.includes("[SECURITY_ALERT]");

    // 3 Koşuldan biri bile doğruysa İHLAL SAYILIR:
    const isViolation = hasLocalViolation || isGoogleSafetyBlock || isPromptAlert;

    let cleanReply = rawReply.replace("[SECURITY_ALERT]", "").trim();

    if (isViolation && (!cleanReply || isGoogleSafetyBlock || hasLocalViolation)) {
      cleanReply = "⚠️ Bu mesaj stüdyo kurallarına (küfür, tehdit, uygunsuzluk vb.) aykırı olduğu için engellenmiş ve stüdyo yönetimine bildirilmiştir.";
    }

    return NextResponse.json({
      reply: cleanReply || "Yanıt oluşturulamadı.",
      isViolation: isViolation
    });
  } catch (error) {
    console.error("Chat route hatası:", error);
    return NextResponse.json(
      { error: "Sunucu tarafında beklenmeyen bir hata oluştu. Lütfen tekrar deneyiniz." },
      { status: 500 }
    );
  }
}