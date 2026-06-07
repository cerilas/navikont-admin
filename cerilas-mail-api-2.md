# Cerilas Mail API Dokümantasyonu

## Genel Bilgi
Cerilas Mail API, sistemdeki tanımlı göndericiler üzerinden e-posta göndermenizi sağlar.

## Endpoint
**POST** `/api/mail/send`

## Request Body (JSON)
```json
{
  "senderId": 1,
  "to": "alici@mail.com",
  "subject": "Başlık",
  "html": "<h1>İçerik</h1>",
  "cc": ["cc@mail.com"],
  "bcc": ["bcc@mail.com"],
  "attachments": [
    {
      "filename": "belge.pdf",
      "content": "base64_string",
      "encoding": "base64"
    }
  ]
}
```

## Kimlik Doğrulama
İstek başlığına şu parametreyi ekleyin:
`Authorization: Bearer YOUR_ADMIN_TOKEN`

Token almak için `/api/auth/login` adresine POST isteği atabilirsiniz:
```json
{
  "email": "admin_emailiniz@cerilas.com",
  "password": "sifreniz"
}
```
