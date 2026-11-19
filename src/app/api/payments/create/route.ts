import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const PRICES_BY_CURRENCY: Record<string, { unitAmount: number; currency: string }> = {
  usd: { unitAmount: 1900, currency: "usd" }, // $19.00
  rub: { unitAmount: 179000, currency: "rub" }, // 1790.00 RUB
  byn: { unitAmount: 6500, currency: "byn" }, // 65.00 BYN
};

function getAppUrl(req: Request): string {
  const origin = req.headers.get("origin");
  if (origin && origin.startsWith("http")) {
    return origin.replace(/\/$/, "");
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  }
  return "https://review-ai.site";
}

export async function POST(req: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Не настроен STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    let body: { currency?: string; email?: string; userId?: string; credits?: number } = {};
    try {
      const raw = await req.text();
      if (raw) {
        body = JSON.parse(raw);
      }
    } catch {
      body = {};
    }

    const currencyKey = String(body.currency || "usd").toLowerCase();
    const priceConfig = PRICES_BY_CURRENCY[currencyKey] || PRICES_BY_CURRENCY.usd;
    const appUrl = getAppUrl(req);
    const credits = Number(body.credits) > 0 ? Number(body.credits) : 999;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      ...(body.email ? { customer_email: body.email } : {}),
      line_items: [
        {
          price_data: {
            currency: priceConfig.currency,
            unit_amount: priceConfig.unitAmount,
            product_data: {
              name: "ReviewAI PRO",
              description: "Тариф PRO и начисление кредитов ReviewAI",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan: "pro",
        credits: String(credits),
        ...(body.email ? { email: body.email } : {}),
        ...(body.userId ? { userId: body.userId } : {}),
      },
      success_url: `${appUrl}/?payment=success`,
      cancel_url: `${appUrl}/?payment=cancel`,
    });

    return NextResponse.json({ url: session.url, id: session.id }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка создания сессии оплаты";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}