import React from "react";
import { motion } from "framer-motion";
import { Sun, Leaf, Shield, MessageCircle } from "lucide-react";

export default function App() {
  const whatsappNumber = "5585991740792";
  const whatsappMessage = "Olá! Tenho interesse nos serviços da Only Energia.";
  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="bg-amber-50 text-gray-800 font-sans scroll-smooth">
      <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-amber-600">Only Energia</h1>
          <div className="space-x-6 hidden md:flex">
            <a href="#sobre" className="hover:text-amber-600">Sobre</a>
            <a href="#servicos" className="hover:text-amber-600">Serviços</a>
            <a href="#contato" className="hover:text-amber-600">Contato</a>
          </div>
          <a
            href={whatsappURL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition"
          >
            Fale Conosco
          </a>
        </nav>
      </header>

      <main className="pt-24">
        <section className="container mx-auto px-4 text-center py-20">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-extrabold mb-6"
          >
            Energia Solar com Responsabilidade e Inovação
          </motion.h2>
          <p className="text-lg text-gray-600 mb-8">
            Sustentabilidade, economia e segurança para o seu futuro.
          </p>
          <a
            href={whatsappURL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-amber-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-amber-700 transition"
          >
            Solicite seu orçamento
          </a>
        </section>

        <section id="sobre" className="bg-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-6">Sobre Nós</h3>
            <p className="max-w-2xl mx-auto text-gray-600">
              A Only Energia é especializada em soluções de energia solar e sustentabilidade.
              Nosso compromisso é oferecer projetos eficientes, seguros e com o melhor custo-benefício.
            </p>
          </div>
        </section>

        <section id="servicos" className="py-20 bg-amber-100">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-12">Nossos Serviços</h3>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                { icon: <Sun size={48} />, title: "Energia Solar Residencial" },
                { icon: <Leaf size={48} />, title: "Soluções Sustentáveis" },
                { icon: <Shield size={48} />, title: "Projetos com ART" },
              ].map((servico, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-white rounded-2xl shadow-md p-8 hover:shadow-xl transition"
                >
                  <div className="flex justify-center text-amber-600 mb-4">
                    {servico.icon}
                  </div>
                  <h4 className="text-xl font-semibold mb-2">{servico.title}</h4>
                  <p className="text-gray-600">
                    Atendimento personalizado e foco em eficiência energética.
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="contato" className="bg-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-8">Fale Conosco</h3>
            <p className="text-gray-600 mb-8">
              Tire suas dúvidas ou solicite um orçamento sem compromisso.
            </p>
            <form
              action="https://formspree.io/f/seu-id"
              method="POST"
              className="max-w-lg mx-auto space-y-4"
            >
              <input
                type="text"
                name="name"
                placeholder="Seu nome"
                required
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="email"
                name="email"
                placeholder="Seu e-mail"
                required
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <textarea
                name="message"
                placeholder="Sua mensagem"
                required
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              ></textarea>
              <button
                type="submit"
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition"
              >
                Enviar
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-amber-600 text-white text-center py-6 mt-20">
        <p>© {new Date().getFullYear()} Only Energia - Todos os direitos reservados.</p>
        <div className="mt-2 flex justify-center gap-4">
          <a href="https://www.instagram.com/onlyenergia/" target="_blank" rel="noreferrer" aria-label="Instagram">
            <MessageCircle size={24} />
          </a>
        </div>
      </footer>
    </div>
  );
}
