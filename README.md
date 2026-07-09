# Sousa Costa Energia — Site institucional

Site moderno para a **Sousa Costa Energia** — energias renováveis e soluções
inteligentes de energia. Construído em **React + Vite + Tailwind CSS** com
animações em **Framer Motion**.

Paleta da marca: **verde-limão `#9AD52A`** + **índigo `#3E4095`**.

## Destaques de experiência do cliente
- **Simulador de economia interativo** — o visitante arrasta o valor da conta de
  luz e vê, em tempo real e animado, a economia por mês, por ano e em 25 anos
  (com equivalência em árvores plantadas).
- **Seção de usina de investimento** — apresenta o modelo de renda passiva com
  cotas de geração solar.
- Navegação com *scrollspy*, menu mobile animado, FAQ em acordeão, contadores
  animados, depoimentos e botão flutuante de WhatsApp.
- SEO, Open Graph, favicon próprio e fontes Inter + Sora.

## Como rodar
```bash
npm install
npm run dev
```

## Build de produção
```bash
npm run build      # gera a pasta dist/
npm run preview    # pré-visualiza o build
```

## Configuração rápida
- **Contato / WhatsApp / e-mail / redes:** edite o objeto `CONTATO` no topo de
  `src/App.jsx`.
- **Formulário:** o `action` do formulário em `Contato` aponta para o Formspree
  (`https://formspree.io/f/seu-id`) — substitua `seu-id` pelo seu endpoint.
- **Logo:** `public/logo-sousa-costa.png`.

## Deploy no Netlify
- Build command: `npm run build`
- Publish directory: `dist`

## Deploy no GitHub Pages
Use a ação oficial do Pages ou `vite` + `gh-pages`.
