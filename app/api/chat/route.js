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

    const lowerMsg = (message || "").toLowerCase().trim();

    // 1. ZARARSIZ SELAMLAŞMALAR
    const greetings = ["selam", "slm", "merhaba", "mrb", "sa", "s.a", "selamün aleyküm", "selamun aleykum", "günaydın", "iyi günler", "kolay gelsin", "naber", "nbr", "hey", "nasılsın"];
    if (greetings.includes(lowerMsg)) {
      return NextResponse.json({
        reply: "Merhaba! True Kinetic Studios projeleri, Roblox Luau kodlama, 3D modelleme veya ses tasarımı hakkında nasıl yardımcı olabilirim?",
        isViolation: false
      });
    }

    // 2. SADECE AĞIR İHLAL KELİMELERİ (KÜFÜR, TEHDİT, CİNSELLİK, KUMAR, LEAK)
    const criticalViolations = [
      "kumar", "bahis", "casino", "slot", "rulet", "blackjack", "bet",
      "amk", "aq", "orospu", "piç", "sik", "yarrak", "sikeyim", "göt", "kahpe", "pezevenk",
      "ananı", "bacını", "tehdit", "öldür", "patlat", "hackle", "ddos", "rat", "trojan",
      "porno", "sex", "sikiş", "meme", "amcık", "sürtük", "ibne", "gavat", "leak", "sızdır", "crack"
    ];

    const hasCriticalViolation = criticalViolations.some((w) => {
      const regex = new RegExp(`\\b${w}\\b`, "i");
      return regex.test(lowerMsg) || (w.length > 3 && lowerMsg.includes(w));
    });

    if (hasCriticalViolation) {
      return NextResponse.json({
        reply: "⚠️ Bu mesaj stüdyo kurallarını (ağır hakaret, tehdit, kumar veya uygunsuz içerik) ihlal ettiği için engellenmiş ve stüdyo yönetimine raporlanmıştır.",
        isViolation: true
      });
    }

    // 3. GEMINI API ENTEGRASYONU
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `Sen "True Kinetic Studios" ekibinin dahili geliştirici yapay zekasısın.
KURALLAR:
1. Ekip üyelerine Roblox Luau scriptleri, Blender 3D modelleme, SFX ses tasarımı ve stüdyo işlerinde profesyonel, eksiksiz kod bloklarıyla ve Türkçe yardım et.
2. Kod yazarken kod bloklarını KESİNLİKLE yarım bırakma, pcall, datastore veya fonksiyonların tamamını eksiksiz yaz.
3. Düşünce adımlarını veya taslak notlarını çıktıya ekleme, doğrudan çalışan temiz kodu ve ardından kısa özet açıklamayı ver.
4. SADECE ağır hakaret, tehdit, cinsel içerik veya yasadışı talepler geldiğinde yanıtının başına "[CRITICAL_VIOLATION]" yaz ve reddet.`;

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
          maxOutputTokens: 4096, // Kodların yarım kalmaması için 4096 yaptık
          temperature: 0.5
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
          reply: "⚠️ Bu mesaj güvenlik filtreleri tarafından engellenmiş ve stüdyo yönetimine bildirilmiştir.",
          isViolation: true
        });
      }

      return NextResponse.json({ error: data.error?.message || "Yapay zeka yanıt veremedi." }, { status: response.status });
    }

    const candidate = data.candidates?.[0];
    const isGoogleSafetyBlock = candidate?.finishReason === "SAFETY";
    const rawReply = candidate?.content?.parts?.[0]?.text || "";
    const isCriticalViolation = rawReply.includes("[CRITICAL_VIOLATION]");

    const isViolation = isGoogleSafetyBlock || isCriticalViolation;
    let cleanReply = rawReply.replace("[CRITICAL_VIOLATION]", "").trim();

    if (isViolation && !cleanReply) {
      cleanReply = "⚠️ Bu mesaj kural ihlali sebebiyle engellendi ve yönetime raporlandı.";
    }

    return NextResponse.json({
      reply: cleanReply || "Yanıt alınamadı.",
      isViolation: isViolation
    });
  } catch (error) {
    console.error("Chat route hatası:", error);
    return NextResponse.json(
      { error: "Sunucu tarafında beklenmeyen bir hata oluştu." },
      { status: 500 }
    );
  }
}