import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Не найден GROQ_API_KEY в переменных окружения" },
        { status: 500 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Не настроены NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY" },
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

    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Не передан email пользователя. Войдите в аккаунт заново." },
        { status: 401 }
      );
    }

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Передайте текст отзыва или список отзывов для обработки." },
        { status: 400 }
      );
    }

    // 1. Получаем или создаём профиль пользователя в Supabase
    let { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("email, plan, credits")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: `Ошибка чтения профиля из Supabase: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!profile) {
      const { data: created, error: insertError } = await supabaseAdmin
        .from("profiles")
        .insert({
          email: normalizedEmail,
          plan: "free",
          credits: 10,
        })
        .select("email, plan, credits")
        .single();

      if (insertError || !created) {
        return NextResponse.json(
          { error: `Не удалось создать профиль в Supabase: ${insertError?.message}` },
          { status: 500 }
        );
      }
      profile = created;
    }

    // 2. Проверяем остаток кредитов на сервере
    if (profile.credits <= 0) {
      return NextResponse.json(
        {
          error: "Бесплатные запросы закончились. Перейдите на тариф PRO.",
          code: "NO_CREDITS",
          credits: 0,
          plan: profile.plan,
        },
        { status: 403 }
      );
    }

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

    // 3. Списываем 1 кредит в Supabase после успешной генерации
    const nextCredits = Math.max(0, profile.credits - 1);
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        credits: nextCredits,
        updated_at: new Date().toISOString(),
      })
      .eq("email", normalizedEmail);

    if (updateError) {
      return NextResponse.json(
        { error: `Ошибка обновления кредитов: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result,
      credits: nextCredits,
      plan: profile.plan,
    });
  } catch {
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера при генерации." },
      { status: 500 }
    );
  }
}