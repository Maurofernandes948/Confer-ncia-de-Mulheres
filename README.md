# Clone — Ticket.ao: Conferência de Mulheres – Mulheres com Propósito

Réplica do site de referência:
https://ticket-ao-projeto-de-mulheres-bonitas-com-proposito.vercel.app

## Como executar

```bash
npm start
```

Depois abrir: http://localhost:3000

## Páginas

| Ficheiro | Rota | Conteúdo |
|---|---|---|
| `public/index.html` | `/` | Página do evento (hero, capa, sidebar, descrição, ingressos, rodapé) |
| `public/checkout.html` | `/checkout.html?qty=N` | Formulário de dados + geração de referência Multicaixa |
| `public/referencia.html` | `/referencia.html?...` | Entidade/Referência Multicaixa + instruções + polling |

## Assets (idênticos ao original, byte a byte)

- `public/ticket-ao-logo.webp` — logo no cabeçalho
- `public/capa.jpg` — cartaz do evento (1131×1391)
- `public/pagamentoreferencia.png` — ícone Multicaixa Express

## Fonte

Rubik (300/400/500/600/700) via Google Fonts — igual ao original.

## Cores

Definidas em `:root` de cada página:

```
--pri:#ff3300   --pri-h:#e62e00   --dk:#1a1a2e   --tx:#17161a
--tx2:#484848  --txm:#888        --bg:#f5f5f5   --wh:#fff
--bd:#e0e0e0   --ok:#25d366      --sh:0 2px 12px rgba(0,0,0,.08)   --r:4px
```

## API

`server.js` replica o contrato do endpoint `/api/charges` do site original:

- `POST /api/charges` → `{ id, amount, method, status, reference, entity }`
- `GET /api/charges/:id` → `{ id, amount, method, status }` (`404 {"error":"Cobrança não encontrada"}` se inexistente)

Armazenamento em memória, com expiração automática de referências pendentes.

## Notas de fidelidade

As três páginas HTML são **byte a byte idênticas** ao site original (SHA-256 conferido).
Nenhum CSS, texto, cor, espaçamento, imagem ou animação foi alterado.

Comportamentos do original preservados tal como estão, sem "correções":

- No mobile, o overlay (`z-index:150`) tapa o drawer de navegação (`z-index:200` dentro
  de um `header` com `position:sticky; z-index:100`), por isso o **X de fechar e os links do
  menu não recebem clique** — o menu fecha pelo overlay ou programaticamente. Idêntico no original.
- O cabeçalho `<footer class="ft">` está definido com `display:none` no breakpoint `max-width:900px`,
  logo o rodapé não aparece em tablet/mobile. Idêntico no original.
- O total calculado por JS usa `toLocaleString('pt-PT')` → `Kz 5500` / `Kz 11 000`, enquanto o
  texto estático diz `Kz 5.500`. Idêntico no original.

A única diferença inerente ao clone: o `id` devolvido pela API é gerado localmente
(o original delega ao gateway Multicaixa Express), mantendo o mesmo formato de contrato.