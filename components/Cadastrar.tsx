import React from "react";

type FormData = {
    nome: string;
    preco: string;
    validade: string;
}

type CadastrarProps = {
    form: FormData;
    cadastrar: boolean;
    setCadastrar: React.Dispatch<React.SetStateAction<boolean>>;
    setForm: React.Dispatch<React.SetStateAction<FormData>>;
    editId: string | null;
    setEditId: React.Dispatch<React.SetStateAction<string | null>>;
    carregar: () => Promise<void>;
    salvarEdicao: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    criarProduto: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export default function Cadastrar({
    cadastrar,
    setCadastrar,
    form,
    setForm,
    editId,
    setEditId,
    salvarEdicao,
    criarProduto,
}: CadastrarProps) {

    return (
        <>
            {cadastrar ? (
                <section className="bg-slate-800 rounded-lg p-4 mb-6 shadow-md max-w-lg mx-auto w-full relative">
                    <h2 className="text-lg font-semibold text-center mb-3 text-cyan-400">
                        {editId ? "✏️ Editar Produto" : "🆕 Cadastrar Produto"}
                    </h2>

                    <button
                        onClick={() => setCadastrar(false)}
                        className="absolute top-3 right-3 text-slate-400 hover:text-red-500 text-2xl font-bold transition"
                        aria-label="Fechar modal"
                    >
                        &times;
                    </button>

                    <form
                        onSubmit={editId ? salvarEdicao : criarProduto}
                        className="flex flex-col gap-3"
                    >
                        <label htmlFor="nome" className="sr-only">
                            Nome
                        </label>
                        <input
                            id="nome"
                            type="text"
                            placeholder="Nome"
                            className="p-2 rounded-md bg-slate-700 text-white focus:ring-2 focus:ring-cyan-500"
                            value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                            required
                        />

                        <label htmlFor="preco" className="sr-only">
                            Preço
                        </label>
                        <input
                            id="preco"
                            type="number"
                            placeholder="Preço"
                            className="p-2 rounded-md bg-slate-700 text-white focus:ring-2 focus:ring-cyan-500"
                            value={form.preco}
                            onChange={(e) => setForm({ ...form, preco: e.target.value })}
                            required
                        />

                        <label htmlFor="validade" className="sr-only">
                            Data de validade
                        </label>
                        <input
                            id="validade"
                            type="date"
                            className="p-2 rounded-md bg-slate-700 text-white focus:ring-2 focus:ring-cyan-500"
                            value={form.validade}
                            onChange={(e) => setForm({ ...form, validade: e.target.value })}
                            required
                        />

                        <div className="flex gap-3 justify-center mt-2">
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 rounded-md font-semibold hover:opacity-90 transition"
                            >
                                {editId ? "Salvar" : "Criar"}
                            </button>
                            {(editId || cadastrar) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditId(null);
                                        setForm({
                                            nome: "",
                                            preco: "",
                                            validade: "",
                                        });
                                        setCadastrar(false);
                                    }}
                                    className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-md font-semibold transition"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </section>
            ) : (
                <div className="flex justify-center mt-4">
                    <button
                        type="button"
                        onClick={() => setCadastrar(true)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 
             text-white font-semibold px-5 py-2 rounded-md shadow-md transition-all duration-200 
             hover:scale-[1.03] active:scale-95 mb-3.5"
                    >
                        Cadastrar Produto
                    </button>
                </div>
            )}
        </>
    );
}
