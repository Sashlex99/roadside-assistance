# Ръководство за тест на снимки

## 🎯 Цел
Тестване дали Firebase Storage работи правилно за качване и визуализиране на снимки в администратор панела.

## 🔧 Как да тествате:

### 1. Отворете администратор панела
- URL: http://localhost:3000

### 2. Натиснете бутона "ТЕСТ СНИМКА"
- Намира се в горния ляв ъгъл (син бутон с икона на камера)

### 3. Изберете снимка
- Натиснете "Избери снимка"
- Изберете JPG, PNG или друг image файл от компютъра си

### 4. Качете снимката
- Натиснете "ИЗПРАТИ"
- Проследете прогреса в диалога

### 5. Проверете резултата

## 📊 Възможни резултати:

### ✅ **Успех - Firebase Storage работи**
- Снимката се качва успешно
- Получавате URL като: `https://firebasestorage.googleapis.com/...`
- Снимката се показва в диалога
- **Резултат**: Firebase Storage е конфигуриран правилно

### ❌ **Грешка - Storage не работи**
- Получавате грешка: "Firebase Storage: User does not have permission..."
- Или: "Network error" 
- Или: "Invalid credentials"
- **Резултат**: Трябва да поправим Firebase конфигурацията

## 🔍 Debug информация

### В Browser Console (F12) ще видите:
```
📸 Starting test image upload...
📄 File info: {name: "test.jpg", size: 123456, type: "image/jpeg"}
📁 Upload path: test_images/test_1234567890_test.jpg
🔄 Uploading to Firebase Storage...
✅ Upload completed: [UploadResult object]
🔗 Getting download URL...
✅ Download URL obtained: https://...
```

### Ако има грешка:
```
❌ Upload error: [Error details]
```

## 🛠️ След тестването

### Ако тестът е успешен:
- ✅ Firebase Storage работи
- ✅ Можем да качваме реални документи
- ✅ Администратор панелът може да показва снимки

### Ако тестът неуспешен:
- 🔧 Трябва да поправим Firebase Storage Rules
- 🔧 Или да проверим API ключовете
- 🔧 Или да създадем fallback решение

## 📝 Забележки
- Тест файловете се запазват в папка `test_images/`
- Не засягат потребителските документи
- Безопасно за тестване
- Може да се повтаря многократно 