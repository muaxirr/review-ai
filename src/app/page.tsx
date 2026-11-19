"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  MessageSquare,
  BarChart3,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  TrendingUp,
  Smartphone,
  ArrowRight,
  Crown,
  History,
  Trash2,
  LogOut,
  X,
  User,
} from "lucide-react";

type HistoryItem = {
  id: string;
  type: "reply" | "analysis";
  input: string;
  output: string;
  date: string;
};

type UserAccount = {
  email: string;
  plan: "free" | "pro";
};

export default function ReviewAIApp() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<"reply" | "analysis" | "history">("reply");
  const [tone, setTone] = useState<"friendly" | "formal" | "apology">("friendly");
  const [keywords, setKeywords] = useState("быстрая доставка, гарантия качества");
  const [inputText, setInputText] = useState(
    "Заказала куртку, ткань приятная, но молния немного заедает и доставка задержалась на 2 дня. В целом за свои деньги неплохо."
  );
  const [outputText, setOutputText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [credits, setCredits] = useState(10);
  const [showPaywall, setShowPaywall] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Восстановление сессии и данных из памяти браузера
  useEffect(() => {
    const savedUser = localStorage.getItem("reviewai_user");
    const savedCredits = localStorage.getItem("reviewai_credits");
    const savedHistory = localStorage.getItem("reviewai_history");
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedCredits) setCredits(Number(savedCredits));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthError("");
    setShowAuthModal(true);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes("@") || passwordInput.length < 4) {
      setAuthError("Введите корректный Email и пароль (от 4 символов)");
      return;
    }
    const newUser: UserAccount = { email: emailInput.trim(), plan: "free" };
    setUser(newUser);
    localStorage.setItem("reviewai_user", JSON.stringify(newUser));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("reviewai_user");
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    if (credits <= 0) {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);
    setErrorText("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab === "analysis" ? "analysis" : "reply",
          text: inputText,
          tone,
          keywords,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorText(data.error || "Ошибка генерации. Проверьте API-ключ.");
        setIsLoading(false);
        return;
      }

      setOutputText(data.result);

      const nextCredits = credits - 1;
      setCredits(nextCredits);
      localStorage.setItem("reviewai_credits", String(nextCredits));

      const newHistory: HistoryItem[] = [
        {
          id: Date.now().toString(),
          type: activeTab === "analysis" ? "analysis" : "reply",
          input: inputText.slice(0, 90) + (inputText.length > 90 ? "..." : ""),
          output: data.result,
          date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...history,
      ];
      setHistory(newHistory);
      localStorage.setItem("reviewai_history", JSON.stringify(newHistory));
    } catch {
      setErrorText("Не удалось связаться с сервером. Убедитесь, что npm run dev запущен.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ================= ЭКРАН 1: ПРОДАЮЩИЙ ЛЕНДИНГ (ЕСЛИ НЕ АВТОРИЗОВАН) =================
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
              <Sparkles className="w-6 h-6" />
              <span>ReviewAI</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openAuth("login")}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 cursor-pointer"
              >
                Войти
              </button>
              <button
                onClick={() => openAuth("register")}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                Открыть сервис <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <section className="max-w-5xl mx-auto px-4 pt-14 pb-20 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6 border border-blue-100">
              <Zap className="w-3.5 h-3.5" /> Для продавцов маркетплейсов и локального бизнеса
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              Отвечайте на 100 отзывов за минуту и находите{" "}
              <span className="text-blue-600">точки роста продаж</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
              ИИ анализирует отзывы ваших клиентов и конкурентов, поднимает рейтинг карточки в поиске
              и пишет идеальные ответы, которые возвращают покупателей.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => openAuth("register")}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                Попробовать бесплатно (10 запросов) <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Работает на компьютере и устанавливается на телефон как приложение
            </p>
          </section>

          <section className="max-w-6xl mx-auto px-4 pb-20 grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">SEO-ответы за 3 секунды</h3>
              <p className="text-slate-600 text-sm">
                Нейросеть сама вшивает нужные ключевые слова в ответ и мягко гасит любой негатив
                покупателей.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Разбор конкурентов</h3>
              <p className="text-slate-600 text-sm">
                Вставьте отзывы конкурента — ИИ покажет, за что его ругают и как вам забрать его
                клиентов.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Всегда под рукой</h3>
              <p className="text-slate-600 text-sm">
                Удобный веб-кабинет и мобильная версия — отвечайте клиентам прямо со смартфона в
                любом месте.
              </p>
            </div>
          </section>

          <section className="max-w-4xl mx-auto px-4 pb-24">
            <h2 className="text-3xl font-bold text-center mb-10">Простые тарифы</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-2xl border border-slate-200">
                <div className="text-sm font-semibold text-slate-500 mb-1">СТАРТ</div>
                <div className="text-3xl font-extrabold mb-4">$0</div>
                <ul className="space-y-3 text-sm text-slate-600 mb-6">
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" /> 10 бесплатных генераций
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" /> Генератор ответов и аналитика
                  </li>
                </ul>
                <button
                  onClick={() => openAuth("register")}
                  className="w-full py-3 rounded-xl border border-slate-300 font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Начать бесплатно
                </button>
              </div>

              <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="inline-block bg-blue-600 text-xs font-bold px-3 py-1 rounded-full mb-2">
                  ВЫБОР ПРОДАВЦОВ
                </div>
                <div className="text-3xl font-extrabold mb-4">
                  $19 <span className="text-sm font-normal text-slate-400">/ мес</span>
                </div>
                <ul className="space-y-3 text-sm text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" /> Безлимитные ответы на отзывы
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" /> Глубокий анализ конкурентов
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" /> Сохранение всей истории работы
                  </li>
                </ul>
                <button
                  onClick={() => openAuth("register")}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold transition cursor-pointer"
                >
                  Подключить PRO
                </button>
              </div>
            </div>
          </section>
        </main>

        {/* Модальное окно Входа / Регистрации */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 font-bold text-xl text-blue-600 mb-2">
                <Sparkles className="w-6 h-6" />
                <span>ReviewAI</span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-1">
                {authMode === "register" ? "Создать аккаунт" : "Вход в кабинет"}
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                {authMode === "register"
                  ? "Получите 10 бесплатных запросов сразу после регистрации"
                  : "С возвращением! Введите данные для входа"}
              </p>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="seller@shop.ru"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Пароль
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                {authError && <p className="text-xs text-red-600 font-medium">{authError}</p>}

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-sm"
                >
                  {authMode === "register" ? "Зарегистрироваться бесплатно" : "Войти"}
                </button>
              </form>

              <div className="mt-5 text-center text-xs text-slate-500">
                {authMode === "register" ? (
                  <>
                    Уже есть аккаунт?{" "}
                    <button
                      onClick={() => setAuthMode("login")}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Войти
                    </button>
                  </>
                ) : (
                  <>
                    Нет аккаунта?{" "}
                    <button
                      onClick={() => setAuthMode("register")}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Зарегистрироваться
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= ЭКРАН 2: РАБОЧИЙ ЛИЧНЫЙ КАБИНЕТ =================
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-20 sm:pb-0">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-blue-600">
            <Sparkles className="w-5 h-5" />
            <span>ReviewAI</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
              <User className="w-3.5 h-3.5" />
              <span>{user.email}</span>
            </div>
            <div className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700">
              Осталось: <span className="text-blue-600">{credits}</span>
            </div>
            <button
              onClick={() => setShowPaywall(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
            >
              <Crown className="w-4 h-4" /> PRO
            </button>
            <button
              onClick={handleLogout}
              title="Выйти из аккаунта"
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl w-full mx-auto px-4 py-6 flex-1">
        <div className="hidden sm:flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-slate-200 w-fit">
          <button
            onClick={() => setActiveTab("reply")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${
              activeTab === "reply"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Генератор ответов
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${
              activeTab === "analysis"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Аналитика отзывов
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition ${
              activeTab === "history"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <History className="w-4 h-4" /> История ({history.length})
          </button>
        </div>

        {activeTab === "history" ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">История ваших генераций</h2>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    setHistory([]);
                    localStorage.removeItem("reviewai_history");
                  }}
                  className="text-xs text-red-500 flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Очистить
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-slate-500 text-sm py-8 text-center">
                Здесь будут сохраняться все ваши ответы и отчеты. Сделайте первый запрос!
              </p>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span className="font-semibold text-blue-600 uppercase">
                        {item.type === "reply" ? "Ответ на отзыв" : "Аналитика"}
                      </span>
                      <span>{item.date}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">Запрос: {item.input}</p>
                    <p className="text-sm text-slate-800 whitespace-pre-line">{item.output}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="font-bold text-lg">
                {activeTab === "reply"
                  ? "1. Вставьте отзыв покупателя"
                  : "1. Вставьте список отзывов (своих или конкурента)"}
              </h2>

              {activeTab === "reply" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                      Тональность ответа
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "friendly", label: "Дружелюбный" },
                        { id: "formal", label: "Официальный" },
                        { id: "apology", label: "Сгладить негатив" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTone(t.id as typeof tone)}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                            tone === t.id
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                      Ключевые слова для SEO (через запятую)
                    </label>
                    <input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                      placeholder="Например: зимняя куртка, быстрая доставка"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  Текст отзывов
                </label>
                <textarea
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600"
                  placeholder="Вставьте сюда один или несколько отзывов..."
                />
              </div>

              {errorText && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                  {errorText}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles className="w-5 h-5" />
                {isLoading
                  ? "ИИ пишет ответ..."
                  : activeTab === "reply"
                  ? "Сгенерировать идеальный ответ"
                  : "Сделать разбор и точки роста"}
              </button>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">2. Готовый результат</h2>
                {outputText && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" /> Скопировано
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Копировать
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm text-slate-800 whitespace-pre-line min-h-[260px]">
                {outputText ? (
                  outputText
                ) : (
                  <span className="text-slate-400">
                    Нажмите кнопку слева — здесь появится живой ответ от нейросети или подробный
                    отчет для роста продаж...
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex justify-around py-2.5 z-30">
        <button
          onClick={() => setActiveTab("reply")}
          className={`flex flex-col items-center text-xs font-medium ${
            activeTab === "reply" ? "text-blue-600" : "text-slate-500"
          }`}
        >
          <MessageSquare className="w-5 h-5 mb-1" />
          Ответы
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          className={`flex flex-col items-center text-xs font-medium ${
            activeTab === "analysis" ? "text-blue-600" : "text-slate-500"
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-1" />
          Аналитика
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center text-xs font-medium ${
            activeTab === "history" ? "text-blue-600" : "text-slate-500"
          }`}
        >
          <History className="w-5 h-5 mb-1" />
          История
        </button>
      </nav>

      {showPaywall && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold mb-2">Перейдите на тариф PRO</h3>
            <p className="text-slate-600 text-sm mb-6">
              Снимите все ограничения: генерируйте безлимитные ответы и анализируйте конкурентов
              каждый день.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-200">
              <div className="text-3xl font-extrabold text-slate-900">$19 / месяц</div>
              <div className="text-xs text-slate-500 mt-1">Отмена в любой момент в 1 клик</div>
            </div>
            <button
              onClick={() => {
                setCredits(999);
                localStorage.setItem("reviewai_credits", "999");
                setShowPaywall(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl mb-3 transition"
            >
              Оплатить и активировать (Тест)
            </button>
            <button
              onClick={() => setShowPaywall(false)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}