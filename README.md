# Modern Edu

Modern Edu - xususiy onlayn raqamli sinfxona platformasi. UI sukut bo'yicha Uzbek Latin tilida.

## Lokal ishga tushirish

```powershell
cd "C:\Users\ali\Documents\Modern-EDU"
docker compose up -d
npm.cmd install
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

Brauzer:

```text
http://localhost:3000
```

Demo admin:

```text
Foydalanuvchi nomi: admin
Parol: Admin12345!
```

## GitHubga tayyorlash

```powershell
git init
git add .
git commit -m "Initial Modern Edu platform"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

`.env`, `.next`, `node_modules` va yuklangan fayllar `.gitignore` orqali GitHubga chiqmaydi.

## Railway deploy

Railway hujjatlariga ko'ra Next.js self-hosted deploy uchun `output: "standalone"` ishlatiladi, Postgres esa Railway project ichida alohida database service sifatida qo'shiladi.

1. Railway’da yangi project yarating.
2. GitHub repository’ni ulang.
3. Project canvas’da `Database -> PostgreSQL` qo'shing.
4. Next.js service `Variables` bo'limida Postgres service’dan `DATABASE_URL` reference variable qo'shing.
5. Quyidagi variable’larni qo'shing:

```env
APP_TIMEZONE=Asia/Tashkent
APP_DEFAULT_LOCALE=uz-Latn-UZ
SESSION_COOKIE_NAME=modern_edu_session
NEXT_PUBLIC_APP_URL=https://your-railway-domain.up.railway.app
```

6. Deploy qiling.

`railway.json` quyidagilarni avtomatik sozlaydi:

- build: `npm run build`
- pre-deploy migration: `npm run db:deploy`
- start: `npm run start`
- healthcheck: `/api/health`

## Railway’da birinchi admin yaratish

Birinchi deploydan keyin Railway service shell yoki CLI orqali bir marta seed yuriting:

```bash
npm run db:seed
```

Admin login:

```text
Foydalanuvchi nomi: admin
Parol: Admin12345!
```

Production’da seed parolini Railway Variables orqali almashtirish tavsiya qilinadi:

```env
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=<kuchli-parol>
SEED_ADMIN_FULL_NAME=Modern Edu Admin
```
