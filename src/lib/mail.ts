export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  cc?: string[];
  bcc?: string[];
  attachments?: {
    filename: string;
    content: string;
    encoding: string;
  }[];
}

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export async function getAdminToken() {
  const apiUrl = process.env.CERILAS_MAIL_API_URL;
  const email = process.env.CERILAS_MAIL_API_EMAIL;
  const password = process.env.CERILAS_MAIL_API_PASSWORD;

  if (!apiUrl || !email || !password) {
    console.warn('Mail API configuration missing in .env. Falling back to mock token.');
    return 'mock-token'; // Fallback for dev if not configured
  }

  // Check if token is still valid (assuming 1 hour expiration for safety)
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  try {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      throw new Error(`Failed to login to mail API: ${res.statusText}`);
    }

    const data = await res.json();
    cachedToken = data.token;
    tokenExpiresAt = Date.now() + 1000 * 60 * 55; // Cache for 55 minutes
    
    return cachedToken;
  } catch (err) {
    console.error('Error fetching admin token:', err);
    throw err;
  }
}

export async function sendMail(options: SendMailOptions) {
  const apiUrl = process.env.CERILAS_MAIL_API_URL;
  
  if (!apiUrl) {
    console.warn('Mail API URL missing, skipping actual mail send. Content:', options);
    return true; // Pretend success in dev
  }

  try {
    const token = await getAdminToken();

    const payload = {
      senderId: 1, // Default sender id as per docs
      ...options
    };

    const res = await fetch(`${apiUrl}/api/mail/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Mail API responded with ${res.status}: ${errorText}`);
    }

    return true;
  } catch (err) {
    console.error('Error sending mail:', err);
    throw err;
  }
}

export function getHtmlEmailTemplate(
  title: string,
  bodyContentHtml: string,
  actionText?: string,
  actionUrl?: string,
  appName?: string
): string {
  const ctaButton = (actionText && actionUrl) ? `
    <div style="text-align: center; margin: 32px 0;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionUrl}" style="height:46px;v-text-anchor:middle;width:200px;" arcsize="13%" stroke="f" fillcolor="#206bc4">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${actionText}</center>
      </v:roundrect>
      <![endif]-->
      <a href="${actionUrl}" target="_blank" style="background-color: #206bc4; color: #ffffff; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; line-height: 46px; text-align: center; text-decoration: none; width: 200px; -webkit-text-size-adjust: none; mso-hide: all; border-radius: 6px; box-shadow: 0 4px 6px rgba(32, 107, 196, 0.15);">
        ${actionText}
      </a>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f6fa; padding: 40px 0;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); border: 1px solid #e6e8eb;">
                <!-- Header Banner -->
                <tr>
                  <td bgcolor="#ffffff" style="background-color: #ffffff; padding: 32px 40px; border-bottom: 2px solid #e2e8f0; text-align: center;">
                    <h1 style="margin: 0; color: #206bc4; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">
                      ${appName || 'Cerilas DiGA Base'}
                    </h1>
                  </td>
                </tr>
                <!-- Content Area -->
                <tr>
                  <td style="padding: 40px 48px; background-color: #ffffff; text-align: left;">
                    <h2 style="margin-top: 0; margin-bottom: 20px; color: #1e293b; font-size: 20px; font-weight: 600; line-height: 1.4;">
                      ${title}
                    </h2>
                    <div style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                      ${bodyContentHtml}
                    </div>
                    ${ctaButton}
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 32px 40px; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                      Bu e-posta Cerilas DiGA Base sistemi tarafından otomatik olarak gönderilmiştir.<br>
                      Lütfen bu e-postayı yanıtlamayınız.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      &copy; 2026 Cerilas. Tüm hakları saklıdır.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

