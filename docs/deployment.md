# Modern Edu deploy qo'llanmasi

## Majburiy sozlamalar

- `DATABASE_URL`: Railway PostgreSQL reference variable
- `NEXT_PUBLIC_APP_URL`: ilovaning Railway domain manzili
- `APP_TIMEZONE`: `Asia/Tashkent`
- `APP_DEFAULT_LOCALE`: `uz-Latn-UZ`
- `SESSION_COOKIE_NAME`: sessiya cookie nomi

## Railway oqimi

1. GitHub repository’ni Railway projectga ulang.
2. Railway’da PostgreSQL database service qo'shing.
3. Web service `Variables` bo'limida PostgreSQL service’dan `DATABASE_URL` reference variable qo'shing.
4. `NEXT_PUBLIC_APP_URL`, `APP_TIMEZONE`, `APP_DEFAULT_LOCALE`, `SESSION_COOKIE_NAME` variable’larini kiriting.
5. Deploy qiling.

Repository’dagi `railway.json` quyidagilarni sozlaydi:

- build command: `npm run build`
- pre-deploy command: `npm run db:deploy`
- start command: `npm run start`
- healthcheck path: `/api/health`

## Birinchi admin

Deploydan keyin Railway shell orqali bir marta:

```bash
npm run db:seed
```

Production parolni Railway Variables orqali almashtiring:

```env
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=<kuchli-parol>
SEED_ADMIN_FULL_NAME=Modern Edu Admin
```

## Production eslatmalari

- Fayl va audio saqlash uchun S3 mos obyekt saqlash adapteriga o'tish kerak. Hozirgi lokal adapter development va bir serverli boshlang'ich muhit uchun.
- Rate-limit ko'p serverli muhitda Redis yoki managed key-value xizmatiga ko'chirilishi kerak.
- PostgreSQL backup va point-in-time recovery yoqilishi kerak.
- Barcha UI matnlari Uzbek Latin bo'lib qolishi shart; keyingi tillar i18n lug'atlari orqali qo'shiladi.
