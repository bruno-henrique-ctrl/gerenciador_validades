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
        const { id: _, ...resto } = dados;
        produtos.push({ id, ...resto });
    }

    if (produtos.length === 0) {
        return NextResponse.json({ error: "Nenhum produto cadastrado" }, { status: 404 });
    }

    produtos.sort((a, b) =>
        new Date(a.validade).getTime() - new Date(b.validade).getTime()
    );

    const hoje = new Date();

    const proximos = produtos.filter((p) => {
        const validade = new Date(`${p.validade}T00:00:00`);
        const diff = validade.getTime() - hoje.getTime();
        const dias = diff / (1000 * 60 * 60 * 24);
        return dias <= 15 && dias >= 0;
    });

    const maisProximo = produtos[0];
    const precoSugerido = await sugerirPreco(maisProximo);

    const rawSubscribers = await redis.lrange("push:subscribers", 0, -1);

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

    const count = proximos.length;
    const nomes = proximos.map((p) => p.nome).join(", ") || "nenhum produto";

    const payload = JSON.stringify({
        title: "⚠️ Produtos próximos da validade!",
        body:
            count > 0
                ? `${count} produto(s) vencendo em até 15 dias: ${nomes}\nProduto mais urgente: ${maisProximo.nome} (${maisProximo.validade})\n💰 Preço sugerido: R$ ${precoSugerido}`
                : `Nenhum produto vencendo nos próximos 15 dias.`,
    });

    console.log("📦 Enviando notificação para", subscribers.length, "usuários...");
    console.log("➡️ Produtos próximos da validade:", proximos.map(p => p.nome));

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
            console.log("✔️ Push enviado para:", subscription.endpoint);
        } catch (err) {
            console.error("❌ Erro ao enviar push:", err);
        }
    }

    return NextResponse.json({
        ok: true,
        message: "Notificações enviadas!",
        proximos: proximos.map(p => ({ nome: p.nome, validade: p.validade })),
        total: count,
        produtoMaisProximo: maisProximo,
        precoSugerido,
    });
}
