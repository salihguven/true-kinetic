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

    // 1. KATMAN: YASADIŞI, KUMAR, KÜFÜR VE İHLAL FİLTRESİ
    const lowerMsg = (message || "").toLowerCase();
    const illegalAndBadWords = [
      "kumar", "bahis", "casino", "slot", "rulet", "blackjack", "bet", "kaçak",
      "amk", "aq", "orospu", "piç", "sik", "yarrak", "sikeyim", "göt", "kahpe", "pezevenk",
      "ananı", "bacını", "tehdit", "öldür", "patlat", "hackle", "ddos", "rat", "trojan",
      "porno", "sex", "sikiş", "meme", "amcık", "sürtük", "ibne", "gavat", "leak", "sızdır", "crack"
    ];

    const hasDirectViolation = illegalAndBadWords.some((w) => lowerMsg.includes(w));

    // Eğer doğrudan kumar/küfür/yasadışı içerik varsa Gemini'ye gitmeden ANINDA İHLAL SAY VE ENGELLE:
    if (hasDirectViolation) {
      return NextResponse.json({
        reply: "⚠️ Bu mesaj stüdyo kurallarına (yasadışı içerik, kumar, hakaret veya uygunsuzluk) aykırıdır. Mesajınız engellendi ve stüdyo yönetimine raporlandı.",
        isViolation: true
      });
    }

    // 2. KATMAN: GOOGLE GEMINI RESMİ ENDPOINT VE SYSTEM INSTRUCTION
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `Sen SADECE "True Kinetic Studios" oyun ve teknoloji geliştirme ekibinin dahili asistanısın.
KESİN TALİMATLAR:
1. YALNIZCA Roblox Luau scriptleri, Blender 3D modelleme, oyun tasarımı, ses/SFX ve stüdyo projelerine yanıt ver.
2. Kumar, bahis, yasadışı yazılımlar, genel donanım tavsiyeleri, günlük muhabbet, küfür, hakaret ve konu dışı HER ŞEYİ KESİNLİKLE REDDET!
3. Eğer konu dışı veya kural dışı bir şey sorulursa YALNIZCA şunu söyle: "[SECURITY_ALERT] Bu talep stüdyo kurallarına aykırıdır ve geliştirme süreçlerimizle ilgili değildir."`;

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
      parts: [{ text: message }]
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: contents,
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.1
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

      if (data.error?.message?.toLowerCase().includes("safety")) {
        return NextResponse.json({
          reply: "⚠️ Bu mesaj güvenlik kurallarını ihlal ettiği için engellenmiş ve stüdyo yönetimine raporlanmıştır.",
          isViolation: true
        });
      }

      const errorDetail = data.error?.message || "Yapay zeka servisi şu anda yanıt veremiyor.";
      return NextResponse.json({ error: errorDetail }, { status: response.status });
    }

    const candidate = data.candidates?.[0];
    const isGoogleSafetyBlock = candidate?.finishReason === "SAFETY" || data.promptFeedback?.blockReason === "SAFETY";

    const rawReply = candidate?.content?.parts?.[0]?.text || "";
    const isPromptAlert = rawReply.includes("[SECURITY_ALERT]");

    const isViolation = isGoogleSafetyBlock || isPromptAlert;
    let cleanReply = rawReply.replace("[SECURITY_ALERT]", "").trim();

    if (isViolation && !cleanReply) {
      cleanReply = "⚠️ Bu talep stüdyo kurallarına (yasadışı/uygunsuz/konu dışı) aykırı olduğu için engellenmiş ve yönetime bildirilmiştir.";
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