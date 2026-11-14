# Forge Delivery

App web de delivery de comida (mobile-first), em React 19 + TypeScript + Vite + Tailwind 4.

## Funcionalidades

- Lista de restaurantes com busca (por nome ou prato, ignorando acentos) e filtro por categoria
- Cardápio com controle de quantidade (máx. 20 por item)
- Carrinho de um restaurante por vez, com confirmação ao trocar de restaurante
- Pedido mínimo por restaurante, taxa de entrega e cupons:
  - `BEMVINDO10` — 10% de desconto (a partir de R$ 20,00)
  - `FRETEGRATIS` — entrega grátis (a partir de R$ 30,00)
  - `DESCONTO15` — R$ 15,00 de desconto (a partir de R$ 60,00)
- Checkout com validação (nome, telefone, CEP, endereço), máscaras e pagamento por Pix, cartão ou dinheiro com troco
- Acompanhamento do pedido com status simulado (confirmado → em preparo → a caminho → entregue)
- Histórico de pedidos, carrinho e dados do cliente salvos no `localStorage` (dados corrompidos são descartados com segurança)

## Como rodar

```bash
cd delivery-app
npm install
npm run dev        # desenvolvimento
npm test           # testes unitários
npm run build      # typecheck + build de produção em dist/
```

## Decisões para evitar erros

- Todos os valores em **centavos inteiros** (sem erro de ponto flutuante).
- Regras de negócio em `src/lib/` como funções puras, cobertas por testes.
- TypeScript em modo estrito com `noUncheckedIndexedAccess`.
- Proteção contra pedido duplicado (clique duplo no botão de finalizar).

> Os dados de restaurantes são de exemplo e os pedidos não são enviados a um servidor — o próximo passo seria conectar um backend (ex.: Supabase) para pedidos e pagamentos reais.
