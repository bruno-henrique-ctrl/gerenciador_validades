import { NextResponse } from "next/server";
import { redis } from "@/utils/db";
import { Product } from "@/app/types";
import { sugerirPreco } from "@/utils/ia";
import webpush from "web-push";

webpush.setVapidDetails(
    "mailto:admin@seusite.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function GET() {
    const ids = await redis.lrange("produtos:list", 0, -1);
    const produtos: Product[] = [];

    for (const id of ids) {
        const dados = await redis.hgetall<Product>(`produto:${id}`);

        if (!dados) continue;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, ...resto } = dados;

        produtos.push({
            id,
            ...resto,
        });
    }

    if (produtos.length === 0) {
        return NextResponse.json(
            { error: "Nenhum produto cadastrado" },
            { status: 404 }
        );
    }

    produtos.sort((a, b) => new Date(a.validade).getTime() - new Date(b.validade).getTime());

    const maisProximo = produtos[0];
    const precoSugerido = await sugerirPreco(maisProximo);

    const subs = await redis.lrange("push:subscribers", 0, -1);

    const payload = JSON.stringify({
        title: "Produto próximo da validade!",
        body: `${maisProximo.nome} vence em ${maisProximo.validade}\nPreço sugerido: R$ ${precoSugerido}`,
    });

    for (const rawSub of subs) {
        const subscription = JSON.parse(rawSub);

        try {
            await webpush.sendNotification(subscription, payload);
        } catch (err) {
            console.log("❌ Erro ao enviar push:", err);
        }
    }

    return NextResponse.json({
        message: "Cron job executado com sucesso e notificações enviadas",
        produto: maisProximo,
        precoSugerido
    });
}
