import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

export async function GET(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase не настроен на сервере" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Не передан email" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("email, plan, credits")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      plan: data?.plan || "free",
      credits: typeof data?.credits === "number" ? data.credits : 10,
    });
  } catch {
    return NextResponse.json({ error: "Ошибка получения профиля" }, { status: 500 });
  }
}