# 2030 HUNTER V8 — Verified Research Terminal

## Dosyalar
- index.html
- api/scan.js
- config.json
- package.json
- vercel.json

## Vercel
Environment Variable:
OPENAI_API_KEY = yeni OpenAI API key

Production ve Preview için ekleyin ve ardından redeploy edin.

API key'i GitHub'a veya HTML'e koymayın.

## Yeni yapı
- Tarama geçmişi tarayıcıda localStorage ile tutulur.
- Yeni adaylar mevcut Hunter Radar'a skorlarına göre eklenir.
- Şirket kartında Türkçe yatırım tezi, iş modeli, 5X-10X mantığı, gelecek hikayesi, riskler, Winner DNA ve kaynaklar bulunur.
- Kritik iddialar için kaynak URL'si istenir.
- SEC/EDGAR ve resmi kaynaklar önceliklidir.
- Kaynak bulunmayan kritik bilgi kesin gerçek olarak sunulmaması için prompt kuralı vardır.
- OpenAI Responses API + GPT-5.6 + Web Search kullanılır.
