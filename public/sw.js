self.addEventListener("push", (event) => {
    let data = { title: "Nova notificação", body: "" };

    try {
        if (event.data) data = event.data.json();
    } catch (e) {
        console.error("Erro ao ler push data", e);
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: "/icon.png",
            badge: "/icon.png",
            data: { url: "/" },
            vibrate: [200, 100, 200],
            requireInteraction: false,
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
