self.addEventListener("push", (event) => {
    let data = {
        title: "Notificação",
        body: "Você recebeu uma mensagem"
    };

    try {
        if (event.data) {
            const txt = event.data.text();
            data = JSON.parse(txt); // OBRIGATÓRIO: precisa ser JSON
        }
    } catch (e) {
        console.log("Erro ao ler push data", e);
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: "/icon.png",
            badge: "/icon.png",
            data: { url: "/" }
        })
    );
});


self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
            const appUrl = event.notification.data?.url || "/";

            for (const client of clientsArr) {
                if (client.url.includes(appUrl) && "focus" in client) {
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(appUrl);
            }
        })
    );
});
