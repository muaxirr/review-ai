import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Не найден GROQ_API_KEY в файле .env.local" },
        { status: 500 }
      );
    }

    const { type, text, tone, keywords } = await req.json();

    const toneInstruction =
      tone === "friendly"
        ? "Тон: теплый, дружелюбный, с легкой заботой о клиенте."
        : tone === "formal"
        ? "Тон: вежливый, деловой и официальный."
        : "Тон: максимально эмпатичный, извиняющийся, направленный на сглаживание конфликта и возврат доверия покупателя.";

    const systemPrompt =
      type === "reply"
        ? `Ты — опытный менеджер по работе с клиентами и SEO-специалист маркетплейсов (Wildberries, Ozon, Amazon). Напиши грамотный, живой и естественный ответ продавца на отзыв покупателя на русском языке. ${toneInstruction} Органично вплети в текст ключевые слова: "${keywords}". Отвечай без воды, только сам текст ответа.`
        : `Ты — старший бизнес-аналитик маркетплейсов и e-commerce. Проанализируй переданный список отзывов покупателей (своих или конкурента) на русском языке. Выдай четкий, структурированный отчет с эмодзи:
1. ✅ Главные плюсы (за что хвалят).
2. ⚠️ Главные боли и причины негатива/возвратов.
3. 🚀 3 конкретных шага, как улучшить товар, карточку или сервис, чтобы обойти конкурентов и поднять продажи.
Учитывай контекст ключевых слов: "${keywords}".`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Ошибка при обращении к Groq API" },
        { status: response.status }
      );
    }

    const result = data.choices?.[0]?.message?.content || "Не удалось получить ответ от ИИ.";
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при генерации." },
      { status: 500 }
    );
  }
}