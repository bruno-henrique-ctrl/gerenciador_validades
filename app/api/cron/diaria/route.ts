import { NextResponse } from "next/server";
import { redis } from "@/utils/db";
import { Product } from "@/app/types";
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

        const { id: _, ...resto } = dados;
        produtos.push({ id, ...resto });
    }

    if (produtos.length === 0) {
        return NextResponse.json({ error: "Nenhum produto cadastrado" }, { status: 404 });
    }

    const hojeStr = new Date().toISOString().split("T")[0];

    const venceHoje = produtos.filter((p) => {
        const validadeStr = new Date(p.validade).toISOString().split("T")[0];
        return validadeStr === hojeStr;
    });

    if (venceHoje.length === 0) {
        return NextResponse.json({ ok: true, message: "Nenhum produto vence hoje." });
    }

    const rawSubscribers = await redis.lrange("push:subscribers", 0, -1);
    const subscribers = rawSubscribers
        .map((item) => {
            try {
                return typeof item === "string" ? JSON.parse(item) : item;
            } catch {
                console.warn("❌ Assinatura inválida:", item);
                return null;
            }
        })
        .filter(Boolean) as SavedSubscription[];

    if (subscribers.length === 0) {
        return NextResponse.json({ ok: false, message: "Nenhum assinante de push encontrado." });
    }

    console.log("📦 Produtos vencendo hoje:", venceHoje.map((p) => p.nome).join(", "));

    await Promise.all(
        venceHoje.map(async (produto) => {
            const payload = JSON.stringify({
                title: `⚠️ ${produto.nome} vence hoje!`,
                body: `O produto ${produto.nome} vence hoje. Atualize o preço ou remova-o do estoque.`,
            });

            await Promise.all(
                subscribers.map(async (sub) => {
                    try {
                        await webpush.sendNotification(sub, payload);
                        console.log(`✔️ Push enviado sobre ${produto.nome}`);
                    } catch (err) {
                        console.error("❌ Erro ao enviar push:", err);
                    }
                })
            );
        })
    );

    return NextResponse.json({
        ok: true,
        message: `Notificações enviadas para ${venceHoje.length} produtos.`,
    });
}
