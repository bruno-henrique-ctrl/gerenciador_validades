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
    // 🔹 Recupera todos os produtos do Redis
    const ids = await redis.lrange("produtos:list", 0, -1);
    const produtos: Product[] = [];

    for (const id of ids) {
        const dados = await redis.hgetall<Product>(`produto:${id}`);
        if (!dados) continue;

        const { id: _, ...resto } = dados;
        produtos.push({ id: _, ...resto });
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

    if (proximos.length === 0) {
        return NextResponse.json({ ok: true, message: "Nenhum produto perto da validade." });
    }

    // 🔹 Lê assinaturas
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

    console.log(`📦 Enviando alertas para ${proximos.length} produtos...`);

    // 🔹 Processa notificações em paralelo
    await Promise.all(
        proximos.map(async (produto) => {
            const precoSugerido = await sugerirPreco(produto);

            const payload = JSON.stringify({
                title: `⚠️ ${produto.nome} está próximo da validade!`,
                body: `Vence em ${new Date(produto.validade).toLocaleDateString("pt-BR")}.\nPreço sugerido: R$ ${precoSugerido}`,
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
        message: `Notificações enviadas para ${proximos.length} produtos.`,
    });
}
