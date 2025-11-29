import { Product } from "@/app/types"

type Props = {
    produtos: Product[];
    iniciarEdicao: (produto: Product) => void;
    excluir: (id: string) => Promise<void>;
    confirmarExclusao: (id: string) => void;
    modalDeletando: boolean;
    setModalDeletando: React.Dispatch<React.SetStateAction<boolean>>;
    produtoAlvo: string | null;
    setCadastrar: React.Dispatch<React.SetStateAction<boolean>>;
    sugerirPreco: (id: string) => Promise<void>;
    modalAberto: boolean;
    setModalAberto: React.Dispatch<React.SetStateAction<boolean>>
    loadingPreco: boolean
    aceitarPreco: () => Promise<void>
    precoSugerido: number | null
}

export default function Lista({
    produtos,
    excluir,
    confirmarExclusao,
    modalDeletando,
    setModalDeletando,
    produtoAlvo,
    setCadastrar,
    iniciarEdicao,
    sugerirPreco,
    modalAberto,
    setModalAberto,
    loadingPreco,
    aceitarPreco,
    precoSugerido,

}: Props) {
    const formatData = (data: string) => {
        const date = new Date(`${data}T00:00:00`);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    return (
        <>
            <section className="overflow-x-auto">
                <h2 className="text-xl font-bold text-cyan-400 mb-3 text-center">
                    Lista de Produtos
                </h2>
                <table className="min-w-full border border-slate-700 text-sm rounded-md overflow-hidden">
                    <thead className="bg-slate-800 text-cyan-400 uppercase text-xs">
                        <tr>
                            <th className="p-3 border border-slate-700">Nome</th>
                            <th className="p-3 border border-slate-700">Preço</th>
                            <th className="p-3 border border-slate-700">Validade</th>
                            <th className="p-3 border border-slate-700">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {produtos.length > 0 ? produtos.map((p: Product) => (
                            <tr
                                key={p.id}
                                className="odd:bg-slate-900 even:bg-slate-800 hover:bg-slate-700 transition"
                            >
                                <td className="p-3">{p.nome}</td>
                                <td className="p-3">R$ {Number(p.preco).toFixed(2)}</td>
                                <td className="p-3">{formatData(p.validade)}</td>
                                <td className="p-3 flex flex-col sm:flex-row gap-2 justify-center">
                                    <button
                                        onClick={() => confirmarExclusao(p.id)}
                                        className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded-md text-xs"
                                    >
                                        Excluir
                                    </button>
                                    {modalDeletando && produtoAlvo === p.id && (
                                        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
                                            <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-sm w-[90%] text-center">
                                                <h2 className="text-lg font-bold mb-3 text-red-400">⚠️ Confirmar Exclusão</h2>
                                                <p className="text-slate-300 mb-5">
                                                    Tem certeza que deseja excluir o produto{" "}
                                                    <span className="font-semibold text-white">{p.nome}</span>?
                                                    <br />
                                                    Essa ação não poderá ser desfeita.
                                                </p>

                                                <div className="flex justify-center gap-4">
                                                    <button
                                                        onClick={() => excluir(p.id)}
                                                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md font-semibold transition"
                                                    >
                                                        ✅ Confirmar
                                                    </button>

                                                    <button
                                                        onClick={() => setModalDeletando(false)}
                                                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md font-semibold transition"
                                                    >
                                                        ❌ Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => {
                                            iniciarEdicao(p)
                                            setCadastrar(true)
                                        }}
                                        className="bg-yellow-600 hover:bg-yellow-500 px-3 py-1 rounded-md text-xs"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => sugerirPreco(p.id)}
                                        className="bg-cyan-600 hover:bg-cyan-500 px-3 py-1 rounded-md text-xs"
                                    >
                                        IA
                                    </button>
                                </td>
                            </tr>
                        )) :
                            <tr>
                                <td colSpan={5} className="p-3 text-center">
                                    Nenhum produto cadastrado.
                                </td>
                            </tr>
                        }
                    </tbody>
                </table>
            </section>

            {modalAberto && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
                    <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-sm text-center text-white">
                        {loadingPreco ? (
                            <h2 className="text-lg font-semibold animate-pulse text-cyan-400">
                                Calculando preço sugerido...
                            </h2>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold mb-2 text-cyan-400">
                                    💰 Preço sugerido
                                </h2>
                                <p className="mb-4">
                                    <b>Novo preço:</b> R$ {precoSugerido}
                                </p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={aceitarPreco}
                                        className="bg-green-600 hover:bg-green-500 px-3 py-2 rounded-md font-semibold"
                                    >
                                        Aceitar
                                    </button>
                                    <button
                                        onClick={() => setModalAberto(false)}
                                        className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded-md font-semibold"
                                    >
                                        Rejeitar
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}