# Modern Edu install rejasi

Modern Edu bitta web kod bazadan uch xil o'rnatish oqimiga tayyorlandi.

## 1. Android

Eng yaxshi yo'l: PWA asosida Trusted Web Activity APK.

1. Railway domen HTTPS bilan ishlashi kerak.
2. `https://edu-gram-production.up.railway.app/manifest.webmanifest` ochilganda manifest ko'rinishi kerak.
3. Android uchun `mobile/android/twa-manifest.json` ichidagi `host` va `startUrl` production domen bilan mos turadi.
4. APK chiqarish uchun lokal kompyuterda Bubblewrap ishlatiladi:

```powershell
npm.cmd install -g @bubblewrap/cli
bubblewrap init --manifest https://edu-gram-production.up.railway.app/manifest.webmanifest
bubblewrap build
```

Play Market yoki to'g'ridan-to'g'ri APK tarqatish uchun signing key kerak bo'ladi. Key fingerprint tayyor bo'lgach, `public/.well-known/assetlinks.json` ichidagi fingerprint production qiymatga almashtiriladi.

## 2. iPhone

iOS uchun App Store shart emas: Safari orqali o'rnatiladi.

1. iPhone Safari brauzerida sayt ochiladi.
2. Share tugmasi bosiladi.
3. `Bosh ekranga qo'shish` tanlanadi.
4. Modern Edu mustaqil app kabi ochiladi.

Muhim: iOS kamera/mikrofon ruxsati uchun sayt HTTPS bo'lishi kerak.

## 3. Desktop

Eng tez va ishonchli yo'l: Chrome yoki Edge orqali PWA install.

1. Desktop Chrome/Edge brauzerida sayt ochiladi.
2. Address bar yonidagi install belgisi bosiladi.
3. Modern Edu alohida oynali desktop app kabi ishlaydi.

Keyingi professional bosqich: Tauri yoki Electron wrapper. Bunda auto-update, installer, tray va native file dialog qo'shish mumkin.

## Xavfsizlik

Service worker shaxsiy sahifalarni offline cache qilmaydi:

- `/teacher`
- `/student`
- `/admin`
- `/api`
- `/notifications`

Faqat app shell, ikonlar va offline sahifa cache qilinadi.
