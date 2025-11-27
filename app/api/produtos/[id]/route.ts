import { Product } from "@/app/types";
import { redis } from "@/utils/db";

export async function GET(
    req: Request,
    ctx: { params: Promise<{ id: string }> }
) {
    const { id } = await ctx.params;
    const produto = await redis.hgetall<Product>(`produto:${id}`);

    if (!produto)
        return Response.json({ error: "Produto não encontrado" }, { status: 404 });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...resto } = produto;

    return Response.json({ id: id, ...resto });
}

export async function PUT(
    req: Request,
    ctx: { params: Promise<{ id: string }> }
) {
    const { id } = await ctx.params;
    const data = await req.json();

    await redis.hmset(`produto:${id}`, data);

    return Response.json({ id, ...data });
}

export async function DELETE(
    req: Request,
    ctx: { params: Promise<{ id: string }> }
) {
    const { id } = await ctx.params;
    await redis.del(`produto:${id}`);

    // Remover o id do array e garante que ele seja removido
    await redis.lrem("produtos:list", 0, id);

    return Response.json({ id });
}
