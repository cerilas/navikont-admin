import { getAdminToken } from './mail';

export interface SendSmsOptions {
  msg: string;
  no: string;
}

export async function sendSms(options: SendSmsOptions) {
  const apiUrl = process.env.CERILAS_MAIL_API_URL;
  
  if (!apiUrl) {
    console.warn('API URL missing, skipping actual SMS send. Content:', options);
    return true; // Pretend success in dev
  }

  try {
    const token = await getAdminToken();

    // The API documentation states the no should be without the leading 0.
    // E.g. "510xxxxxxx". We'll sanitize it just in case.
    let sanitizedNo = options.no.replace(/\D/g, ''); // Remove non-digits
    if (sanitizedNo.startsWith('90')) {
      sanitizedNo = sanitizedNo.substring(2);
    }
    if (sanitizedNo.startsWith('0')) {
      sanitizedNo = sanitizedNo.substring(1);
    }

    const payload = {
      msg: options.msg,
      no: sanitizedNo
    };

    const res = await fetch(`${apiUrl}/api/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`SMS API responded with ${res.status}: ${errorText}`);
    }

    return true;
  } catch (err) {
    console.error('Error sending SMS:', err);
    throw err;
  }
}
