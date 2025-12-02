# 🌡️ Gerenciador de Validades
***Sistema criado para o mercado onde trabalhei, com o objetivo de facilitar o controle de validades de produtos alimentícios.***

---

## 🚀 Tecnologias utilizadas

- Next.js (com suporte PWA)
- Typescript
- TailwindCSS
- API da OpenAI (OpenRouter com Glok)
- Web Push Notifications
- Upstash (Redis)
- Vercel (Hospedagem e Cron para notificacoes)

--- 

## ▶️ Como rodar o projeto
```sh
npm install
npm run dev
```

---

## 📦 Funcionalidades
- Cadastro de produtos
- Inserir nome, preço e data de validade
- Listagem organizada
- Produtos exibidos ordenados pela data mais próxima do vencimento
- Sugestão de preço inteligente

O sistema sugere um novo valor com base:
- no preço atual
- na proximidade da validade
- no nível de urgência de venda

---

## 🔔 Notificações automáticas (Diarias)

WebPush com alertas sobre:
- Os 7 produtos mais próximos de vencer
- O produto que vence no dia
- Limpeza automática de produtos vencidos
- Produtos com validade inferior à data atual são automaticamente removidos do sistema.

---

## 📱 Interface
<img width="403" height="583" alt="print" src="https://github.com/user-attachments/assets/85803110-27b3-41e6-bc27-cf8184774455" />

---

## 🌐 Link do projeto (Vercel)

### 👉 https://gerenciador-validades.vercel.app/
