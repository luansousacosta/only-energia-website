import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useInView,
} from "framer-motion";
import {
  Sun,
  Leaf,
  Zap,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Building2,
  Home,
  BrainCircuit,
  BatteryCharging,
  LineChart,
  Sparkles,
  ArrowRight,
  Check,
  Plus,
  Minus,
  Phone,
  Mail,
  MapPin,
  Clock,
  Menu,
  X,
  Star,
  MessageCircle,
  Factory,
  Handshake,
  Quote,
  Loader2,
  CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Dados de contato — edite aqui para atualizar o site inteiro        */
/* ------------------------------------------------------------------ */
const CONTATO = {
  whatsapp: "5584991260677", // somente números, com DDI + DDD
  telefoneExibicao: "(84) 99126-0677",
  email: "contato@sousacostaenergia.com.br",
  instagram: "https://www.instagram.com/sousacosta.energia",
  cidade: "Atendimento em todo o Brasil",
};

/*
 * Webhook do n8n que qualifica o lead e cria o card no Reonic.
 * O formulário faz um POST (JSON) para esta URL — reaproveitando o mesmo
 * fluxo de atendimento/qualificação já usado no WhatsApp.
 *
 * Aponta para o fluxo "Site → Reonic (Sousa Costa Energia)" no n8n.
 * Pode ser sobrescrito em produção pela variável de ambiente
 * VITE_N8N_WEBHOOK_URL (crie um arquivo .env, ou defina no Netlify).
 */
const N8N_WEBHOOK_URL =
  (import.meta.env && import.meta.env.VITE_N8N_WEBHOOK_URL) ||
  "https://sousacosta.app.n8n.cloud/webhook/lead-site";

const wa = (msg) =>
  `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(
    msg || "Olá! Vim pelo site e quero conhecer as soluções da Sousa Costa Energia."
  )}`;

/*
 * Envia o lead para o n8n → qualificação → card no Reonic.
 * Retorna { ok: true } em sucesso. Em caso de falha ou webhook não
 * configurado, retorna { ok: false } para acionar o fallback de WhatsApp,
 * garantindo que nenhum lead se perca.
 */
async function enviarLead(payload) {
  if (!N8N_WEBHOOK_URL) return { ok: false, motivo: "sem-webhook" };
  try {
    const resp = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: resp.ok, status: resp.status };
  } catch (err) {
    return { ok: false, motivo: "erro-rede" };
  }
}

const brl = (n) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

/* ------------------------------------------------------------------ */
/*  Helpers de UI                                                      */
/* ------------------------------------------------------------------ */
const Container = ({ className = "", children }) => (
  <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 ${className}`}>{children}</div>
);

const Reveal = ({ children, delay = 0, y = 28, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const Eyebrow = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-brand-300/70 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-royal-700">
    <Sparkles className="h-3.5 w-3.5 text-brand-600" />
    {children}
  </span>
);

const SectionHead = ({ eyebrow, title, subtitle, center = true, light = false }) => (
  <div className={`${center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"} mb-12`}>
    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
    <h2
      className={`mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-[2.6rem] ${
        light ? "text-white" : "text-royal-950"
      }`}
    >
      {title}
    </h2>
    {subtitle && (
      <p className={`mt-4 text-base leading-relaxed sm:text-lg ${light ? "text-royal-100" : "text-royal-900/70"}`}>
        {subtitle}
      </p>
    )}
  </div>
);

/* Número animado — usado no simulador e nos contadores */
function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString("pt-BR") }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 80, damping: 18, mass: 0.8 });
  const [text, setText] = useState(format(0));
  useEffect(() => {
    mv.set(value);
  }, [value, mv]);
  useEffect(() => spring.on("change", (v) => setText(format(v))), [spring, format]);
  return <span>{text}</span>;
}

/* Logo em SVG (badge da marca) para contextos escuros */
const LogoBadge = ({ className = "h-10 w-10" }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
    <rect width="100" height="100" rx="24" fill="#3E4095" />
    <path
      d="M68 34c-4-6-11-9-19-9-11 0-19 6-19 15 0 8 6 12 17 14 8 2 11 3 11 7 0 3-3 5-9 5-6 0-11-2-15-7l-8 9c5 7 13 10 22 10 12 0 20-6 20-16 0-8-6-12-18-15-7-2-10-3-10-6 0-3 3-5 8-5 5 0 9 2 12 6z"
      fill="#9AD52A"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Navegação                                                          */
/* ------------------------------------------------------------------ */
const NAV = [
  { label: "Início", href: "#inicio" },
  { label: "Soluções", href: "#solucoes" },
  { label: "Simulador", href: "#simulador" },
  { label: "Investimento", href: "#investimento" },
  { label: "Projetos", href: "#projetos" },
  { label: "Contato", href: "#contato" },
];

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("inicio");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = NAV.map((n) => n.href.slice(1));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const go = (e, href) => {
    e.preventDefault();
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-royal-100 bg-white/85 backdrop-blur-xl shadow-sm" : "bg-transparent"
      }`}
    >
      <Container className="flex h-20 items-center justify-between">
        <a href="#inicio" onClick={(e) => go(e, "#inicio")} className="flex items-center gap-2" aria-label="Sousa Costa Energia">
          <img
            src="/logo-sousa-costa.png"
            alt="Sousa Costa Energia"
            className="h-11 w-auto object-contain sm:h-12"
          />
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const isActive = active === n.href.slice(1);
            return (
              <a
                key={n.href}
                href={n.href}
                onClick={(e) => go(e, n.href)}
                className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive ? "text-royal-700" : "text-royal-900/70 hover:text-royal-700"
                }`}
              >
                {n.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-brand-100"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={wa("Olá! Quero um orçamento com a Sousa Costa Energia.")}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-full bg-royal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-royal-600/25 transition hover:bg-royal-700 hover:shadow-royal-700/30 sm:inline-flex"
          >
            <MessageCircle className="h-4 w-4" />
            Fale conosco
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-royal-100 bg-white/80 text-royal-800 lg:hidden"
            aria-label="Abrir menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-royal-100 bg-white/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-1 p-5">
              {NAV.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={(e) => go(e, n.href)}
                  className="rounded-xl px-4 py-3 text-base font-semibold text-royal-900 hover:bg-brand-50"
                >
                  {n.label}
                </a>
              ))}
              <a
                href={wa("Olá! Quero um orçamento com a Sousa Costa Energia.")}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-royal-600 px-4 py-3 font-semibold text-white"
              >
                <MessageCircle className="h-4 w-4" /> Fale conosco
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Fundo decorativo */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-300/40 blur-3xl animate-blob" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-royal-300/40 blur-3xl animate-blob [animation-delay:3s]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(154,213,42,0.10),transparent)]" />
      </div>

      <Container className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-white/70 px-3 py-1.5 text-xs font-semibold text-royal-700 shadow-sm backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
              </span>
              Energia renovável &amp; soluções inteligentes
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-royal-950 sm:text-5xl lg:text-6xl text-balance"
          >
            A energia do seu futuro é{" "}
            <span className="relative whitespace-nowrap">
              <span className="text-gradient bg-gradient-to-r from-brand-600 to-brand-500">limpa e inteligente</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 300 10" preserveAspectRatio="none">
                <path d="M2 7 C 80 2, 220 2, 298 7" stroke="#9AD52A" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-royal-900/70"
          >
            A <strong className="text-royal-800">Sousa Costa Energia</strong> conecta você à energia solar: reduza sua
            conta de luz em até <strong className="text-royal-800">95%</strong>, invista em usinas geradoras com renda
            passiva e gerencie tudo com tecnologia de ponta.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href="#simulador"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("simulador")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 font-semibold text-royal-950 shadow-lg shadow-brand-500/30 transition hover:bg-brand-400"
            >
              Simular minha economia
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href={wa("Olá! Quero falar com um especialista da Sousa Costa Energia.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-royal-200 bg-white/80 px-7 py-3.5 font-semibold text-royal-800 backdrop-blur transition hover:border-royal-300 hover:bg-white"
            >
              <MessageCircle className="h-4 w-4 text-brand-600" />
              Falar com especialista
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-royal-900/70"
          >
            {[
              { icon: ShieldCheck, t: "Projetos com garantia" },
              { icon: Leaf, t: "100% energia limpa" },
              { icon: Star, t: "Clientes satisfeitos" },
            ].map((i) => (
              <span key={i.t} className="inline-flex items-center gap-2">
                <i.icon className="h-4 w-4 text-brand-600" />
                {i.t}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Visual do hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="relative rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-glow backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogoBadge className="h-9 w-9" />
                <div>
                  <p className="text-xs font-semibold text-royal-900/60">Sua economia estimada</p>
                  <p className="font-display text-sm font-bold text-royal-900">Painel Sousa Costa</p>
                </div>
              </div>
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-royal-700">ao vivo</span>
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-br from-royal-600 to-royal-800 p-5 text-white">
              <p className="text-xs font-medium text-royal-100">Economia acumulada · 25 anos</p>
              <p className="mt-1 font-display text-3xl font-extrabold">
                <AnimatedNumber value={168000} format={brl} />
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-royal-100">Economia/mês</p>
                  <p className="font-bold">
                    <AnimatedNumber value={560} format={brl} />
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-royal-100">Redução</p>
                  <p className="font-bold text-brand-300">95%</p>
                </div>
              </div>
            </div>

            {/* Mini painéis solares */}
            <div className="mt-5 grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.18 }}
                  className="aspect-square rounded-md bg-gradient-to-br from-royal-500 to-royal-700 ring-1 ring-royal-300/40"
                />
              ))}
            </div>
          </div>

          {/* Selos flutuantes */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute -left-6 top-16 hidden rounded-2xl border border-royal-100 bg-white p-3 shadow-card sm:block"
          >
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-brand-100 p-2">
                <Sun className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-royal-900/60">Geração hoje</p>
                <p className="text-sm font-bold text-royal-900">42,6 kWh</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute -right-4 bottom-10 hidden rounded-2xl border border-royal-100 bg-white p-3 shadow-card sm:block"
          >
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-royal-100 p-2">
                <Leaf className="h-5 w-5 text-royal-600" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-royal-900/60">CO₂ evitado</p>
                <p className="text-sm font-bold text-royal-900">1,8 ton/ano</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Faixa de estatísticas                                              */
/* ------------------------------------------------------------------ */
function StatStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const stats = [
    { value: 95, suffix: "%", label: "de redução na conta de luz" },
    { value: 25, suffix: " anos", label: "de vida útil dos sistemas" },
    { value: 100, suffix: "%", label: "energia limpa e renovável" },
    { value: 48, suffix: "h", label: "para uma proposta sob medida" },
  ];
  return (
    <section ref={ref} className="relative">
      <Container>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-royal-100 bg-royal-100 shadow-card md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className="bg-white p-6 text-center sm:p-8">
              <p className="font-display text-3xl font-extrabold text-royal-700 sm:text-4xl">
                <AnimatedNumber value={inView ? s.value : 0} />
                {s.suffix}
              </p>
              <p className="mt-1 text-sm text-royal-900/60">{s.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Soluções                                                           */
/* ------------------------------------------------------------------ */
const SOLUCOES = [
  {
    icon: Home,
    title: "Energia solar residencial",
    text: "Gere sua própria energia, elimine o susto na conta de luz e valorize seu imóvel com um sistema fotovoltaico sob medida.",
    tag: "Mais procurado",
  },
  {
    icon: Factory,
    title: "Solar para empresas e indústrias",
    text: "Reduza o maior custo fixo do seu negócio. Projetos comerciais e industriais com retorno rápido e previsível.",
  },
  {
    icon: TrendingUp,
    title: "Usina solar de investimento",
    text: "Invista em cotas de geração e receba renda passiva mensal com um ativo real, sustentável e de baixo risco.",
    tag: "Renda passiva",
  },
  {
    icon: BrainCircuit,
    title: "Soluções inteligentes de energia",
    text: "Monitoramento em tempo real, gestão de consumo, armazenamento e eficiência energética com tecnologia integrada.",
  },
];

function Solucoes() {
  return (
    <section id="solucoes" className="py-20 sm:py-28">
      <Container>
        <SectionHead
          eyebrow="O que fazemos"
          title="Soluções completas em energia"
          subtitle="Da sua casa à sua empresa, do consumo ao investimento — a Sousa Costa cuida de toda a jornada de energia renovável."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SOLUCOES.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-royal-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-glow">
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-brand-100 transition-transform duration-500 group-hover:translate-x-6 group-hover:-translate-y-6" />
                <div className="relative">
                  <div className="inline-flex rounded-2xl bg-royal-600 p-3 text-white shadow-lg shadow-royal-600/25">
                    <s.icon className="h-6 w-6" />
                  </div>
                  {s.tag && (
                    <span className="ml-3 rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-royal-700">
                      {s.tag}
                    </span>
                  )}
                  <h3 className="mt-5 font-display text-lg font-bold text-royal-950">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-royal-900/65">{s.text}</p>
                  <a
                    href={wa(`Olá! Tenho interesse em: ${s.title}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-royal-600 transition group-hover:gap-2.5"
                  >
                    Saiba mais <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Simulador de economia                                              */
/* ------------------------------------------------------------------ */
function Simulador({ conta, setConta }) {
  const pct = 0.9; // economia conservadora de 90%

  const dados = useMemo(() => {
    const mensal = conta * pct;
    const anual = mensal * 12;
    const total25 = anual * 25;
    const kwhAno = (conta / 0.85) * 12; // tarifa média aproximada
    const arvores = Math.max(1, Math.round((kwhAno * 0.0817) / 22)); // CO2 -> árvores/ano
    return { mensal, anual, total25, arvores };
  }, [conta]);

  return (
    <section id="simulador" className="py-20 sm:py-28">
      <Container>
        <div className="overflow-hidden rounded-[2.5rem] border border-royal-100 bg-gradient-to-br from-royal-700 via-royal-700 to-royal-900 shadow-glow">
          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:p-16">
            {/* Controles */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-300">
                <Wallet className="h-3.5 w-3.5" /> Simulador exclusivo
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold text-white sm:text-4xl">
                Quanto você pode economizar?
              </h2>
              <p className="mt-3 text-royal-100">
                Arraste e descubra em segundos o impacto da energia solar no seu bolso — sem compromisso.
              </p>

              <div className="mt-9">
                <div className="flex items-end justify-between">
                  <label htmlFor="conta" className="text-sm font-medium text-royal-100">
                    Sua conta de luz por mês
                  </label>
                  <span className="font-display text-2xl font-extrabold text-brand-300">{brl(conta)}</span>
                </div>
                <input
                  id="conta"
                  type="range"
                  min={150}
                  max={10000}
                  step={50}
                  value={conta}
                  onChange={(e) => setConta(Number(e.target.value))}
                  className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-brand-500"
                />
                <div className="mt-2 flex justify-between text-xs text-royal-200">
                  <span>{brl(150)}</span>
                  <span>{brl(10000)}</span>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {[300, 600, 1200, 3000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setConta(v)}
                      className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                        conta === v ? "bg-brand-500 text-royal-950" : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {brl(v)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resultados */}
            <div className="grid content-start gap-4">
              <div className="rounded-3xl bg-white p-7 shadow-xl">
                <p className="text-sm font-medium text-royal-900/60">Você economizaria por mês</p>
                <p className="mt-1 font-display text-4xl font-extrabold text-royal-700 sm:text-5xl">
                  <AnimatedNumber value={dados.mensal} format={brl} />
                </p>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-brand-50 p-4">
                    <p className="text-xs font-medium text-royal-900/60">Por ano</p>
                    <p className="mt-1 font-display text-xl font-bold text-royal-900">
                      <AnimatedNumber value={dados.anual} format={brl} />
                    </p>
                  </div>
                  <div className="rounded-2xl bg-royal-50 p-4">
                    <p className="text-xs font-medium text-royal-900/60">Em 25 anos</p>
                    <p className="mt-1 font-display text-xl font-bold text-royal-900">
                      <AnimatedNumber value={dados.total25} format={brl} />
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-100 to-brand-50 px-4 py-3 text-sm text-royal-800">
                  <Leaf className="h-5 w-5 shrink-0 text-brand-600" />
                  Equivale a plantar cerca de{" "}
                  <strong className="mx-1">
                    <AnimatedNumber value={dados.arvores} /> árvores
                  </strong>{" "}
                  por ano. 🌱
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })
                }
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-4 font-bold text-royal-950 shadow-lg transition hover:bg-brand-400"
              >
                Quero essa economia
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="text-center text-xs text-royal-200">
                *Estimativa ilustrativa. A economia real depende de consumo, telhado, distribuidora e projeto.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Usina de investimento                                              */
/* ------------------------------------------------------------------ */
const INVEST_BENEFICIOS = [
  { icon: Wallet, title: "Renda passiva mensal", text: "Receba créditos e retornos recorrentes gerados pela sua cota na usina." },
  { icon: LineChart, title: "Rentabilidade previsível", text: "Ativo lastreado em energia — demanda constante e receita de longo prazo." },
  { icon: Leaf, title: "Impacto sustentável", text: "Seu capital gera energia limpa e evita toneladas de CO₂ todos os anos." },
  { icon: ShieldCheck, title: "Baixo risco, ativo real", text: "Você investe em infraestrutura física, não em promessas — patrimônio que dura décadas." },
];

function Investimento() {
  return (
    <section id="investimento" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_80%_20%,rgba(154,213,42,0.10),transparent)]" />
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHead
              center={false}
              eyebrow="Usina solar de investimento"
              title="Faça seu dinheiro gerar energia — e renda"
              subtitle="Nem todo mundo tem telhado ideal, mas todos podem investir em energia solar. Com a Sousa Costa, você adquire cotas de uma usina geradora e passa a receber os benefícios da energia produzida."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {INVEST_BENEFICIOS.map((b, i) => (
                <Reveal key={b.title} delay={i * 0.08}>
                  <div className="flex h-full gap-4 rounded-2xl border border-royal-100 bg-white p-5 shadow-sm">
                    <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-royal-700">
                      <b.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-royal-950">{b.title}</h3>
                      <p className="mt-1 text-sm text-royal-900/65">{b.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Card de destaque do investimento */}
          <Reveal>
            <div className="relative rounded-[2rem] border border-royal-100 bg-white p-8 shadow-glow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-royal-600 p-2.5 text-white">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <p className="font-display font-bold text-royal-950">Cota de Usina Solar</p>
                </div>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-royal-700">Sustentável</span>
              </div>

              <div className="mt-7 space-y-4">
                {[
                  { k: "Modelo", v: "Geração distribuída" },
                  { k: "Retorno", v: "Renda passiva mensal" },
                  { k: "Horizonte", v: "Longo prazo · +25 anos" },
                  { k: "Lastro", v: "Ativo físico real" },
                ].map((row) => (
                  <div key={row.k} className="flex items-center justify-between border-b border-dashed border-royal-100 pb-3">
                    <span className="text-sm text-royal-900/60">{row.k}</span>
                    <span className="text-sm font-bold text-royal-900">{row.v}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-gradient-to-br from-royal-600 to-royal-800 p-6 text-white">
                <div className="flex items-center gap-2 text-brand-300">
                  <Handshake className="h-5 w-5" />
                  <p className="text-sm font-semibold">Invista com quem entende de energia</p>
                </div>
                <p className="mt-2 text-sm text-royal-100">
                  Nossa equipe monta um plano de investimento conforme o seu objetivo — do primeiro aporte à sua renda
                  mensal.
                </p>
                <a
                  href={wa("Olá! Quero conhecer a usina solar de investimento e receber uma simulação de rentabilidade.")}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 font-bold text-royal-950 transition hover:bg-brand-400"
                >
                  Quero investir <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <p className="mt-3 text-center text-xs text-royal-900/50">
                Investimento sujeito a análise. Rentabilidade não é garantida.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Como funciona                                                      */
/* ------------------------------------------------------------------ */
const PASSOS = [
  { icon: MessageCircle, title: "Fale com a gente", text: "Conte seu consumo e objetivo. Fazemos uma análise gratuita e sem compromisso." },
  { icon: LineChart, title: "Projeto sob medida", text: "Nossos especialistas dimensionam a melhor solução e apresentam a economia real." },
  { icon: BatteryCharging, title: "Instalação e ativação", text: "Cuidamos de tudo: homologação, instalação e conexão com a distribuidora." },
  { icon: Sparkles, title: "Economize e acompanhe", text: "Sua energia começa a gerar economia — e você monitora tudo em tempo real." },
];

function ComoFunciona() {
  return (
    <section id="como-funciona" className="py-20 sm:py-28">
      <Container>
        <SectionHead
          eyebrow="Simples do início ao fim"
          title="Como funciona"
          subtitle="Uma jornada sem burocracia, guiada por especialistas em cada etapa."
        />
        <div className="relative grid gap-6 md:grid-cols-4">
          <div className="pointer-events-none absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent md:block" />
          {PASSOS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <div className="relative h-full rounded-3xl border border-royal-100 bg-white p-7 text-center shadow-sm">
                <div className="relative mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-royal-600 text-white shadow-lg shadow-royal-600/25">
                  <p.icon className="h-7 w-7" />
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-sm font-extrabold text-royal-950 ring-4 ring-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-royal-950">{p.title}</h3>
                <p className="mt-2 text-sm text-royal-900/65">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Diferenciais + Depoimentos                                         */
/* ------------------------------------------------------------------ */
const DEPOIMENTOS = [
  {
    nome: "Ricardo Almeida",
    papel: "Cliente residencial",
    texto:
      "Minha conta caiu de mais de R$ 700 para menos de R$ 80. A equipe cuidou de tudo, sem dor de cabeça. Melhor decisão que tomei.",
  },
  {
    nome: "Fernanda Lima",
    papel: "Investidora",
    texto:
      "Investi em uma cota de usina e recebo minha renda todo mês. É satisfatório ver o dinheiro trabalhando e ainda gerar energia limpa.",
  },
  {
    nome: "Marcos Vinícius",
    papel: "Empresário",
    texto:
      "O retorno para minha empresa foi mais rápido do que eu imaginava. Profissionais sérios e transparentes do começo ao fim.",
  },
];

function Diferenciais() {
  return (
    <section id="diferenciais" className="py-20 sm:py-28">
      <Container>
        <SectionHead
          eyebrow="Por que Sousa Costa"
          title="Confiança que se vê no resultado"
          subtitle="Tecnologia, transparência e atendimento humano em cada projeto de energia."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {DEPOIMENTOS.map((d, i) => (
            <Reveal key={d.nome} delay={i * 0.1}>
              <figure className="flex h-full flex-col rounded-3xl border border-royal-100 bg-white p-7 shadow-sm">
                <Quote className="h-8 w-8 text-brand-400" />
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-royal-900/80">
                  “{d.texto}”
                </blockquote>
                <div className="mt-5 flex items-center gap-1 text-brand-500">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <figcaption className="mt-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-royal-600 font-display font-bold text-white">
                    {d.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-royal-950">{d.nome}</p>
                    <p className="text-xs text-royal-900/55">{d.papel}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Projetos realizados                                                */
/* ------------------------------------------------------------------ */
/*
 * Para usar fotos reais: coloque os arquivos em `public/projetos/` e
 * preencha o campo `img` de cada projeto (ex.: "/projetos/usina-mossoro.jpg").
 * Sem `img`, é exibida uma moldura da marca no lugar da foto.
 * Ajuste os dados (local, potência, economia) conforme os projetos reais.
 */
const PROJETOS = [
  { titulo: "Residência de alto padrão", local: "Natal · RN", tipo: "Residencial", potencia: "9,9 kWp", modulos: "18 módulos", economia: "94% de economia", img: "" },
  { titulo: "Supermercado", local: "Parnamirim · RN", tipo: "Comercial", potencia: "45 kWp", modulos: "82 módulos", economia: "88% de economia", img: "" },
  { titulo: "Usina de geração", local: "Mossoró · RN", tipo: "Usina", potencia: "120 kWp", modulos: "218 módulos", economia: "Renda passiva", img: "" },
  { titulo: "Galpão industrial", local: "Macaíba · RN", tipo: "Comercial", potencia: "75 kWp", modulos: "136 módulos", economia: "90% de economia", img: "" },
  { titulo: "Residência familiar", local: "Natal · RN", tipo: "Residencial", potencia: "5,5 kWp", modulos: "10 módulos", economia: "95% de economia", img: "" },
  { titulo: "Propriedade rural", local: "Ceará-Mirim · RN", tipo: "Usina", potencia: "30 kWp", modulos: "54 módulos", economia: "92% de economia", img: "" },
];

const FILTROS = ["Todos", "Residencial", "Comercial", "Usina"];

const ProjetoPlaceholder = ({ tipo }) => {
  const Icone = tipo === "Residencial" ? Home : tipo === "Comercial" ? Building2 : TrendingUp;
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-royal-600 via-royal-700 to-royal-900">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-500/30 blur-2xl" />
      <div className="relative flex flex-col items-center text-white/90">
        <Icone className="h-10 w-10" />
        <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-brand-300">Sousa Costa</span>
      </div>
    </div>
  );
};

function Projetos() {
  const [filtro, setFiltro] = useState("Todos");
  const lista = filtro === "Todos" ? PROJETOS : PROJETOS.filter((p) => p.tipo === filtro);
  return (
    <section id="projetos" className="py-20 sm:py-28">
      <Container>
        <SectionHead
          eyebrow="Projetos realizados"
          title="Energia que já está gerando resultado"
          subtitle="Residências, empresas e usinas espalhadas pelo Rio Grande do Norte — cada projeto é dimensionado sob medida e entregue com acompanhamento completo."
        />

        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                filtro === f
                  ? "bg-royal-600 text-white shadow-lg shadow-royal-600/25"
                  : "border border-royal-200 bg-white text-royal-700 hover:border-royal-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((p, i) => (
            <Reveal key={p.titulo} delay={(i % 3) * 0.08}>
              <article className="group h-full overflow-hidden rounded-3xl border border-royal-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow">
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  {p.img ? (
                    <img
                      src={p.img}
                      alt={`${p.titulo} — ${p.local}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <ProjetoPlaceholder tipo={p.tipo} />
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-royal-700 backdrop-blur">
                    {p.tipo}
                  </span>
                  <span className="absolute right-4 top-4 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-royal-950">
                    {p.economia}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg font-bold text-royal-950">{p.titulo}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-royal-900/60">
                    <MapPin className="h-4 w-4 text-brand-600" /> {p.local}
                  </p>
                  <div className="mt-4 flex items-center gap-4 border-t border-royal-100 pt-4 text-sm">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-royal-800">
                      <Zap className="h-4 w-4 text-brand-600" /> {p.potencia}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-royal-900/60">
                      <Sun className="h-4 w-4 text-brand-600" /> {p.modulos}
                    </span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href={wa("Olá! Vi os projetos no site e quero um projeto sob medida para mim.")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 font-bold text-royal-950 shadow-lg shadow-brand-500/30 transition hover:bg-brand-400"
          >
            Quero meu projeto <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */
const FAQ = [
  {
    q: "Preciso de telhado próprio para ter energia solar?",
    a: "Não necessariamente. Além dos sistemas instalados no seu telhado, você pode participar da nossa usina solar de investimento e receber os benefícios da geração sem instalar nada.",
  },
  {
    q: "Quanto tempo leva para começar a economizar?",
    a: "Após a aprovação do projeto e homologação junto à distribuidora, o sistema entra em operação e a economia aparece já nas primeiras faturas.",
  },
  {
    q: "Qual é a vida útil de um sistema solar?",
    a: "Os painéis têm vida útil superior a 25 anos, com desempenho garantido por fabricantes. É um investimento de longo prazo com baixíssima manutenção.",
  },
  {
    q: "Como funciona o investimento em usina solar?",
    a: "Você adquire uma cota de uma usina geradora e passa a receber a renda proporcional à energia produzida. Nossa equipe monta um plano conforme o seu objetivo.",
  },
  {
    q: "A Sousa Costa cuida de toda a parte burocrática?",
    a: "Sim. Cuidamos do projeto, da homologação, da instalação e da conexão com a distribuidora. Você acompanha tudo com transparência.",
  },
];

function FaqSection() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="py-20 sm:py-28">
      <Container className="max-w-3xl">
        <SectionHead eyebrow="Dúvidas frequentes" title="Tudo o que você precisa saber" />
        <div className="space-y-3">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className={`overflow-hidden rounded-2xl border transition-colors ${
                  isOpen ? "border-brand-300 bg-white shadow-card" : "border-royal-100 bg-white"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-base font-bold text-royal-950">{item.q}</span>
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isOpen ? "bg-brand-500 text-royal-950" : "bg-royal-50 text-royal-600"
                    }`}
                  >
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-royal-900/70">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Contato                                                            */
/* ------------------------------------------------------------------ */
const INTERESSES = [
  "Energia solar residencial",
  "Solar para empresa / indústria",
  "Usina solar de investimento",
  "Soluções inteligentes de energia",
];

const inputCls =
  "w-full rounded-xl border border-royal-200 bg-royal-50/40 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-200";

function Contato({ conta = 600 }) {
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    interesse: INTERESSES[0],
    valorConta: conta,
    mensagem: "",
    consentimento: false,
  });
  const [status, setStatus] = useState("idle"); // idle | sending | success | error

  // Mantém o valor da conta em sincronia com o simulador enquanto o usuário
  // não editar o campo manualmente.
  const contaEditada = useRef(false);
  useEffect(() => {
    if (!contaEditada.current) setForm((f) => ({ ...f, valorConta: conta }));
  }, [conta]);

  const setField = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    if (campo === "valorConta") contaEditada.current = true;
    setForm((f) => ({ ...f, [campo]: valor }));
  };

  const textoWhats = () =>
    `Olá! Sou ${form.nome || "um interessado"}. ` +
    `Interesse: ${form.interesse}. ` +
    `Conta média: ${brl(Number(form.valorConta) || 0)}. ` +
    (form.mensagem ? `Mensagem: ${form.mensagem} ` : "") +
    `Podem me enviar uma proposta?`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.consentimento || status === "sending") return;
    setStatus("sending");

    const payload = {
      nome: form.nome,
      telefone: form.telefone,
      email: form.email,
      interesse: form.interesse,
      valorConta: Number(form.valorConta) || null,
      mensagem: form.mensagem,
      consentimentoLGPD: form.consentimento,
      origem: "site-formulario",
      paginaUrl: typeof window !== "undefined" ? window.location.href : "",
    };

    const res = await enviarLead(payload);
    if (res.ok) {
      setStatus("success");
    } else {
      // Fallback: não perder o lead — abre o WhatsApp com os dados preenchidos.
      setStatus("error");
      window.open(wa(textoWhats()), "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section id="contato" className="py-20 sm:py-28">
      <Container>
        <div className="overflow-hidden rounded-[2.5rem] border border-royal-100 bg-white shadow-glow">
          <div className="grid lg:grid-cols-5">
            {/* Lado informativo */}
            <div className="relative flex flex-col justify-between bg-gradient-to-br from-royal-700 to-royal-900 p-8 text-white sm:p-12 lg:col-span-2">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/20 blur-2xl" />
              <div className="relative">
                <LogoBadge className="h-12 w-12" />
                <h2 className="mt-6 font-display text-3xl font-extrabold">Vamos gerar seu futuro?</h2>
                <p className="mt-3 text-royal-100">
                  Fale com um especialista da Sousa Costa Energia e receba uma proposta personalizada, sem compromisso.
                </p>
                <div className="mt-8 space-y-4 text-sm">
                  <a href={wa()} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-brand-300">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <MessageCircle className="h-5 w-5" />
                    </span>
                    WhatsApp · {CONTATO.telefoneExibicao}
                  </a>
                  <a href={`mailto:${CONTATO.email}`} className="flex items-center gap-3 hover:text-brand-300">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <Mail className="h-5 w-5" />
                    </span>
                    {CONTATO.email}
                  </a>
                  <p className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <MapPin className="h-5 w-5" />
                    </span>
                    {CONTATO.cidade}
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <Clock className="h-5 w-5" />
                    </span>
                    Seg. a Sex., 8h às 18h
                  </p>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <div className="p-8 sm:p-12 lg:col-span-3">
              {status === "success" ? (
                <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-bold text-royal-950">Solicitação enviada! 🎉</h3>
                  <p className="mt-2 max-w-sm text-sm text-royal-900/65">
                    Recebemos seus dados e nossa equipe entrará em contato em breve. Se preferir, fale agora mesmo no
                    WhatsApp.
                  </p>
                  <a
                    href={wa(textoWhats())}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-bold text-royal-950 transition hover:bg-brand-400"
                  >
                    <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                  </a>
                </div>
              ) : (
                <>
                  <h3 className="font-display text-xl font-bold text-royal-950">Solicite sua proposta</h3>
                  <p className="mt-1 text-sm text-royal-900/60">Responderemos em até 1 dia útil.</p>
                  <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <label className="mb-1.5 block text-sm font-medium text-royal-900">Nome</label>
                      <input
                        required
                        value={form.nome}
                        onChange={setField("nome")}
                        placeholder="Seu nome completo"
                        className={inputCls}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="mb-1.5 block text-sm font-medium text-royal-900">WhatsApp</label>
                      <input
                        required
                        type="tel"
                        value={form.telefone}
                        onChange={setField("telefone")}
                        placeholder="(00) 00000-0000"
                        className={inputCls}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="mb-1.5 block text-sm font-medium text-royal-900">E-mail</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={setField("email")}
                        placeholder="voce@email.com"
                        className={inputCls}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="mb-1.5 block text-sm font-medium text-royal-900">
                        Valor médio da conta de luz (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={form.valorConta}
                        onChange={setField("valorConta")}
                        placeholder="600"
                        className={inputCls}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-royal-900">Como podemos ajudar?</label>
                      <select value={form.interesse} onChange={setField("interesse")} className={inputCls}>
                        {INTERESSES.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-royal-900">Mensagem</label>
                      <textarea
                        rows="3"
                        value={form.mensagem}
                        onChange={setField("mensagem")}
                        placeholder="Conte um pouco sobre seu consumo ou objetivo..."
                        className={inputCls}
                      />
                    </div>

                    <label className="flex cursor-pointer items-start gap-2.5 text-xs text-royal-900/70 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={form.consentimento}
                        onChange={setField("consentimento")}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
                      />
                      Autorizo o contato da Sousa Costa Energia e o tratamento dos meus dados conforme a LGPD.
                    </label>

                    {status === "error" && (
                      <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700 sm:col-span-2">
                        Não foi possível enviar automaticamente. Abrimos o WhatsApp com seus dados para você concluir —
                        ou tente novamente.
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={!form.consentimento || status === "sending"}
                      className="group inline-flex items-center justify-center gap-2 rounded-xl bg-royal-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-royal-600/25 transition hover:bg-royal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
                    >
                      {status === "sending" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                        </>
                      ) : (
                        <>
                          Enviar solicitação
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-royal-900/50 sm:col-span-2">
                      Prefere agilidade?{" "}
                      <a href={wa()} target="_blank" rel="noreferrer" className="font-semibold text-royal-600 hover:underline">
                        Fale direto no WhatsApp
                      </a>
                      .
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Rodapé                                                             */
/* ------------------------------------------------------------------ */
function Footer() {
  const go = (e, href) => {
    e.preventDefault();
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <footer className="border-t border-royal-100 bg-royal-950 text-white">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <LogoBadge className="h-11 w-11" />
              <div>
                <p className="font-display text-lg font-extrabold leading-none">Sousa Costa</p>
                <p className="text-xs font-semibold tracking-[0.3em] text-brand-400">ENERGIA</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-royal-200">
              Energias renováveis e soluções inteligentes de energia. Economia, sustentabilidade e renda para
              residências, empresas e investidores.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href={wa()}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-brand-500 hover:text-royal-950"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a
                href={CONTATO.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-brand-500 hover:text-royal-950"
              >
                <Sparkles className="h-5 w-5" />
              </a>
              <a
                href={`mailto:${CONTATO.email}`}
                aria-label="E-mail"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-brand-500 hover:text-royal-950"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <p className="font-display text-sm font-bold uppercase tracking-widest text-brand-400">Navegação</p>
            <ul className="mt-4 space-y-2.5 text-sm text-royal-200">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} onClick={(e) => go(e, n.href)} className="transition hover:text-white">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-display text-sm font-bold uppercase tracking-widest text-brand-400">Soluções</p>
            <ul className="mt-4 space-y-2.5 text-sm text-royal-200">
              <li>Energia solar residencial</li>
              <li>Solar para empresas</li>
              <li>Usina de investimento</li>
              <li>Soluções inteligentes</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-royal-300 sm:flex-row">
          <p>© {new Date().getFullYear()} Sousa Costa Energia. Todos os direitos reservados.</p>
          <p>Feito com energia limpa ⚡ e tecnologia.</p>
        </div>
      </Container>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Botão flutuante de WhatsApp                                        */
/* ------------------------------------------------------------------ */
function FloatingWhatsApp() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.a
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          href={wa()}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3.5 font-bold text-royal-950 shadow-2xl shadow-brand-500/40 transition hover:bg-brand-400"
          aria-label="Falar no WhatsApp"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-royal-700 opacity-60" />
            <MessageCircle className="relative h-5 w-5" />
          </span>
          <span className="hidden sm:inline">Fale conosco</span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */
export default function App() {
  // Valor da conta compartilhado: o simulador atualiza e o formulário
  // de contato usa como dado de qualificação (pré-preenchido).
  const [conta, setConta] = useState(600);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-royal-50/40 to-white font-sans text-royal-950">
      <Header />
      <main>
        <Hero />
        <StatStrip />
        <Solucoes />
        <Simulador conta={conta} setConta={setConta} />
        <Investimento />
        <ComoFunciona />
        <Projetos />
        <Diferenciais />
        <FaqSection />
        <Contato conta={conta} />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
