# Modern Edu AI poydevori

## Tamoyillar

- AI funksiyalar sukut bo'yicha yopiq bo'ladi va faqat ruxsat berilgan rollar ishlatadi.
- Har bir AI so'rovi `AiRequest` jadvalida saqlanadi.
- Maxfiy qiymatlar tashqi modelga yuborilishidan oldin tozalanadi.
- AI natijasi avtomatik yakuniy qaror sifatida ishlatilmaydi; ustoz yoki administrator nazorati saqlanadi.

## Tayyor funksiyalar chegarasi

- `ASSIGNMENT_FEEDBACK`: topshiriqqa izoh loyihasi
- `TEST_GENERATION`: test savollari loyihasi
- `CHAT_SUMMARY`: guruh chatidan qisqa xulosa
- `STUDENT_PROGRESS`: o'quvchi rivojlanishi bo'yicha ko'rsatkichlar

## Keyingi ulanish

Tashqi AI provider `lib/ai` ichida adapter sifatida qo'shiladi. UI, ruxsatlar va audit qatlamlari provider tanloviga bog'lanmaydi.
