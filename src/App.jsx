
import React, { useMemo, useEffect } from 'react';
import {
  ShieldCheck, Zap, Wrench, FileCheck, LineChart, Phone, Mail, MapPin, Clock,
  CheckCircle2, Gauge, PlugZap, Power, TrendingUp, Menu, X
} from 'lucide-react';
import { motion } from 'framer-motion';

const PHONE_CONTACT = "+5500000000000"; // TODO: WhatsApp oficial
const EMAIL_CONTACT = "contato@onlyenergia.com.br";
const LOGO_URL = "https://static.wixstatic.com/media/26d352_b0ca09e7d8814dc49dda331ef742df08~mv2.png";
const SITE_URL = "https://onlyenergia.com.br";

const Container = ({ children }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
);

const Section = ({ id, eyebrow, title, subtitle, children }) => (
  <motion.section
    id={id}
    className="py-16 sm:py-24"
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: true, amount: 0.1 }}
  >
    <Container>
      {(eyebrow || title || subtitle) && (
        <div className="mb-10 text-center">
          {eyebrow && <p className="text-sm uppercase tracking-widest text-brand-900/70">{eyebrow}</p>}
          {title && <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">{title}</h2>}
          {subtitle && <p className="mt-3 text-neutral-700 max-w-3xl mx-auto">{subtitle}</p>}
        </div>
      )}
      {children}
    </Container>
  </motion.section>
);

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  useEffect(() => {
    document.title = "Only Energia — Diagnóstico elétrico, laudos e manutenção solar";
  }, []);

  const whatsappLink = (msg) => {
    const defaultMsg = msg || "Olá! Quero um diagnóstico de qualidade de energia com a Only Energia.";
    const encodedMsg = encodeURIComponent(defaultMsg);
    return `https://wa.me/${PHONE_CONTACT.replace(/[^\d]/g, '')}?text=${encodedMsg}`;
  };

  const mainCtaWhatsappLink = useMemo(() => whatsappLink("Quero fazer um orçamento!"), []);

  const navLinks = [
    { name: 'Serviços', href: '#servicos' },
    { name: 'Como funciona', href: '#como-funciona' },
    { name: 'Planos', href: '#precos' },
    { name: 'Resultados', href: '#provas' },
    { name: 'Contato', href: '#contato' },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const scrollToSection = (e, href) => {
    e.preventDefault();
    const id = href.substring(1);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-yellow-50 to-white text-neutral-900 font-sans">
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-yellow-100/70">
        <Container>
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="Logo da Only Energia" className="h-9 md:h-11 w-auto object-contain shrink-0" />
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-800">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} onClick={(e) => scrollToSection(e, link.href)} className="hover:text-black transition">
                  {link.name}
                </a>
              ))}
            </nav>

            <a
              href={mainCtaWhatsappLink}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center rounded-full px-4 py-2 bg-black text-white font-semibold text-sm shadow-md hover:opacity-90 transition"
            >
              <Phone className="w-4 h-4 mr-2" /> Pedir Diagnóstico
            </a>

            <button className="md:hidden p-2 rounded-lg text-neutral-900 hover:bg-yellow-100 transition" onClick={toggleMenu} aria-label="Abrir menu">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </Container>

        <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 border-b border-yellow-100' : 'max-h-0'}`}>
          <nav className="flex flex-col p-4 space-y-2 bg-white/90">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} onClick={(e) => scrollToSection(e, link.href)} className="py-2 font-medium hover:text-black transition">
                {link.name}
              </a>
            ))}
            <a
              href={mainCtaWhatsappLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full px-4 py-2 mt-2 bg-black text-white font-semibold text-sm shadow-md hover:opacity-90 transition"
            >
              <Phone className="w-4 h-4 mr-2" /> Pedir Diagnóstico
            </a>
          </nav>
        </div>
      </header>

      <section className="pt-10 pb-20 sm:pt-20 sm:pb-32">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
                Energia que respeita <span className="text-gradient bg-gradient-to-r from-brand-600 to-yellow-400">seu negócio</span>
              </h1>
              <p className="mt-5 text-neutral-700 max-w-xl text-lg">
                Only Energia — medições com analisador, manutenção de usinas solares e laudos conforme PRODIST/ANEEL.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={mainCtaWhatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full px-6 py-3 bg-black text-white font-semibold shadow-lg hover:opacity-90 text-base transition duration-300"
                >
                  <Phone className="w-4 h-4 mr-2" /> Fazer orçamento
                </a>
                <a href="#precos" onClick={(e) => scrollToSection(e, '#precos')} className="inline-flex items-center rounded-full px-6 py-3 border border-yellow-300 bg-white text-neutral-900 font-medium hover:bg-yellow-50 text-base transition duration-300">
                  <TrendingUp className="w-4 h-4 mr-2" /> Ver Planos
                </a>
              </div>
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                {[
                  { icon: ShieldCheck, title: 'Laudos com ART', text: 'Validade contratual e segurança técnica.' },
                  { icon: LineChart, title: 'Relatórios claros', text: 'Gráficos e conclusão executiva.' },
                  { icon: Wrench, title: 'Correções sob medida', text: 'SPDs, aterramento e FP.' },
                ].map((item, index) => (
                  <motion.div key={index} className="flex gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.15 }}>
                    <div className="shrink-0 rounded-2xl p-3 bg-yellow-500/10">
                      <item.icon className="w-6 h-6 text-yellow-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                      <p className="text-sm text-neutral-700">{item.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div className="lg:justify-self-end w-full max-w-md mx-auto lg:mx-0" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="rounded-3xl shadow-2xl border border-yellow-100 bg-white p-8">
                <h3 className="text-2xl font-bold text-neutral-900">Diagnóstico em 3 etapas</h3>
                <p className="text-base text-neutral-600 mt-1">Rápido, objetivo e com evidências.</p>
                <ol className="mt-6 space-y-5 text-base text-neutral-900">
                  {[
                    { step: 1, title: 'Instalação do analisador', text: 'Medição ininterrupta por 48h a 7 dias, capturando todos os eventos de qualidade.' },
                    { step: 2, title: 'Comparação com norma', text: 'Análise de dados com os limites do PRODIST Módulo 8 (Tensão, THD) e DEC/FEC.' },
                    { step: 3, title: 'Laudo e plano de ação', text: 'Emissão de laudo detalhado, ART e recomendações de correção.' },
                  ].map((item) => (
                    <li key={item.step} className="flex gap-4">
                      <div className="shrink-0 text-yellow-600 font-extrabold text-2xl">{item.step}.</div>
                      <div>
                        <strong>{item.title}</strong>
                        <p className="text-sm text-neutral-700">{item.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      <Section id="servicos" eyebrow="O que fazemos" title="Serviços de diagnóstico e solução" subtitle="Qualidade de energia, usinas solares e medições profissionais para sua tranquilidade.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[
            { icon: Gauge, title: 'Qualidade da Tensão', text: 'Conformidade com PRODIST Mód. 8 (tensão em regime permanente).' },
            { icon: PlugZap, title: 'Perturbações Transientes', text: 'Registro de Quedas, Elevações e Interrupções (DEC/FEC com timestamps).' },
            { icon: Power, title: 'Fator de Potência', text: 'Medição de demanda reativa, diagnóstico e projeto de correção (bancos de capacitores).' },
            { icon: Wrench, title: 'SPDs e Aterramento', text: 'Instalação, manutenção e medição (Terrômetro) de Sistemas de Proteção Contra Descargas.' },
            { icon: FileCheck, title: 'Laudos Técnicos e ART', text: 'Documentação oficial para contestação, seguros e processos regulatórios.' },
            { icon: LineChart, title: 'Eficiência Solar (PR)', text: 'Análise de Performance Ratio (PR), diagnóstico de sombreamento, mismatch e perdas.' },
            { icon: ShieldCheck, title: 'Manutenção Preventiva Solar', text: 'Inspeções visuais, limpeza, reapertos, termografia e testes elétricos em usinas.' },
            { icon: TrendingUp, title: 'Análise de Harmônicas (THD)', text: 'Medição de distorção harmônica de tensão e corrente (THD) para conformidade e proteção de equipamentos.' },
          ].map((service, index) => (
            <motion.div
              key={service.title}
              className="rounded-xl border-t-4 border-yellow-500/60 border border-yellow-100 shadow-sm hover:shadow-lg transition-shadow p-6 bg-white/90"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <h3 className="flex items-center gap-3 text-lg font-bold text-neutral-900">
                <service.icon className="w-6 h-6 text-yellow-700" />
                {service.title}
              </h3>
              <p className="text-sm text-neutral-700 mt-2">{service.text}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section id="precos" eyebrow="Investimento Inteligente" title="Planos e Pacotes de Medição" subtitle="Valores médios de referência. Solicite proposta personalizada.">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Básico – Residencial/Comercial', subtitle: 'Para problemas pontuais.', price: 'R$ 600–1.200', cta: 'Contratar Básico', ctaMsg: 'Olá! Quero o pacote Básico de Diagnóstico.', features: ['Medição: 24h–48h', 'Análise de Tensão/Quedas', 'Laudo Técnico', 'Recomendação de Correção'], isFeatured: false
            },
            {
              title: 'Profissional – PME/Indústria', subtitle: 'Visão completa (mais popular).', price: 'R$ 1.500–3.500', cta: 'Contratar Profissional', ctaMsg: 'Quero contratar o Pacote Profissional para minha empresa.', features: ['Medição: 3–7 dias', 'Análise Completa (Tensão, Harmônicas, FP)', 'Laudo com ART (Opcional)', 'Suporte à Contestação'], isFeatured: true
            },
            {
              title: 'Monitoramento Contínuo', subtitle: 'Acompanhamento mensal.', price: 'R$ 500–2.000/mês', cta: 'Assinar Monitoramento', ctaMsg: 'Tenho interesse no serviço de Monitoramento Contínuo.', features: ['Medição Permanente', 'Relatórios Mensais de Performance', 'Suporte Prioritário', 'Acompanhamento de Normas (PRODIST/ANEEL)'], isFeatured: false
            },
          ].map((pkg, index) => (
            <motion.div
              key={pkg.title}
              className={`rounded-3xl p-8 ${pkg.isFeatured ? 'border border-black ring-4 ring-yellow-100 bg-yellow-50' : 'border border-yellow-200 bg-white/90'}`}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <h3 className={`text-xl font-bold ${pkg.isFeatured ? 'text-black' : 'text-neutral-900'}`}>{pkg.title}</h3>
              <p className="text-sm text-neutral-600 mt-1">{pkg.subtitle}</p>
              <p className="text-4xl font-extrabold text-neutral-900 mt-4">{pkg.price}</p>
              <div className="mt-6 space-y-2 text-sm">
                {pkg.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-neutral-900">
                    <CheckCircle2 className="w-4 h-4 text-yellow-600 shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
              <a
                href={whatsappLink(pkg.ctaMsg)}
                target="_blank"
                rel="noreferrer"
                className={`mt-8 w-full inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold text-white transition duration-300 ${pkg.isFeatured ? 'bg-black hover:opacity-90 shadow-xl' : 'bg-neutral-900 hover:opacity-90 shadow-md'}`}
              >
                {pkg.cta}
              </a>
              <p className="text-xs text-neutral-600 mt-3 text-center">Valores indicativos. Não incluem ART ou execução de obras.</p>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section id="provas" eyebrow="Impacto Comprovado" title="Resultados tangíveis e economia" subtitle="Laudos e ações técnicas com benefícios reais.">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: 'Zero queima de equipamentos', text: 'Correções de sobretensão e transientes eliminam queimas recorrentes.' },
            { icon: Power, title: 'Redução de multa reativa', text: 'Banco de capacitores após diagnóstico de baixo FP.' },
            { icon: FileCheck, title: 'Ressarcimento da distribuidora', text: 'Laudo comprovando DEC/FEC fora dos limites apoia compensação por danos.' },
          ].map((proof, index) => (
            <motion.div
              key={proof.title}
              className="rounded-xl border border-yellow-100 p-6 bg-white/90 shadow-md"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <proof.icon className="w-8 h-8 text-yellow-600 mb-3" />
              <h3 className="font-bold text-lg text-neutral-900">{proof.title}</h3>
              <p className="text-sm text-neutral-700 mt-1">{proof.text}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section id="contato" eyebrow="Fale Conosco" title="Solicite um diagnóstico ou orçamento" subtitle="Formulário para resposta rápida ou contato direto por WhatsApp.">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div className="rounded-3xl border border-yellow-100 p-8 bg-white/90 shadow-xl" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true, amount: 0.2 }}>
              <h3 className="text-xl font-bold text-neutral-900">Formulário de Contato</h3>
              <p className="text-sm text-neutral-600 mt-1">Detalhe o seu problema (ex: queima de lâmpadas, oscilação, manutenção solar).</p>
              <form action="https://formspree.io/f/your-id" method="POST" className="grid sm:grid-cols-2 gap-4 mt-6">
                <input name="nome" placeholder="Seu nome completo" required className="border border-yellow-200 rounded-lg px-4 py-3 focus:ring-yellow-500 focus:border-yellow-500 transition" />
                <input name="email" type="email" placeholder="Seu e-mail" required className="border border-yellow-200 rounded-lg px-4 py-3 focus:ring-yellow-500 focus:border-yellow-500 transition" defaultValue={EMAIL_CONTACT} />
                <input name="telefone" placeholder="Telefone/WhatsApp" className="border border-yellow-200 rounded-lg px-4 py-3 sm:col-span-2 focus:ring-yellow-500 focus:border-yellow-500 transition" />
                <textarea name="mensagem" placeholder="Descreva o problema ou serviço desejado em detalhes..." rows="4" className="border border-yellow-200 rounded-lg px-4 py-3 sm:col-span-2 focus:ring-yellow-500 focus:border-yellow-500 transition" required></textarea>
                <button type="submit" className="sm:col-span-2 inline-flex items-center justify-center rounded-full px-6 py-3 bg-black text-white font-semibold shadow-lg hover:opacity-90 transition duration-300">
                  Enviar Solicitação
                </button>
              </form>
              <p className="text-xs text-neutral-600 mt-3">Responderemos em até 1 dia útil.</p>
            </motion.div>
          </div>
          <div className="space-y-6">
            <motion.div className="rounded-3xl border border-yellow-100 p-6 bg-white/90 shadow-md" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true, amount: 0.2 }}>
              <h3 className="text-lg font-bold text-neutral-900">Informações de Contato</h3>
              <div className="space-y-3 text-sm text-neutral-700 mt-3">
                <a href={`tel:${PHONE_CONTACT}`} className="flex items-center gap-2 hover:text-black transition">
                  <Phone className="w-4 h-4 shrink-0" /> {PHONE_CONTACT}
                </a>
                <a href={`mailto:${EMAIL_CONTACT}`} className="flex items-center gap-2 hover:text-black transition">
                  <Mail className="w-4 h-4 shrink-0" /> {EMAIL_CONTACT}
                </a>
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" /> Brasil — atendimento nacional
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" /> Seg à Sex, das 9h às 18h
                </p>
              </div>
            </motion.div>
            <motion.div className="rounded-3xl border border-yellow-100 p-6 bg-white/90 shadow-md" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }} viewport={{ once: true, amount: 0.2 }}>
              <h3 className="text-lg font-bold text-neutral-900">Conformidade Técnica</h3>
              <p className="text-sm text-neutral-700 mt-2">Serviços baseados nas normas ANEEL/PRODIST e normas técnicas vigentes, com emissão de Anotação de Responsabilidade Técnica (ART).</p>
            </motion.div>
          </div>
        </div>
      </Section>

      <Section id="faq" eyebrow="Dúvidas Frequentes" title="Perguntas que costumamos responder">
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          {[
            { question: 'O que é o PRODIST Módulo 8?', answer: 'É a norma da ANEEL que define os padrões mínimos de qualidade da energia elétrica que as distribuidoras devem seguir, principalmente sobre níveis de tensão.' },
            { question: 'Qual equipamento é usado na medição?', answer: 'Utilizamos analisadores de qualidade de energia (power quality analyzers) com registro contínuo de parâmetros.' },
            { question: 'Vocês fazem a manutenção de usinas solares?', answer: 'Sim. Oferecemos inspeção, limpeza, reapertos, termografia e testes elétricos.' },
            { question: 'Atendem em outras cidades?', answer: 'Sim, atendimento nacional (consulte condições).' },
          ].map((faq, index) => (
            <motion.div key={index} className="rounded-xl border border-yellow-100 p-5 bg-white/90" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }} viewport={{ once: true, amount: 0.2 }}>
              <h4 className="font-bold text-neutral-900">{faq.question}</h4>
              <p className="text-neutral-700 mt-1">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      <footer className="border-t border-yellow-200/70 py-10 text-sm bg-white">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-neutral-600">© {new Date().getFullYear()} Only Energia. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4 text-neutral-700">
              <a className="hover:underline hover:text-black" onClick={(e) => scrollToSection(e, '#contato')} href="#contato">Política de Privacidade</a>
              <a className="hover:underline hover:text-black" onClick={(e) => scrollToSection(e, '#contato')} href="#contato">Termos de Serviço</a>
            </div>
          </div>
        </Container>
      </footer>

      <a
        href={mainCtaWhatsappLink}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full px-5 py-3 shadow-xl bg-black text-white font-semibold hover:opacity-90 transition duration-300 z-50"
        aria-label="Abrir conversa no WhatsApp"
      >
        <Phone className="w-5 h-5" /> Orçamento no WhatsApp
      </a>
    </div>
  );
}
