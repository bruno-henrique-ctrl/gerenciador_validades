type Props = {
    mostrarModal: boolean;
    ativarPush: () => void
}

export default function ReceberNotificacao({ mostrarModal, ativarPush }: Props) {
    return (
        <>
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
        </>
    )
}