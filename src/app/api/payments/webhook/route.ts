import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(req: Request) {
  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: "Не настроены STRIPE_SECRET_KEY или STRIPE_WEBHOOK_SECRET" },
        { status: 500 }
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Отсутствует заголовок Stripe-Signature" }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.metadata?.email || session.customer_details?.email || "";
      const grantedCredits = Number(session.metadata?.credits || 999);

      // TODO: Здесь обновляем тариф 'pro' и лимит grantedCredits в базе данных (Supabase)
      // по customerEmail / user_id. Никогда не выдаём лимиты просто по заходу на success_url.
      void customerEmail;
      void grantedCredits;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка проверки подписи вебхука";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}