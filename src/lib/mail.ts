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
