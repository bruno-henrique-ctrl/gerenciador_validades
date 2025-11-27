import { Product } from "@/app/types";
import { redis } from "@/utils/db";

export async function GET() {
    const ids = await redis.lrange<Product[]>("produtos:list", 0, -1);

    const produtos = [];
    for (const id of ids) {
        const p = await redis.hgetall(`produto:${id}`);
        if (!p) continue;

        const dias = Math.ceil(
            (new Date(p.validade as number).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );

        if (dias <= 7) {
            produtos.push({ id, ...p, dias });
        }
    }

    return Response.json(
        produtos.sort((a, b) => a.dias - b.dias)
    );
}
