import { NextResponse } from "next/server";
import { redis } from "@/utils/db";
import { Product } from "@/app/types";
import { sugerirPreco } from "@/utils/ia";

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
        return Response.json(
            { error: "Nenhum produto cadastrado" },
            { status: 404 }
        );
    }

    produtos.sort((a, b) => new Date(a.validade).getTime() - new Date(b.validade).getTime());

    const maisProximo = produtos[0];
    const precoSugerido = await sugerirPreco(maisProximo);

    return NextResponse.json({
        message: "Cron job executado com sucesso",
        produto: maisProximo,
        precoSugerido: precoSugerido
    });
}
