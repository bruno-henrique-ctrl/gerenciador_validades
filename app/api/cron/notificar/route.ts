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

    const hoje = new Date();
    const hojeStr = hoje.toISOString().split("T")[0];

    // 🟥 Produtos que vencem HOJE
    const venceHoje = produtos.filter((p) => {
        const validadeStr = new Date(p.validade).toISOString().split("T")[0];
        return validadeStr === hojeStr;
    });

    // 🟧 Produtos que vencem em até 7 dias
    const proximos = produtos.filter((p) => {
        const validade = new Date(`${p.validade}T00:00:00`);
        const diff = validade.getTime() - hoje.getTime();
        const dias = diff / (1000 * 60 * 60 * 24);
        return dias > 0 && dias <= 7;
    });

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

    console.log(`📦 Enviando notificações: ${venceHoje.length} vencem hoje, ${proximos.length} próximos.`);

    // 🟥 Notificações de produtos que vencem HOJE
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
                        console.log(`✔️ Push enviado: ${produto.nome} (vence hoje)`);
                    } catch (err) {
                        console.error("❌ Erro ao enviar push:", err);
                    }
                })
            );
        })
    );

    // 🟧 Notificações de produtos que vencem em até 7 dias
    await Promise.all(
        proximos.map(async (produto) => {
            const precoSugerido = await sugerirPreco(produto);
            const payload = JSON.stringify({
                title: `🟠 ${produto.nome} está próximo da validade!`,
                body: `Vence em ${new Date(produto.validade).toLocaleDateString("pt-BR")}.\nPreço sugerido: R$ ${precoSugerido}`,
            });

            await Promise.all(
                subscribers.map(async (sub) => {
                    try {
                        await webpush.sendNotification(sub, payload);
                        console.log(`✔️ Push enviado: ${produto.nome} (vence em breve)`);
                    } catch (err) {
                        console.error("❌ Erro ao enviar push:", err);
                    }
                })
            );
        })
    );

    return NextResponse.json({
        ok: true,
        message: `Notificações enviadas — ${venceHoje.length} vencem hoje, ${proximos.length} próximos.`,
    });
}
