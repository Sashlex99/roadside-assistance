# Development Guide

## Настройка на Development Environment

### Предварителни изисквания
- Node.js 18+
- npm или yarn
- Expo CLI
- Android Studio / Xcode (optional)

### Стартиране на проекта

```bash
# Главно React Native приложение
cd roadside-assistance
npm install
npm start

# Admin панел (в отделен терминал)
cd admin-panel
npm install
npm start
```

## Често срещани проблеми и решения

### 1. "checking for new updates" не се маха

**Причина**: Expo development сървърът проверява за обновления

**Решение**:
- Рестартирайте сървъра: `npx expo start --clear`
- Конфигурацията в `app.json` вече е обновена да скрие това

### 2. SMS кодът не се показва

**В development режим кодът се показва по 3 начина:**

1. **Pop-up alert** (най-лесно) - появява се автоматично
2. **Конзола на устройството**:
   - Android: `adb logcat` или вградена конзола в Expo Go
   - iOS: Console.app или Xcode Console
   - Web: Browser Developer Tools Console
3. **Metro bundler терминал** (където стартирахте `npm start`)

**Debug команди** (само в development):
```javascript
// В конзолата на браузъра/устройството
getVerificationCodes()  // Покажи всички активни кодове
clearVerificationCodes() // Изчисти всички кодове
```

### 3. Firebase Storage Authentication Error (401 Invalid Credentials)

**Проблем**: При качване на файлове (снимки на документи) се появява грешка 401.

**Решение**: В development mode се използва автоматичен fallback:

#### Development Mode (препоръчително за тестване):
- ✅ Файловете се обработват в **демо режим**
- ✅ Всички данни се запазват правилно в Firestore
- ✅ Регистрацията работи напълно функционално
- ✅ Admin панелът може да видели и одобри документите
- ⚠️ Снимките се показват като placeholder докато не се настрои production Storage

**Логове в development mode:**
```
📸 ДЕМО РЕЖИМ - Файл "driver_photo_USER123" би бил качен
📱 Размер: 245.8 KB
📝 Тип: image/jpeg
✅ Mock файл качен успешно
```

#### Production Mode:
За production се изисква:
1. **Service Account Key** с Storage permissions
2. **Firebase Storage Security Rules** настройка
3. **OAuth2 Setup** за правилна автентикация

### 4. Как работи файловото качване в development

**3-степенен fallback механизъм:**

1. **Метод 1**: Опитва Firebase Storage REST API
2. **Метод 2**: Fallback към Firestore за backup
3. **Метод 3**: Demo mode с mock данни

```javascript
// Пример за успешен demo response:
{
  name: "driver_photo_USER123",
  bucket: "roadside-assistance-app.appspot.com", 
  contentType: "image/jpeg",
  size: "251392",
  status: "demo_mode",
  downloadTokens: "demo-1647325234567"
}
```

### 5. Проверка на upload статус

**В логовете търсете тези съобщения:**

✅ **Успешни uploads:**
- `✅ Файл качен успешно: [filename]`
- `✅ Mock файл качен успешно`

⚠️ **Fallback режими:**
- `⚠️ Метод 1 неуспешен, опитваме Метод 2`  
- `🔄 Използваме fallback метод`
- `🔄 Development mode - връщаме mock response`

❌ **Грешки** (само в production):
- `❌ Storage init error: Invalid Credentials`

### 6. Firestore permission errors

**Симптоми**: "permission-denied" при запис на данни

**Решение**:
1. Проверете Firebase правилата
2. Убедете се че authentication token-ът е валиден
3. Проверете че проектът е правилно конфигуриран

### 7. TypeScript грешки в admin панел

**Решение**:
```bash
cd admin-panel
npm run type-check
npx tsc --noEmit
```

### 8. Metro bundler конфликти

**Симптоми**: Port already in use

**Решение**:
```bash
# Убийте всички Metro процеси
npx expo start --clear

# Или принудително с различен порт
npx expo start --port 8082
```

## Полезни development команди

### React Native App
```bash
# Стартиране с чист кеш
npx expo start --clear

# Рестартиране на Metro
npx expo start --reset-cache

# Билд за Android
npx expo run:android

# Билд за iOS  
npx expo run:ios

# Експорт за production
npx expo export
```

### Admin Panel
```bash
# Development сървър
npm start

# Production билд
npm run build

# Type checking
npm run type-check

# Преглед на dependencies
npm audit
```

## Debug съвети

### 1. SMS верификация
- Използвайте `getVerificationCodes()` в конзолата
- Кодовете са валидни 5 минути
- Форматът на телефона трябва да е +359XXXXXXXXX

### 2. Firebase данни
- Проверете Network tab в браузъра за HTTP заявки
- Логовете се записват в конзолата
- Използвайте Firebase Emulator за local testing

### 3. React Native debugging
- Shaking device → Debug → Remote JS Debugging
- Flipper за по-advanced debugging
- console.log() работи във всички случаи

## Environment Variables

Създайте `.env` файл в root папката:

```env
# Firebase
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=your_project_id

# SMS (за production)
SMS_PROVIDER_URL=https://api.sms.bg/send
SMS_API_KEY=your_sms_api_key
SMS_SENDER_NAME=RoadsideApp

# Development
NODE_ENV=development
```

## Performance

### React Native
- Използвайте `react-native-flipper` за performance monitoring
- Проверете memory leaks с `--reset-cache`
- Оптимизирайте images с smaller resolutions

### Admin Panel
- Build с `npm run build` за production
- Използвайте React DevTools
- Chrome Performance tab за profiling

## Deployment Checklist

### Pre-production
- [ ] Премахнете всички `console.log()` statements
- [ ] Обновете version в `package.json`
- [ ] Тествайте на реални устройства
- [ ] Проверете SMS integration
- [ ] Валидирайте Firebase security rules

### Production
- [ ] Конфигурирайте environment variables
- [ ] Setup CI/CD pipeline
- [ ] Configure error reporting (Sentry)
- [ ] Setup monitoring и analytics

## Архитектура

```
roadside-assistance/
├── src/
│   ├── components/     # Reusable компоненти
│   ├── screens/        # App екрани
│   ├── services/       # API слой
│   ├── navigation/     # Navigation setup
│   └── types/          # TypeScript types
├── admin-panel/
│   └── src/
│       ├── components/ # Admin компоненти
│       ├── services/   # Admin API
│       └── types/      # Admin types
└── docs/               # Документация
```

## Git Workflow

```bash
# Feature development
git checkout -b feature/new-feature
git commit -m "feat: добавяне на нова функционалност"
git push origin feature/new-feature

# Bug fixes
git checkout -b fix/bug-description
git commit -m "fix: поправяне на проблем с регистрацията"
git push origin fix/bug-description
```

## Съвети за production

1. **Никога не commit-вайте API keys**
2. **Използвайте TypeScript строго**
3. **Тествайте на няколко устройства**
4. **Setup error monitoring рано**
5. **Документирайте всички промени** 