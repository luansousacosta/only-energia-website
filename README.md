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
- **Logo:** `public/logo-sousa-costa.png`.

## Integração do formulário com n8n → Reonic (CRM)
O formulário de contato envia o lead via **POST (JSON)** para um **Webhook do
n8n**, reaproveitando o mesmo fluxo de atendimento/qualificação já usado no
WhatsApp para criar o card no **Reonic**.

1. No n8n, adicione um nó **Webhook** (método `POST`) ao fluxo — ou crie um
   fluxo curto que chame o mesmo sub-fluxo de qualificação + criação de card no
   Reonic que o WhatsApp já usa.
2. Copie a **Production URL** do webhook.
3. Crie um arquivo `.env` na raiz (baseado em `.env.example`) com:
   ```
   VITE_N8N_WEBHOOK_URL="https://SEU-N8N/webhook/lead-site"
   ```
   No Netlify, defina a mesma variável em *Site settings → Environment variables*.
4. Rode `npm run build` para gerar o site com a URL configurada.

**Payload enviado ao webhook:**
```json
{
  "nome": "string",
  "telefone": "string",
  "email": "string",
  "interesse": "Energia solar residencial | Solar para empresa / indústria | Usina solar de investimento | Soluções inteligentes de energia",
  "valorConta": 600,
  "mensagem": "string",
  "consentimentoLGPD": true,
  "origem": "site-formulario",
  "paginaUrl": "https://..."
}
```

> Se o webhook não estiver configurado ou falhar, o formulário faz *fallback*
> abrindo o WhatsApp com os dados preenchidos — assim nenhum lead se perde.
> O campo **valorConta** já vem pré-preenchido pelo simulador de economia,
> ajudando a qualificação no Reonic.

## Deploy no Netlify
- Build command: `npm run build`
- Publish directory: `dist`

## Deploy no GitHub Pages
Use a ação oficial do Pages ou `vite` + `gh-pages`.
