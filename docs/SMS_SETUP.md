# SMS Верификация - Настройка и Конфигурация

## Преглед

Приложението използва SMS верификация за потвърждаване на телефонните номера на потребителите. В момента системата работи в демо режим за тестване.

## Текущо състояние (ДЕМО РЕЖИМ)

### Как работи в development:
1. Потребителят въвежда телефонен номер
2. Системата генерира 6-цифрен код
3. **Кодът се показва по 3 начина:**
   - 🚨 **Pop-up alert** на устройството (най-лесно за копиране)
   - 📱 **Конзола на браузъра/устройството** с ясно форматиране
   - 📋 **Metro bundler терминал** (ако стартирате със `npm start`)

### Debug команди в development:
В конзолата на браузъра/устройството можете да използвате:
```javascript
// Преглед на всички активни кодове
getVerificationCodes()

// Изчистване на всички кодове
clearVerificationCodes()
```

## Форматиране на телефонни номера

Системата автоматично форматира българските телефонни номера:
- `0899123456` → `+359899123456`
- `899123456` → `+359899123456`
- `359899123456` → `+359899123456`
- `+359899123456` → остава същия

## Production настройка

За production използване трябва да:

### 1. Регистрация в SMS Provider

**Препоръчани български SMS доставчици:**
- **SMS.bg** - [https://sms.bg](https://sms.bg)
- **VivaKom SMS** - [https://www.vivacom.bg](https://www.vivacom.bg)
- **A1 SMS** - [https://www.a1.bg](https://www.a1.bg)
- **Yettel SMS** - [https://www.yettel.bg](https://www.yettel.bg)

### 2. Получаване на API ключ

След регистрация ще получите:
- API URL endpoint
- API ключ/токен
- Документация за API-то

### 3. Конфигуриране на environment variables

Създайте `.env` файл в root папката:
```env
SMS_PROVIDER_URL=https://api.your-sms-provider.com/send
SMS_API_KEY=your_api_key_here
SMS_SENDER_NAME=RoadsideApp
```

### 4. Активиране на production кода

В `src/services/smsService.ts`, премахнете коментарите от `sendRealSMS` функцията и я адаптирайте според API-то на вашия доставчик.

## Пример за SMS.bg интеграция

```javascript
const sendRealSMS = async (phone: string, code: string): Promise<void> => {
  const apiUrl = process.env.SMS_PROVIDER_URL;
  const apiKey = process.env.SMS_API_KEY;
  const message = `Вашият верификационен код е: ${code}`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      to: phone,
      message: message,
      from: process.env.SMS_SENDER_NAME
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`SMS API грешка: ${error.message}`);
  }
};
```

## Сигурност

### Текущи мерки:
- Кодовете изтичат след 5 минути
- Всеки код може да се използва само веднъж
- Телефонните номера се форматират стандартно

### За production:
- Добавете rate limiting (макс. 3 SMS-а на час на номер)
- Логвайте всички опити за верификация
- Мониторирайте за злоупотреба
- Добавете CAPTCHA при множество неуспешни опити

## Разходи

SMS верификацията има разходи в production:
- Обикновено 0.05-0.15 лв на SMS
- Планирайте бюджет според очаквания брой регистрации
- Някои доставчици предлагат пакетни цени

## Тестване

### В development:
1. Въведете произволен телефонен номер
2. Натиснете "Верифицирай"
3. Копирайте кода от pop-up alert-а
4. Въведете кода в полето
5. Натиснете "Потвърди код"

### За production тестване:
1. Използвайте реален телефонен номер
2. Проверете че SMS-ът пристига
3. Тествайте с различни формати на номера
4. Проверете изтичането на кодовете 