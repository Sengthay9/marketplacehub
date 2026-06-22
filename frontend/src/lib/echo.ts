import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo;
  }
}

export function initEcho(token: string): Echo {
  window.Pusher = Pusher;

  const echo = new Echo({
    broadcaster:     "pusher",
    key:             process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
    cluster:         process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "mt1",
    forceTLS:        true,
    authEndpoint:    `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`,
    auth: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  window.Echo = echo;
  return echo;
}
