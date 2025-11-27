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

    const init = async () => setMostrarModal(true);
    init()
  }, []);

  async function carregar() {
    const res = await fetch("/api/produtos");
    const data = await res.json();

    setProdutos(data);
  }

  // Criar
  async function criarProduto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    await fetch("/api/produtos", {
      method: "POST",
      body: JSON.stringify(form),
    });

    setForm({ nome: "", preco: "", quantidade: "", validade: "" });
    await carregar();
  }

  // Editar - carregar valores
  function iniciarEdicao(produto: Product) {
    setEditId(produto.id);
    setForm({
      nome: produto.nome,
      preco: String(produto.preco),
      quantidade: String(produto.quantidade),
      validade: produto.validade,
    });
  }

  // Editar - salvar
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

  // IA – recuperar preço
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

  // Aceitar preço sugerido (PUT)
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

  // Excluir
  async function excluir(id: string) {
    await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    await carregar();
  }

  const confirmarExclusao = (id: string) => {
    setModalDeletando(true);
    setProdutoAlvo(id);
  };

  useEffect(() => {
    const init = async () => {
      carregar();
    };

    init();
  }, []);

  async function ativarPush() {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      alert("Você precisa permitir as notificações.");
      return;
    }

    const reg = await navigator.serviceWorker.ready;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    });

    await fetch("/api/push", {
      method: "POST",
      body: JSON.stringify(sub),
    });

    alert("Notificações ativadas com sucesso!");
  }


  return (
    <div style={{ padding: 32 }}>
      <h1>📦 Sistema de Produtos</h1>

      <h2>{editId ? "Editar Produto" : "Cadastrar Produto"}</h2>

      <form
        onSubmit={editId ? salvarEdicao : criarProduto}
        style={{ marginBottom: 32 }}
      >
        <input type="text" placeholder="Nome" value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })} />

        <input type="number" placeholder="Preço" value={form.preco}
          onChange={(e) => setForm({ ...form, preco: e.target.value })} />

        <input type="number" placeholder="Quantidade" value={form.quantidade}
          onChange={(e) => setForm({ ...form, quantidade: e.target.value })} />

        <input type="date" value={form.validade}
          onChange={(e) => setForm({ ...form, validade: e.target.value })} />

        <button type="submit">{editId ? "Salvar" : "Criar"}</button>

        {editId && (
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setForm({ nome: "", preco: "", quantidade: "", validade: "" });
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      <h2>Lista de Produtos</h2>

      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Preço</th>
            <th>Quantidade</th>
            <th>Validade</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {produtos.map((p) => (
            <tr key={p.id}>
              <td>{p.nome}</td>
              <td>R$ {p.preco}</td>
              <td>{p.quantidade}</td>
              <td>{p.validade}</td>
              <td>
                <button onClick={() => confirmarExclusao(p.id)}>
                  Excluir
                </button>

                {modalDeletando && p.id === produtoAlvo ? (
                  <div>
                    <h2>Tem certeza que deseja excluir o produto?</h2>

                    <button onClick={() => excluir(p.id)}>
                      Sim
                    </button>

                    <button onClick={() => setModalDeletando(false)}>
                      Não
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => iniciarEdicao(p)}>
                      Editar
                    </button>

                    <button onClick={() => sugerirPreco(p.id)}>
                      IA: Sugerir Preço
                    </button>
                  </>
                )}

              </td>
            </tr>
          ))}
        </tbody>

      </table>


      {modalAberto && (
        <div>
          <div>
            {loadingPreco ? (
              <>
                <h2>Calculando preço sugerido...</h2>
                <div />
              </>
            ) : (
              <>
                <h2>Preço sugerido pela IA</h2>
                <p><b>Novo preço:</b> R$ {precoSugerido}</p>

                <button onClick={aceitarPreco}>
                  Aceitar
                </button>

                <button
                  onClick={() => {
                    setModalAberto(false);
                    setProdutoAlvo(null);
                    setPrecoSugerido(null);
                  }}
                >
                  Rejeitar
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {mostrarModal && (
        <div className="modal">
          <h2>Receber notificações?</h2>
          <p>Ative notificações para ser avisado sobre produtos próximos da validade.</p>

          <button onClick={ativarPush}>
            Permitir Notificações
          </button>
        </div>
      )}

    </div>

  );
}
