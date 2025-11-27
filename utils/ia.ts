import OpenAI from "openai";
import type { Product } from "@/app/types";

const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_KEY,
});

export async function sugerirPreco(produto: Product) {
    const hoje = new Date().toISOString().split("T")[0];

    const prompt = `
        Você é um sistema de precificação automática para produtos perecíveis. 
        Calcule um novo preço recomendado com base em:

        - Nome: ${produto.nome}
        - Preço atual: ${produto.preco}
        - Quantidade em estoque: ${produto.quantidade}
        - Validade: ${produto.validade}
        - Data de hoje: ${hoje}

        Critérios obrigatórios:
        - Quanto menor o número de dias restantes até vencer, maior deve ser o desconto.
        - Estoque alto acelera o desconto; estoque baixo reduz ou elimina o desconto.
        - O preço final não pode ser negativo ou zero.
        - Responda APENAS com um número (ex: 12.49). Nada além disso.

        Retorne somente o novo preço sugerido.
    `.trim();

    try {
        const apiResponse = await client.chat.completions.create({
            model: "x-ai/grok-4.1-fast:free",
            messages: [{ role: "user", content: prompt }],
        });

        let content = apiResponse.choices[0].message.content;

        if (Array.isArray(content)) content = content.join("");

        if (!content) throw new Error("Resposta vazia da IA");

        const numero = parseFloat(
            content.replace(/[^\d.,-]/g, "").replace(",", ".")
        );

        if (isNaN(numero)) {
            console.error("Conteúdo retornado:", content);
            throw new Error("A IA não retornou um número válido.");
        }

        return numero;
    } catch (error) {
        console.error("Erro no sugerirPreco:", error);
        throw error;
    }
}
