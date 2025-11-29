"use client";

import { useEffect, useState } from "react";
import { Product } from "./types";
import Cadastrar from "@/components/Cadastrar";
import Lista from "@/components/Lista";
import ReceberNotificacao from "@/components/ReceberNotificacao";

export default function Home() {
  const [produtos, setProdutos] = useState<Product[]>([]);
  //cadastrar
  const [form, setForm] = useState({
    nome: "",
    preco: "",
    validade: "",
  });
  const [cadastrar, setCadastrar] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [produtoAlvo, setProdutoAlvo] = useState<string | null>(null);

  //modals
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [modalDeletando, setModalDeletando] = useState<boolean>(false);
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);

  const [precoSugerido, setPrecoSugerido] = useState<number | null>(null);
  const [loadingPreco, setLoadingPreco] = useState<boolean>(false);

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
    setForm({ nome: "", preco: "", validade: "" });
    setCadastrar(false);
    await carregar();
  }

  function iniciarEdicao(produto: Product) {
    setEditId(produto.id);
    setForm({
      nome: produto.nome,
      preco: String(produto.preco),
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
    setForm({ nome: "", preco: "", validade: "" });
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

      <Cadastrar carregar={carregar} cadastrar={cadastrar} setCadastrar={setCadastrar} form={form} setForm={setForm} editId={editId} setEditId={setEditId} salvarEdicao={salvarEdicao} criarProduto={criarProduto} />

      <Lista produtos={produtos} iniciarEdicao={iniciarEdicao} excluir={excluir} confirmarExclusao={confirmarExclusao} modalDeletando={modalDeletando} setModalDeletando={setModalDeletando} produtoAlvo={produtoAlvo} setCadastrar={setCadastrar} sugerirPreco={sugerirPreco} modalAberto={modalAberto} setModalAberto={setModalAberto} loadingPreco={loadingPreco} aceitarPreco={aceitarPreco} precoSugerido={precoSugerido} />

      <ReceberNotificacao mostrarModal={mostrarModal} ativarPush={ativarPush} />

      <footer className="text-center text-xs text-slate-500 mt-8">
        Feito com puro odio por BRUNO
      </footer>
    </div>
  );
}
