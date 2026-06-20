import apn from '@parse/node-apn';

// Configure APN Provider
// The keys should be provided in .env
let apnProvider: apn.Provider | null = null;

export function getApnProvider() {
  if (apnProvider) return apnProvider;

  const key = process.env.APN_KEY; // can be a multiline string or path
  const keyId = process.env.APN_KEY_ID;
  const teamId = process.env.APN_TEAM_ID;

  if (!key || !keyId || !teamId) {
    console.warn('APN configuration missing. Push notifications will not be sent.');
    return null;
  }

  try {
    apnProvider = new apn.Provider({
      token: {
        key: key.includes('-----BEGIN PRIVATE KEY-----') ? key : Buffer.from(key, 'base64').toString('ascii'),
        keyId: keyId,
        teamId: teamId
      },
      production: process.env.APN_USE_SANDBOX === 'true' ? false : process.env.NODE_ENV === 'production'
    });
    return apnProvider;
  } catch (error) {
    console.error('Failed to initialize APN Provider:', error);
    return null;
  }
}

export async function sendPushNotification(
  deviceTokens: string[],
  title: string,
  body: string,
  topic: string // The App Bundle ID
) {
  const provider = getApnProvider();
  if (!provider || deviceTokens.length === 0) return { sent: 0, failed: deviceTokens.length };

  const notification = new apn.Notification();
  notification.topic = topic;
  notification.alert = {
    title: title,
    body: body
  };
  notification.sound = 'default';
  notification.badge = 1;

  try {
    const result = await provider.send(notification, deviceTokens);
    return {
      sent: result.sent.length,
      failed: result.failed.length,
      failures: result.failed
    };
  } catch (error) {
    console.error('APN Send Error:', error);
    return { sent: 0, failed: deviceTokens.length, error };
  }
}
