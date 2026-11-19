import { NextResponse } from "next/server";

const FREE_PLAN_CREDITS = 10;
const PRO_PLAN_CREDITS = 999;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Не найден GROQ_API_KEY в переменных окружения" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { type, text, tone, keywords, email } = body as {
      type?: "reply" | "analysis";
      text?: string;
      tone?: "friendly" | "formal" | "apology";
      keywords?: string;
      email?: string;
    };

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Передайте текст отзыва или список отзывов для обработки." },
        { status: 400 }
      );
    }

    // TODO: Подключить реальную проверку баланса и тарифа пользователя из Supabase по user_id / email.
    // Важно: не доверять credits с клиента на продакшне — списывать лимит нужно на сервере.
    void email;
    void FREE_PLAN_CREDITS;
    void PRO_PLAN_CREDITS;

    const toneInstruction =
      tone === "friendly"
        ? "Тон: теплый, дружелюбный, с легкой заботой о клиенте."
        : tone === "formal"
        ? "Тон: вежливый, деловой и официальный."
        : "Тон: максимально эмпатичный, извиняющийся, направленный на сглаживание конфликта и возврат доверия покупателя.";

    const systemPrompt =
      type === "reply"
        ? `Ты — опытный менеджер по работе с клиентами и SEO-специалист маркетплейсов (Wildberries, Ozon, Amazon). Напиши грамотный, живой и естественный ответ продавца на отзыв покупателя на русском языке. ${toneInstruction} Органично вплети в текст ключевые слова: "${keywords || ""}". Отвечай без воды, только сам текст ответа.`
        : `Ты — старший бизнес-аналитик маркетплейсов и e-commerce. Проанализируй переданный список отзывов покупателей (своих или конкурента) на русском языке. Выдай четкий, структурированный отчет с эмодзи:
1. ✅ Главные плюсы (за что хвалят).
2. ⚠️ Главные боли и причины негатива/возвратов.
3. 🚀 3 конкретных шага, как улучшить товар, карточку или сервис, чтобы обойти конкурентов и поднять продажи.
Учитывай контекст ключевых слов: "${keywords || ""}".`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
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
  } catch {
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при генерации." },
      { status: 500 }
    );
  }
}