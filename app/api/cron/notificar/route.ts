import { NextResponse } from "next/server";
import { redis } from "@/utils/db";
import { Product } from "@/app/types";
import { sugerirPreco } from "@/utils/ia";
import webpush from "web-push";

interface SavedSubscription {
    endpoint: string;
    expirationTime: number | null;
    keys: {
        p256dh: string;
        auth: string;
    };
}

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
        const { id: _id, ...resto } = dados;
        produtos.push({ id, ...resto });
    }

    if (produtos.length === 0) {
        return NextResponse.json({ error: "Nenhum produto cadastrado" }, { status: 404 });
    }

    produtos.sort((a, b) =>
        new Date(a.validade).getTime() - new Date(b.validade).getTime()
    );

    const maisProximo = produtos[0];
    const precoSugerido = await sugerirPreco(maisProximo);

    const rawSubscribers = await redis.lrange("push:subscribers", 0, -1);
    console.log("SUBSCRIBERS SALVOS (RAW):", rawSubscribers);

    const subscribers = rawSubscribers
        .map((item) => {
            if (typeof item === "string") {
                try {
                    return JSON.parse(item);
                } catch {
                    console.log("❌ Item inválido no Redis:", item);
                    return null;
                }
            }
            return item;
        })
        .filter(Boolean);

    const payload = JSON.stringify({
        title: "Produto próximo da validade!",
        body: `${maisProximo.nome} vence em ${maisProximo.validade}\nNovo preço sugerido: R$ ${precoSugerido}`,
    });

    console.log("🔥 sgora le eessa merda!");
    console.log("▶️ Produto escolhido:", maisProximo.nome);
    console.log("▶️ Enviando push para", subscribers.length, "usuários");

    for (const sub of subscribers) {
        const subscription: SavedSubscription = {
            endpoint: sub.endpoint,
            expirationTime: sub.expirationTime ?? null,
            keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
            },
        };

        try {
            await webpush.sendNotification(subscription, payload);
            console.log("✔️ Push enviado:", subscription.endpoint);
        } catch (err) {
            console.log("❌ Erro no push:", err);
        }
    }

    return NextResponse.json({
        ok: true,
        message: "Notificações enviadas!",
        produto: maisProximo,
        precoSugerido
    });
}
