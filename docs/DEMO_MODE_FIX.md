# Demo Mode Document Fix

## Проблем
В demo режима снимките не се показваха в администратор панела, въпреки че в мобилното приложение се виждаше "3 документа чакат".

## Причина
При регистрация в мобилното приложение се записваха само имената на файловете в полето `documents`, но не се инициализираха полетата `documentsStatus`, `documentsVerifiedAt` и `documentsRejectionReasons`, които администратор панелът използва.

## Поправки

### 1. RegisterScreen.tsx (React Native)
Добавени полета при регистрация на шофьор:

```typescript
documentsStatus: {
  roadsideAssistanceCert: 'pending',
  iaalaLicense: 'pending', 
  driverPhoto: 'pending',
},
documentsVerifiedAt: {
  roadsideAssistanceCert: null,
  iaalaLicense: null,
  driverPhoto: null,
},
documentsRejectionReasons: {
  roadsideAssistanceCert: null,
  iaalaLicense: null,
  driverPhoto: null,
},
```

### 2. userService.ts (Admin Panel)
Добавена подкрепа за demo/mock файлове в `getImageUrl`:

```typescript
// Check if this is a mock/demo file name
if (fileName && (fileName.includes('demo') || fileName.includes('mock'))) {
  // For demo files, return a placeholder image URL
  console.log(`🔧 Demo mode: Using placeholder image for ${fileName}`);
  return 'https://via.placeholder.com/300x200/0066CC/FFFFFF?text=Demo+Document';
}
```

## Тестване

### Стъпка 1: React Native App
1. Отвори приложението в Expo/симулатор
2. Регистрирай се като нов шофьор
3. Качи 3 документа (ще бъдат обработени в demo режим)
4. Провери дали виждаш съобщения за успешна регистрация

### Стъпка 2: Admin Panel
1. Отвори http://localhost:3000
2. Кликни на новия шофьор в таблицата
3. Кликни "Редактирай/Прегледай"
4. Трябва да видиш "📄 Документи за проверка" таб с ⏳3 чип
5. В документите таб трябва да видиш 3 placeholder снимки
6. Можеш да одобриш/отхвърлиш всеки документ

## Резултат
✅ Demo режимът сега работи напълно
✅ Администратор панелът показва документите с placeholder снимки
✅ Всички функции за одобрение/отхвърляне работят
✅ Статусът се обновява правилно

## Забележки
- В production режим placeholder снимките ще бъдат заменени с реални URL-и от Firebase Storage
- Demo режимът е идеален за разработка и тестване без production Firebase setup
- Всички metadata на файловете се записват правилно в Firestore 