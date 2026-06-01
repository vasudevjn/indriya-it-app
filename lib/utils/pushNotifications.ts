interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
  badge?: number;
  channelId?: string;
}

/** Send push messages to Expo Push Service in batches of 100 */
export async function sendPushNotifications(messages: ExpoPushMessage[]): Promise<void> {
  if (!messages.length) return;

  const valid = messages.filter((m) => m.to.startsWith('ExponentPushToken['));
  if (!valid.length) return;

  const BATCH = 100;
  for (let i = 0; i < valid.length; i += BATCH) {
    const chunk = valid.slice(i, i + BATCH);
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });
    } catch {
      // Push is best-effort -- never throw
    }
  }
}

/** Convenience wrapper for sending a single push */
export async function sendPushToToken(
  token: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (!token) return;
  await sendPushNotifications([{ to: token, title, body, data, sound: 'default' }]);
}
