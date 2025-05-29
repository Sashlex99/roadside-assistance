// SMS Верификация със SMS Gateway
// За демо цели използваме симулация. За production ще трябва
// да се интегрира с истински SMS provider като SMS.bg, VivaKom, и др.

interface VerificationData {
  phone: string;
  code: string;
  timestamp: number;
}

// Временно хранилище за кодове (в production използвайте Firebase/Database)
const verificationCodes: Map<string, VerificationData> = new Map();

// Генериране на 6-цифрен код
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Изпращане на SMS код
export const sendSMSVerificationCode = async (phoneNumber: string): Promise<void> => {
  try {
    // Форматиране на телефонния номер
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const code = generateVerificationCode();
    
    // Запазване на кода с timestamp (валиден 5 минути)
    verificationCodes.set(formattedPhone, {
      phone: formattedPhone,
      code,
      timestamp: Date.now(),
    });

    // ДЕМО РЕЖИМ: За тестване просто логваме кода и показваме alert
    console.log('='.repeat(50));
    console.log(`🔑 SMS ВЕРИФИКАЦИОНЕН КОД 🔑`);
    console.log(`📱 Телефон: ${formattedPhone}`);
    console.log(`🔢 Код: ${code}`);
    console.log('='.repeat(50));
    
    // В демо режим също ще върнем кода за показване в UI
    if (__DEV__) {
      // Показваме кода в alert за лесно копиране в development mode
      setTimeout(() => {
        alert(`ДЕМО: SMS код за ${formattedPhone} е: ${code}`);
      }, 100);
    }
    
    // ЗА PRODUCTION: Тук ще изпратите истински SMS
    // await sendRealSMS(formattedPhone, code);
    
    // Симулация на изпращане
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error('Грешка при изпращане на SMS:', error);
    throw new Error('Неуспешно изпращане на SMS');
  }
};

// Верификация на кода
export const verifySMSCode = async (phoneNumber: string, code: string): Promise<boolean> => {
  try {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const verification = verificationCodes.get(formattedPhone);
    
    if (!verification) {
      throw new Error('Няма изпратен код за този номер');
    }
    
    // Проверка дали кодът не е изтекъл (5 минути)
    const isExpired = Date.now() - verification.timestamp > 5 * 60 * 1000;
    if (isExpired) {
      verificationCodes.delete(formattedPhone);
      throw new Error('Кодът е изтекъл');
    }
    
    // Проверка на кода
    if (verification.code !== code) {
      throw new Error('Невалиден код');
    }
    
    // Успешна верификация - премахваме кода
    verificationCodes.delete(formattedPhone);
    return true;
    
  } catch (error) {
    console.error('Грешка при верификация:', error);
    throw error;
  }
};

// ЗА PRODUCTION: Истинско изпращане на SMS
const sendRealSMS = async (phone: string, code: string): Promise<void> => {
  // Пример за SMS.bg API (трябва да се регистрирате за API ключ)
  const apiUrl = 'https://api.sms.bg/send';
  const message = `Вашият верификационен код за пътна помощ е: ${code}`;
  
  /* 
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_SMS_API_KEY'
    },
    body: JSON.stringify({
      to: phone,
      message: message,
      from: 'RoadsideApp'
    })
  });
  
  if (!response.ok) {
    throw new Error('SMS API грешка');
  }
  */
};

// Форматиране на телефонния номер за България
const formatPhoneNumber = (phone: string): string => {
  // Премахваме всички нецифрови символи
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Ако започва с 0, заменяме с +359
  if (cleanPhone.startsWith('0')) {
    return '+359' + cleanPhone.substring(1);
  }
  
  // Ако вече има +359, връщаме както е
  if (phone.startsWith('+359')) {
    return phone;
  }
  
  // Ако започва с 359, добавяме +
  if (cleanPhone.startsWith('359')) {
    return '+' + cleanPhone;
  }
  
  // По подразбиране добавяме +359
  return '+359' + cleanPhone;
};

// Глобална функция за debug в development mode
if (__DEV__) {
  // @ts-ignore
  global.getVerificationCodes = () => {
    console.log('📱 АКТИВНИ ВЕРИФИКАЦИОННИ КОДОВЕ:');
    console.log('='.repeat(40));
    if (verificationCodes.size === 0) {
      console.log('Няма активни кодове');
    } else {
      verificationCodes.forEach((data, phone) => {
        const timeLeft = Math.max(0, 5 * 60 * 1000 - (Date.now() - data.timestamp));
        const minutesLeft = Math.floor(timeLeft / 60000);
        const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
        console.log(`📱 ${phone}: ${data.code} (валиден още ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')})`);
      });
    }
    console.log('='.repeat(40));
  };
  
  // @ts-ignore
  global.clearVerificationCodes = () => {
    verificationCodes.clear();
    console.log('🗑️ Всички верификационни кодове са изчистени');
  };
} 