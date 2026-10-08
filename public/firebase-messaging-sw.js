importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js",
);

const configParam = new URL(self.location.href).searchParams.get("config");
const firebaseConfig = configParam ? JSON.parse(configParam) : null;

if (firebaseConfig?.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {};
    const data = payload.data || {};
    self.registration.showNotification(notification.title || "MobilesX", {
      body: notification.body || "",
      icon: notification.icon || "/favicon.ico",
      image: notification.image || undefined,
      data: { url: data.url || "/admin/notifications" },
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(
    event.notification.data?.url || "/admin/notifications",
    self.location.origin,
  );
  if (targetUrl.origin !== self.location.origin) return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) {
        existing.navigate(targetUrl.href);
        return existing.focus();
      }
      return self.clients.openWindow(targetUrl.href);
    }),
  );
});
