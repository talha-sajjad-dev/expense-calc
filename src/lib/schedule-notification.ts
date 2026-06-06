import { after } from "next/server";

/**
 * Run notification work after the response is sent, but still within the
 * same server invocation (reliable on Vercel). Pass fully-resolved params —
 * do not read cookies() inside the callback.
 */
export function scheduleNotification(work: () => Promise<void>) {
  after(async () => {
    try {
      await work();
    } catch (err) {
      console.error("[notifications] unhandled error:", err);
    }
  });
}
