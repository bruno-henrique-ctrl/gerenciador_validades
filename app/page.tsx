"use client";

import { useEffect, useState } from "react";
import { Product } from "./types";

export default function Home() {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [form, setForm] = useState({
    nome: "",
    preco: "",
    quantidade: "",
    validade: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [loadingPreco, setLoadingPreco] = useState<boolean>(false);
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [modalDeletando, setModalDeletando] = useState<boolean>(false);
  const [produtoAlvo, setProdutoAlvo] = useState<string | null>(null);
  const [precoSugerido, setPrecoSugerido] = useState<number | null>(null);
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
    const checkPermission = async () => {
      const permission = Notification.permission;
      if (permission === "granted") {
        setMostrarModal(false);
      } else {
        setMostrarModal(true);
      }
    };
    checkPermission();
  }, []);

  async function carregar() {
    const res = await fetch("/api/produtos");
    const data = await res.json();
    setProdutos(data);
  }

  async function criarProduto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await fetch("/api/produtos", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setForm({ nome: "", preco: "", quantidade: "", validade: "" });
    await carregar();
  }

  function iniciarEdicao(produto: Product) {
    setEditId(produto.id);
    setForm({
      nome: produto.nome,
      preco: String(produto.preco),
      quantidade: String(produto.quantidade),
      validade: produto.validade,
    });
  }

  async function salvarEdicao(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editId) return;
    await fetch(`/api/produtos/${editId}`, {
      method: "PUT",
      body: JSON.stringify(form),
    });
    setEditId(null);
    setForm({ nome: "", preco: "", quantidade: "", validade: "" });
    await carregar();
  }

  async function sugerirPreco(id: string) {
    setProdutoAlvo(id);
    setPrecoSugerido(null);
    setLoadingPreco(true);
    setModalAberto(true);

    const res = await fetch(`/api/produtos/${id}/preco`, { method: "POST" });
    const { novoPreco } = await res.json();
    setPrecoSugerido(novoPreco);

    setLoadingPreco(false);
  }

  async function aceitarPreco() {
    if (!produtoAlvo || precoSugerido == null) return;
    await fetch(`/api/produtos/${produtoAlvo}`, {
      method: "PUT",
      body: JSON.stringify({ preco: precoSugerido }),
    });
    setModalAberto(false);
    setProdutoAlvo(null);
    setPrecoSugerido(null);
    await carregar();
  }

  async function excluir(id: string) {
    await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    await carregar();
  }

  const confirmarExclusao = (id: string) => {
    setModalDeletando(true);
    setProdutoAlvo(id);
  };

  useEffect(() => {
    const init = async () => await carregar();
    init();
  }, []);

  async function ativarPush() {
    const permission = await Notification.requestPermission();
    console.log(permission)

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key as string),
      });
    }

    await fetch("/api/push/", {
      method: "POST",
      body: JSON.stringify(sub),
    });

    setMostrarModal(false);
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col p-4 justify-between">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-cyan-400">
          📦 Sistema de Produtos
        </h1>
        <button
          onClick={ativarPush}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-md text-sm transition"
        >
          🔔 Ativar Push
        </button>
      </header>

      <section className="bg-slate-800 rounded-lg p-4 mb-6 shadow-md max-w-lg mx-auto w-full">
        <h2 className="text-lg font-semibold text-center mb-3">
          {editId ? "✏️ Editar Produto" : "🆕 Cadastrar Produto"}
        </h2>

        <form
          onSubmit={editId ? salvarEdicao : criarProduto}
          className="flex flex-col gap-3"
        >

          <label htmlFor="nome" className="sr-only">
            Nome
          </label>
          <input
            className="p-2 rounded-md bg-slate-700 text-white focus:ring-2 focus:ring-cyan-500"
            placeholder="Nome"
            type="text"
            id="nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <label htmlFor="preco" className="sr-only">
            Preço
          </label>
          <input
            type="number"
            id="preco"
            className="p-2 rounded-md bg-slate-700 text-white focus:ring-2 focus:ring-cyan-500"
            placeholder="Preço"
            value={form.preco}
            onChange={(e) => setForm({ ...form, preco: e.target.value })}
          />
          <label htmlFor="quantidade" className="sr-only">
            Quantidade
          </label>
          <input
            type="number"
            id="quantidade"
            className="p-2 rounded-md bg-slate-700 text-white focus:ring-2 focus:ring-cyan-500"
            placeholder="Quantidade"
            value={form.quantidade}
            onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
          />
          <label htmlFor="validade" className="sr-only">
            Data de validade
          </label>
          <input
            type="date"
            id="validade"
            className="p-2 rounded-md bg-slate-700 text-white focus:ring-2 focus:ring-cyan-500"
            value={form.validade}
            onChange={(e) => setForm({ ...form, validade: e.target.value })}
          />

          <div className="flex gap-3 justify-center mt-2">
            <button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 rounded-md font-semibold hover:opacity-90 transition"
            >
              {editId ? "Salvar" : "Criar"}
            </button>
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setEditId(null);
                  setForm({
                    nome: "",
                    preco: "",
                    quantidade: "",
                    validade: "",
                  });
                }}
                className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-md font-semibold transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-x-auto">
        <h2 className="text-xl font-bold text-cyan-400 mb-3 text-center">
          Lista de Produtos
        </h2>
        <table className="min-w-full border border-slate-700 text-sm rounded-md overflow-hidden">
          <thead className="bg-slate-800 text-cyan-400 uppercase text-xs">
            <tr>
              <th className="p-3 border border-slate-700">Nome</th>
              <th className="p-3 border border-slate-700">Preço</th>
              <th className="p-3 border border-slate-700">Qtd</th>
              <th className="p-3 border border-slate-700">Validade</th>
              <th className="p-3 border border-slate-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length > 0 ? produtos.map((p) => (
              <tr
                key={p.id}
                className="odd:bg-slate-900 even:bg-slate-800 hover:bg-slate-700 transition"
              >
                <td className="p-3">{p.nome}</td>
                <td className="p-3">R$ {p.preco}</td>
                <td className="p-3">{p.quantidade}</td>
                <td className="p-3">{p.validade}</td>
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
                    onClick={() => iniciarEdicao(p)}
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

      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-sm text-center">
            <h2 className="text-lg font-bold mb-2 text-cyan-400">
              🔔 Receber notificações?
            </h2>
            <p className="text-slate-300 mb-4">
              Ative notificações para ser avisado sobre produtos próximos da
              validade.
            </p>
            <button
              onClick={ativarPush}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md font-semibold transition"
            >
              Permitir Notificações
            </button>
          </div>
        </div>
      )}

      <footer className="text-center text-xs text-slate-500 mt-8">
        Feito com puro odio por BRUNO
      </footer>
    </div>
  );
}
