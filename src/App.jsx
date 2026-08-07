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
  Wrench,
  BatteryFull,
  Power,
  ZoomIn,
  Play,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Dados de contato — edite aqui para atualizar o site inteiro        */
/* ------------------------------------------------------------------ */
const CONTATO = {
  whatsapp: "558491388651", // WhatsApp da Ágata (atendimento/qualificação) — só números, DDI+DDD
  whatsappExibicao: "(84) 9138-8651",
  telefone: "5584991260677", // número de ligação / pós-qualificação
  telefoneExibicao: "(84) 99126-0677",
  email: "contato@sousacosta.com.br",
  instagram: "https://www.instagram.com/sousacosta.energia",
  cidade: "São Gonçalo do Amarante · RN — atendemos todo o Brasil",
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
 * Rastreamento (gtag.js carregado no index.html):
 *  - Google Ads: dispara a "ação de conversão" (send_to = ID/rótulo).
 *  - Google Analytics 4: dispara o evento nomeado (analytics + remarketing).
 * O disparo é protegido (checa window.gtag) para não quebrar em dev.
 */
const CONVERSOES = {
  // { adsSendTo: "AW-<id>/<rótulo>", ga4: "<nome do evento GA4>" }
  formulario: { adsSendTo: "AW-658673813/gC70CLS76c0cEJWhiroC", ga4: "generate_lead" },
  whatsapp: { adsSendTo: "AW-658673813/m5MKCLe76c0cEJWhiroC", ga4: "click_whatsapp" },
};

function registrarConversao(tipo, valor = 50) {
  if (typeof window === "undefined") return;
  const c = CONVERSOES[tipo];
  if (!c) return;
  if (typeof window.gtag === "function") {
    // Conversão do Google Ads (só se houver rótulo configurado para este tipo)
    if (c.adsSendTo) {
      window.gtag("event", "conversion", { send_to: c.adsSendTo, value: valor, currency: "BRL" });
    }
    // Evento do Google Analytics 4 (relatórios + públicos de remarketing)
    window.gtag("event", c.ga4, { value: valor, currency: "BRL" });
  }
  // Meta Pixel: formulário = Lead; clique no WhatsApp = Contact.
  // Alimenta os públicos de remarketing da campanha do Meta (Fase 2).
  if (typeof window.fbq === "function") {
    window.fbq("track", tipo === "formulario" ? "Lead" : "Contact", { value: valor, currency: "BRL" });
  }
}

/*
 * Rastreamento de fechamento (conversão offline do Google Ads).
 * Ao chegar de um anúncio, a URL traz o GCLID (ID do clique). Guardamos por
 * 90 dias e enviamos junto com o lead; quando o lead vira venda no Reonic,
 * esse GCLID permite creditar a venda ao anúncio certo no Google Ads.
 */
const GCLID_CHAVE = "sc_gclid";
const GCLID_VALIDADE_MS = 90 * 24 * 60 * 60 * 1000; // 90 dias

function capturarGclid() {
  if (typeof window === "undefined") return;
  try {
    const p = new URLSearchParams(window.location.search);
    const gclid = p.get("gclid") || p.get("wbraid") || p.get("gbraid");
    if (gclid) localStorage.setItem(GCLID_CHAVE, JSON.stringify({ gclid, ts: Date.now() }));
  } catch (e) {
    /* localStorage indisponível — ignora */
  }
}

function obterGclid() {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem(GCLID_CHAVE);
    if (!raw) return "";
    const { gclid, ts } = JSON.parse(raw);
    if (gclid && Date.now() - Number(ts || 0) < GCLID_VALIDADE_MS) return gclid;
  } catch (e) {
    /* ignora */
  }
  return "";
}

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

/* Número animado — usado nos contadores e no card do hero */
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
  { label: "Serviços", href: "#solucoes" },
  { label: "Investimento", href: "#investimento" },
  { label: "Projetos", href: "#projetos" },
  { label: "Galeria", href: "#galeria" },
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
            src="logo-sousa-costa.png"
            alt="Sousa Costa Energia"
            className="h-12 w-auto object-contain sm:h-14"
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
              Energia solar para empresas · Todo o Brasil
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-royal-950 sm:text-5xl lg:text-6xl text-balance"
          >
            Sua usina solar em boas mãos,{" "}
            <span className="relative whitespace-nowrap">
              <span className="text-gradient bg-gradient-to-r from-brand-600 to-brand-500">do projeto à operação</span>
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
            A <strong className="text-royal-800">Sousa Costa Energia</strong> atende{" "}
            <strong className="text-royal-800">empresas, indústrias e proprietários de usinas</strong> em todo o
            Brasil: EPC de usinas (inclusive grande porte), O&amp;M com planos de manutenção, retrofit,
            comissionamento, lavagem e termografia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href="#contato"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 font-semibold text-royal-950 shadow-lg shadow-brand-500/30 transition hover:bg-brand-400"
            >
              Solicitar proposta
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href={wa("Olá! Quero falar com um especialista da Sousa Costa Energia sobre a minha usina/empresa.")}
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
              { icon: MapPin, t: "Atuação em todo o Brasil" },
              { icon: Wrench, t: "Equipe técnica especializada" },
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
                  <p className="text-xs font-semibold text-royal-900/60">Gestão de usinas</p>
                  <p className="font-display text-sm font-bold text-royal-900">Painel Sousa Costa</p>
                </div>
              </div>
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-royal-700">ao vivo</span>
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-br from-royal-600 to-royal-800 p-5 text-white">
              <p className="text-xs font-medium text-royal-100">Portfólio em O&amp;M e monitoramento</p>
              <p className="mt-1 font-display text-3xl font-extrabold">
                <AnimatedNumber value={9} /> MWp
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-royal-100">Implantados</p>
                  <p className="font-bold">1,2 MWp</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-royal-100">Em implantação</p>
                  <p className="font-bold text-brand-300">2,3 MWp</p>
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
                <p className="text-[11px] font-medium text-royal-900/60">Monitoramento</p>
                <p className="text-sm font-bold text-royal-900">24/7 em tempo real</p>
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
                <p className="text-[11px] font-medium text-royal-900/60">Inspeções técnicas</p>
                <p className="text-sm font-bold text-royal-900">Termografia e lavagem</p>
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
    { value: 9, suffix: " MWp", label: "em O&M e monitoramento" },
    { value: 13500, suffix: "+", label: "módulos no maior projeto (retrofit)" },
    { value: 25, suffix: " anos", label: "de vida útil dos sistemas" },
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
    icon: Factory,
    title: "EPC — Construção de usinas",
    text: "Projeto, suprimentos e construção completa de usinas solares, incluindo grande porte (MW): engenharia, execução e entrega em operação.",
    tag: "Grandes usinas",
  },
  {
    icon: Wrench,
    title: "O&M e planos de manutenção",
    text: "Operação e manutenção de usinas: corretiva, preventiva e planos recorrentes com monitoramento 24/7, inspeções e relatórios de desempenho.",
    tag: "Mais procurado",
  },
  {
    icon: Power,
    title: "Retrofit e repotenciação",
    text: "Recuperação de usinas gerando abaixo do esperado ou com equipamentos defasados — diagnóstico, modernização e retomada de performance.",
  },
  {
    icon: ShieldCheck,
    title: "Comissionamento de usinas",
    text: "Testes, inspeção e energização de usinas — inclusive construídas por terceiros — com laudos e conformidade para operação segura.",
  },
  {
    icon: Sparkles,
    title: "Lavagem e termografia",
    text: "Limpeza especializada de módulos e inspeção termográfica para identificar perdas, pontos quentes e riscos antes que virem prejuízo.",
  },
  {
    icon: BatteryFull,
    title: "Híbrido e BESS — armazenamento",
    text: "Baterias para indústrias e grandes consumidores: backup de cargas críticas, corte de ponta, gestão de demanda e arbitragem de tarifa.",
  },
];

function Solucoes() {
  return (
    <section id="solucoes" className="py-20 sm:py-28">
      <Container>
        <SectionHead
          eyebrow="O que fazemos"
          title="Serviços completos para usinas e empresas"
          subtitle="EPC, O&M, retrofit, comissionamento, lavagem e termografia — da construção à operação de usinas solares, em todo o Brasil."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              eyebrow="Investidores e ativos de energia"
              title="Faça seu capital gerar energia — e renda"
              subtitle="Para investidores e empresas que querem entrar no setor: desenvolvimento de usinas para investimento, geração compartilhada e apoio na aquisição de ativos de energia — da análise técnica à operação."
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
                  Do primeiro aporte à operação: montamos o plano conforme seu objetivo — construir usina nova,
                  investir em geração ou adquirir um ativo já em operação.
                </p>
                <a
                  href={wa("Olá! Sou investidor e quero conhecer as oportunidades em usinas e ativos de energia com a Sousa Costa.")}
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
  { icon: MessageCircle, title: "Fale com a gente", text: "Conte a necessidade da sua empresa ou usina — onde fica, o porte e o desafio. Análise sem compromisso." },
  { icon: LineChart, title: "Diagnóstico e proposta", text: "Nossos engenheiros avaliam o caso (visita técnica quando necessário) e apresentam a proposta sob medida." },
  { icon: BatteryCharging, title: "Execução", text: "EPC, retrofit, comissionamento ou manutenção — executados com equipe especializada, segurança e prazo." },
  { icon: Sparkles, title: "Operação e resultados", text: "Usina monitorada 24/7, com relatórios de desempenho e plano de manutenção para performance contínua." },
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
    papel: "Proprietário de usina",
    texto:
      "A usina estava gerando bem abaixo do esperado. Depois do diagnóstico e do retrofit, voltou a performar — e hoje sigo com o plano de manutenção deles.",
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
 * Projetos reais extraídos da apresentação comercial. As fotos ficam em
 * `public/projetos/`. Para adicionar/editar, basta atualizar os campos abaixo.
 */
const PROJETOS = [
  { titulo: "Complexo Ipiranga — UFV 1 a 5", local: "Guaíba · RS", tipo: "Destaque", potencia: "6,4 MWp", modulos: "13.500 módulos", extra: "Retrofit e recuperação de ativo", status: "Retrofit", img: "projetos/complexo-ipiranga.jpg" },
  { titulo: "UFV ADPaz", local: "Natal · RN", tipo: "Usinas", potencia: "110 kWp", modulos: "192 módulos", extra: "Autoconsumo remoto · retorno em 3,5 anos", img: "projetos/ufv-adpaz.jpg" },
  { titulo: "UFV Cánada I", local: "S. José do Mipibu · RN", tipo: "Usinas", potencia: "140 kWp", modulos: "200 módulos", extra: "Autoconsumo remoto · payback em 4 anos", img: "projetos/ufv-canada-1.jpg" },
  { titulo: "UFV Taipu III", local: "Taipu · RN", tipo: "Usinas", potencia: "109,4 kWp", modulos: "192 módulos", extra: "Autoconsumo remoto · retorno em 4,5 anos", img: "projetos/ufv-taipu-3.jpg" },
  { titulo: "UFV JR 01", local: "Nisía Floresta · RN", tipo: "Usinas", potencia: "105 kWp", modulos: "168 módulos", extra: "Autoconsumo remoto · retorno em 3,5 anos", img: "projetos/ufv-jr01.jpg" },
  { titulo: "Ampliação UFV Rio Verde", local: "Brejinho · RN", tipo: "Usinas", potencia: "37,5 kWp", modulos: "68 módulos", extra: "Autoconsumo remoto · retorno em 3,8 anos", img: "projetos/rio-verde.jpg" },
  { titulo: "UFV Cánada II", local: "S. José do Mipibu · RN", tipo: "Usinas", potencia: "140 kWp", modulos: "200 módulos", extra: "Autoconsumo remoto · payback em 4 anos", status: "Em obras", img: "projetos/ufv-canada-2.jpg" },
  { titulo: "Fábrica Universo EPI", local: "Natal · RN", tipo: "Comercial", potencia: "12 kWp", modulos: "22 módulos", extra: "Autoconsumo remoto · retorno em 4 anos", img: "projetos/universo-epi.jpg" },
  { titulo: "Pousada do Jorge", local: "Riachuelo · RN", tipo: "Comercial", potencia: "9,1 kWp", modulos: "20 módulos", extra: "Autoconsumo remoto · retorno em 3,5 anos", img: "projetos/pousada-jorge.jpg" },
];

const PORTFOLIO_NUMEROS = [
  { v: "1,2 MWp", l: "implantados com sucesso" },
  { v: "2,3 MWp", l: "em projeto e implantação" },
  { v: "9 MWp", l: "em O&M e monitoramento" },
];

const FILTROS = ["Todos", "Usinas", "Comercial", "Destaque"];

function Projetos() {
  const [filtro, setFiltro] = useState("Todos");
  const [aberto, setAberto] = useState(null);
  const lista = filtro === "Todos" ? PROJETOS : PROJETOS.filter((p) => p.tipo === filtro);

  // Fecha o lightbox com a tecla Esc e trava o scroll do fundo enquanto aberto
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e) => e.key === "Escape" && setAberto(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [aberto]);

  return (
    <section id="projetos" className="py-20 sm:py-28">
      <Container>
        <SectionHead
          eyebrow="Portfólio · Projetos realizados"
          title="Usinas em operação, resultado comprovado"
          subtitle="Da viabilidade ao O&M, desenvolvemos e gerenciamos usinas solares como ativos de infraestrutura — em todo o Brasil."
        />

        {/* Números reais do portfólio */}
        <div className="mx-auto mb-12 grid max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-royal-100 bg-royal-100 shadow-card">
          {PORTFOLIO_NUMEROS.map((n) => (
            <div key={n.l} className="bg-white p-5 text-center">
              <p className="font-display text-2xl font-extrabold text-royal-700 sm:text-3xl">{n.v}</p>
              <p className="mt-1 text-xs text-royal-900/60 sm:text-sm">{n.l}</p>
            </div>
          ))}
        </div>

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
              <article
                onClick={() => setAberto(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setAberto(p))}
                aria-label={`Ver foto ampliada — ${p.titulo}`}
                className="group relative h-full cursor-pointer overflow-hidden rounded-3xl border border-royal-100 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-royal-800">
                  <img
                    src={p.img}
                    alt={`${p.titulo} — ${p.local}`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-royal-950 via-royal-950/55 to-royal-950/5" />

                  {/* Indicador de zoom */}
                  <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-royal-700 opacity-0 shadow-lg backdrop-blur transition-all duration-300 group-hover:opacity-100">
                    <ZoomIn className="h-5 w-5" />
                  </div>

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-royal-700 backdrop-blur">
                      {p.tipo}
                    </span>
                    {p.status && (
                      <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-royal-950">
                        {p.status}
                      </span>
                    )}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <h3 className="font-display text-lg font-bold leading-tight">{p.titulo}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
                      <MapPin className="h-4 w-4 text-brand-400" /> {p.local}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="inline-flex items-center gap-1.5 font-bold text-brand-400">
                        <Zap className="h-4 w-4" /> {p.potencia}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-white/75">
                        <Sun className="h-4 w-4" /> {p.modulos}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-white/60">{p.extra}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href={wa("Olá! Vi os projetos no site e quero desenvolver/investir em uma usina solar com a Sousa Costa.")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 font-bold text-royal-950 shadow-lg shadow-brand-500/30 transition hover:bg-brand-400"
          >
            Quero meu projeto <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </Container>

      {/* Lightbox — imagem ampliada e limpa (sem gradiente) */}
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setAberto(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-royal-950/90 p-4 backdrop-blur-sm sm:p-8"
          >
            <button
              onClick={() => setAberto(null)}
              aria-label="Fechar"
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6 sm:top-6"
            >
              <X className="h-6 w-6" />
            </button>

            <motion.figure
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-full w-full max-w-5xl flex-col items-center"
            >
              <img
                src={aberto.img}
                alt={`${aberto.titulo} — ${aberto.local}`}
                className="max-h-[78vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
              <figcaption className="mt-4 w-full max-w-3xl text-center text-white">
                <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-royal-700">
                    {aberto.tipo}
                  </span>
                  {aberto.status && (
                    <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-royal-950">
                      {aberto.status}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-xl font-bold">{aberto.titulo}</h3>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/80">
                  <MapPin className="h-4 w-4 text-brand-400" /> {aberto.local}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-bold text-brand-400">
                    <Zap className="h-4 w-4" /> {aberto.potencia}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-white/75">
                    <Sun className="h-4 w-4" /> {aberto.modulos}
                  </span>
                </div>
                {aberto.extra && <p className="mt-1.5 text-xs text-white/60">{aberto.extra}</p>}
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Galeria — fotos e vídeos (seção própria, separada de Projetos)     */
/* ------------------------------------------------------------------ */
/*
 * Galeria visual de fotos E vídeos. Cada item é uma FOTO ou um VÍDEO:
 *
 *   FOTO  → { tipo: "foto",  titulo, legenda, img: "galeria/arquivo.jpg" }
 *           (coloque o arquivo em `public/galeria/` ou reaproveite os de
 *            `public/projetos/`).
 *
 *   VÍDEO → { tipo: "video", titulo, legenda, youtube: "ID_DO_YOUTUBE" }
 *           O ID é o trecho final da URL do YouTube:
 *             https://youtu.be/AbCdEf12345              → "AbCdEf12345"
 *             https://youtube.com/watch?v=AbCdEf12345   → "AbCdEf12345"
 *             https://youtube.com/shorts/AbCdEf12345    → "AbCdEf12345"
 *           A miniatura é gerada automaticamente pelo YouTube.
 *
 * Para adicionar um vídeo, é só copiar o exemplo comentado abaixo, trocar o
 * ID e o texto, e tirar as barras "//".
 */
const ytThumb = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

const GALERIA = [
  // ——— VÍDEOS ———
  { tipo: "video", titulo: "Sousa Costa Energia", legenda: "Projeto de energia solar em operação · RN", youtube: "7ujfIcEuUYQ" },
  // { tipo: "video", titulo: "Depoimento de cliente", legenda: "Resultado real depois da instalação", youtube: "COLE_O_ID_AQUI" },

  // ——— FOTOS ———
  { tipo: "foto", titulo: "Complexo Ipiranga", legenda: "UFV 1 a 5 · Guaíba · RS", img: "projetos/complexo-ipiranga.jpg" },
  { tipo: "foto", titulo: "UFV ADPaz", legenda: "110 kWp · Natal · RN", img: "projetos/ufv-adpaz.jpg" },
  { tipo: "foto", titulo: "UFV Cánada I", legenda: "140 kWp · S. José do Mipibu · RN", img: "projetos/ufv-canada-1.jpg" },
  { tipo: "foto", titulo: "UFV Taipu III", legenda: "109,4 kWp · Taipu · RN", img: "projetos/ufv-taipu-3.jpg" },
  { tipo: "foto", titulo: "UFV JR 01", legenda: "105 kWp · Nisía Floresta · RN", img: "projetos/ufv-jr01.jpg" },
  { tipo: "foto", titulo: "Ampliação UFV Rio Verde", legenda: "37,5 kWp · Brejinho · RN", img: "projetos/rio-verde.jpg" },
  { tipo: "foto", titulo: "UFV Cánada II", legenda: "140 kWp · em obras · RN", img: "projetos/ufv-canada-2.jpg" },
  { tipo: "foto", titulo: "Fábrica Universo EPI", legenda: "12 kWp · Natal · RN", img: "projetos/universo-epi.jpg" },
  { tipo: "foto", titulo: "Pousada do Jorge", legenda: "9,1 kWp · Riachuelo · RN", img: "projetos/pousada-jorge.jpg" },
];

// A aba "Vídeos" só aparece quando existe pelo menos um vídeo na galeria.
const TEM_VIDEOS = GALERIA.some((g) => g.tipo === "video");
const FILTROS_GALERIA = ["Todos", "Fotos", ...(TEM_VIDEOS ? ["Vídeos"] : [])];

// Capa do item: a foto informada, ou a miniatura automática do YouTube.
const capaMidia = (g) => g.img || (g.tipo === "video" ? ytThumb(g.youtube) : undefined);

// Trava o scroll do fundo e fecha com Esc enquanto um lightbox está aberto.
function useLightboxKeys(aberto, setAberto) {
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e) => e.key === "Escape" && setAberto(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [aberto, setAberto]);
}

// Lightbox compartilhado (teaser + galeria completa): amplia foto ou toca vídeo.
function LightboxMidia({ aberto, onClose }) {
  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-royal-950/90 p-4 backdrop-blur-sm sm:p-8"
        >
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6 sm:top-6"
          >
            <X className="h-6 w-6" />
          </button>

          <motion.figure
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-full w-full max-w-5xl flex-col items-center"
          >
            {aberto.tipo === "video" ? (
              <div className="aspect-video w-full max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${aberto.youtube}?autoplay=1&rel=0&modestbranding=1`}
                  title={`${aberto.titulo} — ${aberto.legenda}`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <img
                src={aberto.img}
                alt={`${aberto.titulo} — ${aberto.legenda}`}
                className="max-h-[78vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
            )}
            <figcaption className="mt-4 text-center text-white">
              <h3 className="font-display text-xl font-bold">{aberto.titulo}</h3>
              <p className="mt-1 text-sm text-white/70">{aberto.legenda}</p>
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/*
 * Teaser da galeria — fica no TOPO (logo após a faixa de números) para
 * fisgar o visitante cedo com prova visual (vídeo + fotos reais) e reduzir a
 * rejeição. Um vídeo abre e toca aqui mesmo; as fotos levam à galeria completa.
 */
function GaleriaDestaque() {
  const [aberto, setAberto] = useState(null);
  useLightboxKeys(aberto, setAberto);

  const destaque = GALERIA.find((g) => g.tipo === "video") || GALERIA[0];
  const tiles = GALERIA.filter((g) => g !== destaque).slice(0, 4);
  const irGaleria = () =>
    document.getElementById("galeria")?.scrollIntoView({ behavior: "smooth" });
  const abrir = (g) => (g.tipo === "video" ? setAberto(g) : irGaleria());

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-600">
            <Sparkles className="h-3.5 w-3.5" /> Projetos reais · Brasil
          </span>
          <h2 className="font-display text-2xl font-extrabold text-royal-950 sm:text-3xl">
            Veja usinas e instalações que já entregamos
          </h2>
          <p className="mt-2 text-royal-900/60">
            Prova real do nosso trabalho — usinas em operação, gerando resultado.
          </p>
        </div>

        {/* Destaque grande (vídeo ou foto principal) */}
        <Reveal>
          <button
            type="button"
            onClick={() => abrir(destaque)}
            aria-label={destaque.tipo === "video" ? `Assistir ao vídeo — ${destaque.titulo}` : "Abrir a galeria completa"}
            className="group relative block aspect-video w-full overflow-hidden rounded-3xl bg-royal-800 shadow-card transition-all duration-300 hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <img
              src={capaMidia(destaque)}
              alt={`${destaque.titulo} — ${destaque.legenda}`}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-royal-950/85 via-royal-950/25 to-transparent" />
            {destaque.tipo === "video" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500/95 text-royal-950 shadow-xl shadow-brand-500/40 transition-transform duration-300 group-hover:scale-110">
                  <Play className="h-9 w-9 translate-x-0.5 fill-current" />
                </span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 p-5 text-left text-white sm:p-6">
              <p className="font-display text-lg font-bold sm:text-xl">{destaque.titulo}</p>
              <p className="mt-0.5 text-sm text-white/75">{destaque.legenda}</p>
            </div>
          </button>
        </Reveal>

        {/* 4 miniaturas */}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {tiles.map((t, i) => {
            const ehVideo = t.tipo === "video";
            return (
              <Reveal key={t.titulo + i} delay={i * 0.06}>
                <button
                  type="button"
                  onClick={() => abrir(t)}
                  aria-label={ehVideo ? `Assistir ao vídeo — ${t.titulo}` : "Abrir a galeria completa"}
                  className="group relative block aspect-square w-full overflow-hidden rounded-2xl bg-royal-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <img
                    src={capaMidia(t)}
                    alt={`${t.titulo} — ${t.legenda}`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-royal-950/80 via-royal-950/15 to-transparent" />
                  {ehVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/95 text-royal-950 shadow-lg transition-transform duration-300 group-hover:scale-110">
                        <Play className="h-5 w-5 translate-x-0.5 fill-current" />
                      </span>
                    </div>
                  )}
                  <p className="absolute inset-x-0 bottom-0 p-2.5 text-left font-display text-xs font-bold text-white">
                    {t.titulo}
                  </p>
                </button>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={irGaleria}
            className="inline-flex items-center gap-2 rounded-full border-2 border-royal-200 bg-white px-7 py-3 font-bold text-royal-700 transition hover:border-royal-300 hover:bg-royal-50"
          >
            Ver galeria completa <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </Container>

      <LightboxMidia aberto={aberto} onClose={() => setAberto(null)} />
    </section>
  );
}

function Galeria() {
  const [filtro, setFiltro] = useState("Todos");
  const [aberto, setAberto] = useState(null);
  const lista =
    filtro === "Todos"
      ? GALERIA
      : filtro === "Fotos"
      ? GALERIA.filter((g) => g.tipo === "foto")
      : GALERIA.filter((g) => g.tipo === "video");

  useLightboxKeys(aberto, setAberto);

  return (
    <section id="galeria" className="bg-royal-50/50 py-20 sm:py-28">
      <Container>
        <SectionHead
          eyebrow="Galeria"
          title="Veja de perto o nosso trabalho"
          subtitle="Fotos e vídeos de usinas e plantas reais da Sousa Costa Energia — de telhados industriais às usinas de grande porte, em todo o Brasil."
        />

        {FILTROS_GALERIA.length > 1 && (
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {FILTROS_GALERIA.map((f) => (
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
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {lista.map((g, i) => {
            const ehVideo = g.tipo === "video";
            const capa = g.img || (ehVideo ? ytThumb(g.youtube) : undefined);
            return (
              <Reveal key={g.titulo + i} delay={(i % 4) * 0.06}>
                <button
                  type="button"
                  onClick={() => setAberto(g)}
                  aria-label={ehVideo ? `Assistir ao vídeo — ${g.titulo}` : `Ver foto ampliada — ${g.titulo}`}
                  className="group relative block aspect-square w-full overflow-hidden rounded-2xl bg-royal-800 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <img
                    src={capa}
                    alt={`${g.titulo} — ${g.legenda}`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-royal-950/85 via-royal-950/20 to-transparent" />

                  {/* Botão de play — só em vídeos */}
                  {ehVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/95 text-royal-950 shadow-xl shadow-brand-500/40 transition-transform duration-300 group-hover:scale-110">
                        <Play className="h-6 w-6 translate-x-0.5 fill-current" />
                      </span>
                    </div>
                  )}

                  {/* Etiqueta de tipo no canto */}
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-royal-700 opacity-0 shadow-lg backdrop-blur transition-all duration-300 group-hover:opacity-100">
                    {ehVideo ? <Play className="h-4 w-4 fill-current" /> : <ZoomIn className="h-4 w-4" />}
                  </span>

                  {/* Legenda */}
                  <div className="absolute inset-x-0 bottom-0 p-3 text-left text-white">
                    <p className="font-display text-sm font-bold leading-tight">{g.titulo}</p>
                    <p className="mt-0.5 text-xs text-white/70">{g.legenda}</p>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </Container>

      <LightboxMidia aberto={aberto} onClose={() => setAberto(null)} />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */
const FAQ = [
  {
    q: "A Sousa Costa atende em todo o Brasil?",
    a: "Sim. Atendemos empresas, indústrias e usinas em qualquer estado do Brasil — com sede no Rio Grande do Norte e equipes que se deslocam conforme o projeto, do diagnóstico à operação.",
  },
  {
    q: "Vocês atendem clientes residenciais?",
    a: "Nosso foco é exclusivamente empresarial: empresas, indústrias, proprietários de usinas e investidores. Não atendemos projetos residenciais para pessoa física.",
  },
  {
    q: "O que inclui o O&M e o plano de manutenção?",
    a: "Manutenção corretiva e preventiva, monitoramento 24/7, inspeções técnicas, termografia, lavagem especializada e relatórios de desempenho — em contratos recorrentes que protegem a geração e a vida útil da usina.",
  },
  {
    q: "Minha usina está gerando menos do que deveria. Vocês resolvem?",
    a: "Sim — esse é o nosso retrofit/repotenciação. Fazemos o diagnóstico (incluindo termografia), identificamos as perdas, modernizamos o que estiver defasado e devolvemos a usina à performance esperada.",
  },
  {
    q: "Fazem comissionamento de usinas construídas por outras empresas?",
    a: "Sim. Realizamos testes, inspeções e energização de usinas construídas por terceiros, com laudos e conformidade técnica para operação segura.",
  },
  {
    q: "O que é um sistema híbrido e o que é um BESS?",
    a: "O sistema híbrido une geração solar e baterias, garantindo energia para cargas críticas em quedas de rede. O BESS (Battery Energy Storage System) é o armazenamento para indústrias e grandes consumidores — corte de ponta, gestão de demanda e arbitragem de tarifa.",
  },
  {
    q: "Como funciona o investimento em usinas e ativos de energia?",
    a: "Apoiamos investidores do início ao fim: desenvolvimento de usinas para investimento, geração compartilhada e análise técnica para aquisição de ativos já em operação. Nossa equipe monta o plano conforme o seu objetivo.",
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
  "O&M / Plano de manutenção de usina",
  "Retrofit / Repotenciação de usina",
  "EPC — Construção de usina",
  "Comissionamento de usina",
  "Lavagem e termografia",
  "Sistema híbrido / BESS",
  "Energia solar para minha empresa",
  "Investimento / Aquisição de ativos",
];

const inputCls =
  "w-full rounded-xl border border-royal-200 bg-royal-50/40 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-200";

function Contato() {
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    interesse: INTERESSES[0],
    valorConta: "",
    mensagem: "",
    consentimento: false,
  });
  const [status, setStatus] = useState("idle"); // idle | sending | success | error

  const setField = (campo) => (e) => {
    const valor = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [campo]: valor }));
  };

  const textoWhats = () =>
    `Olá! Sou ${form.nome || "um interessado"}. ` +
    `Interesse: ${form.interesse}. ` +
    (Number(form.valorConta) ? `Conta média: ${brl(Number(form.valorConta))}. ` : "") +
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
      gclid: obterGclid(), // ID do clique do anúncio — para creditar a venda depois
    };

    const res = await enviarLead(payload);
    if (res.ok) {
      registrarConversao("formulario"); // conversão Google Ads: lead pelo formulário
      setStatus("success");
    } else {
      // Fallback: não perder o lead — abre o WhatsApp com os dados preenchidos.
      registrarConversao("whatsapp"); // conversão Google Ads: lead direcionado ao WhatsApp
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
                    WhatsApp · {CONTATO.whatsappExibicao}
                  </a>
                  <a href={`tel:+${CONTATO.telefone}`} className="flex items-center gap-3 hover:text-brand-300">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <Phone className="h-5 w-5" />
                    </span>
                    Ligações · {CONTATO.telefoneExibicao}
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
                        Conta de energia mensal (R$) — se for gerar
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={form.valorConta}
                        onChange={setField("valorConta")}
                        placeholder="15000"
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
                        placeholder="Conte sobre a usina ou a necessidade: porte (kWp/MW), cidade/UF, o desafio..."
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
            <img
              src="logo-sousa-costa-branca.png"
              alt="Sousa Costa Energia"
              className="h-14 w-auto sm:h-16"
            />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-royal-200">
              Engenharia de energia solar para empresas, indústrias e usinas em todo o Brasil: EPC, O&amp;M com planos
              de manutenção, retrofit, comissionamento, lavagem, termografia e armazenamento (BESS).
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
            <p className="font-display text-sm font-bold uppercase tracking-widest text-brand-400">Serviços</p>
            <ul className="mt-4 space-y-2.5 text-sm text-royal-200">
              <li>EPC — construção de usinas</li>
              <li>O&amp;M e planos de manutenção</li>
              <li>Retrofit e repotenciação</li>
              <li>Comissionamento</li>
              <li>Lavagem e termografia</li>
              <li>Híbrido e BESS</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-royal-300 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Sousa Costa LTDA · CNPJ 48.725.763/0001-26 · Rua Vitória, 17, Amarante — São
            Gonçalo do Amarante/RN
          </p>
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
  // Captura o GCLID do anúncio (se houver na URL) logo na entrada, para
  // creditar a venda ao anúncio certo quando o lead fechar no Reonic.
  useEffect(() => {
    capturarGclid();
  }, []);

  // Rastreia como conversão do Google Ads qualquer clique em link de WhatsApp
  // (wa.me) do site — CTAs, botão flutuante, cabeçalho, rodapé, etc.
  useEffect(() => {
    const onClick = (e) => {
      const alvo = e.target.closest && e.target.closest('a[href*="wa.me"]');
      if (alvo) registrarConversao("whatsapp");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-royal-50/40 to-white font-sans text-royal-950">
      <Header />
      <main>
        <Hero />
        <StatStrip />
        <GaleriaDestaque />
        <Solucoes />
        <Investimento />
        <ComoFunciona />
        <Projetos />
        <Diferenciais />
        <FaqSection />
        <Galeria />
        <Contato />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
