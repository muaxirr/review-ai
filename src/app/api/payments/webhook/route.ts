import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(req: Request) {
  try {
    if (!stripe || !webhookSecret) {
      return NextResponse.json(
        { error: "Не настроены STRIPE_SECRET_KEY или STRIPE_WEBHOOK_SECRET" },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Не настроены переменные Supabase на сервере" },
        { status: 500 }
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Отсутствует заголовок Stripe-Signature" },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail =
        session.metadata?.email || session.customer_details?.email || session.customer_email || "";
      const grantedCredits = Number(session.metadata?.credits || 999);

      if (customerEmail) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id, credits")
          .eq("email", customerEmail)
          .maybeSingle();

        const currentCredits = Number(existingProfile?.credits ?? 0);
        const nextCredits = currentCredits + grantedCredits;

        if (existingProfile) {
          const { error } = await supabase
            .from("profiles")
            .update({
              plan: "pro",
              credits: nextCredits,
            })
            .eq("id", existingProfile.id);

          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка обработки вебхука";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}