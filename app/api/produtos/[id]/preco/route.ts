import { Product } from "@/app/types";
import { redis } from "@/utils/db";
import { sugerirPreco } from "@/utils/ia";

export async function POST(
    req: Request,
    ctx: { params: Promise<{ id: string }> }
) {
    const { id } = await ctx.params;
    const produto = await redis.hgetall<Product>(`produto:${id}`);

    if (!produto)
        return Response.json({ error: "Produto não encontrado" }, { status: 404 });

    const novoPreco = await sugerirPreco(produto);

    return Response.json({ novoPreco: novoPreco });
}