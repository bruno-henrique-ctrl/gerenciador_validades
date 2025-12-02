import { Product } from "@/app/types";
import { redis } from "@/utils/db";
import { randomUUID } from "crypto";

export async function GET() {
    const ids = await redis.lrange("produtos:list", 0, -1);

    const produtos: Product[] = [];
    const hoje = new Date();

    for (const id of ids) {
        const dados = await redis.hgetall<Product>(`produto:${id}`);

        if (!dados) continue;

        const validade = new Date(dados.validade);

        if (validade < hoje) {
            await redis.del(`produto:${id}`);
            await redis.lrem("produtos:list", 0, id);
            continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, ...resto } = dados;

        produtos.push({
            id,
            ...resto,
        });
    }

    if (!produtos) {
        return Response.json(
            { error: "Nenhum produto cadastrado" },
            { status: 404 }
        );
    }

    produtos.sort((a, b) => new Date(a.validade).getTime() - new Date(b.validade).getTime());

    return Response.json(produtos);
}

export async function POST(req: Request) {
    const data = await req.json();
    const id = randomUUID();

    await redis.hmset(`produto:${id}`, {
        ...data
    });

    await redis.lpush("produtos:list", id);

    return Response.json({ id, ...data });
}

