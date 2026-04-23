require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const axios = require('axios');

const app = express();
const prisma = new PrismaClient();

// 1. НАЛАШТУВАННЯ ДОСТУПУ (CORS)
app.use(cors());
app.use(express.json());

// 2. ГОЛОВНА СТОРІНКА
app.get('/', (req, res) => {
    res.send('🚀 Сервер "Шукаю дім" ПРАЦЮЄ! Масюсік передає привіт 🐾');
});

// 3. РЕЄСТРАЦІЯ
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
            data: { name, email, password: hashedPassword }
        });
        
        res.status(201).json({ message: 'Користувача створено!' });
    } catch (error) {
        console.error("Помилка БД:", error.message);
        res.status(500).json({ error: 'Такий E-mail вже є або помилка бази' });
    }
});

// 4. ВХІД (LOGIN)
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
            return res.status(401).json({ error: 'Користувача не знайдено' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Пароль невірний' });
        }

        res.json({ message: 'Вхід успішний!', user: { name: user.name } });
    } catch (error) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

// 5. ЗАПУСК СЕРВЕРА
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер стартував на порту ${PORT}`);
});

// 6. САМОПІНГ (Щоб не спав Render)
// УВАГА: Перевір, щоб тут було ТВОЄ ПРАВИЛЬНЕ посилання з Render
setInterval(() => {
  axios.get('https://shukayu-dim-backend.onrender.com') 
    .then(() => console.log('Keep-alive ping sent!'))
    .catch((err) => console.error('Ping failed:', err.message));
}, 600000); // 10 хвилин
// Цей блок ставимо в самому кінці файлу
setInterval(async () => {
  try {
    // 1. Стукаємо самі до себе (Render не дасть заснути серверу)
    // УВАГА: Перевір, щоб тут було ТВОЄ ПРАВИЛЬНЕ посилання з Render (з буквою l чи i)
    await axios.get('https://shukayu-dim-backendl.onrender.com');
    
    // 2. Стукаємо в базу (Aiven бачитиме активність і не вимкнеться)
    await prisma.$queryRaw`SELECT 1`; 
    
    console.log('⏰ Будильник спрацював: Бекенд та База активні!');
  } catch (err) {
    console.error('❌ Помилка будильника:', err.message);
  }
}, 600000); // 10 хвилин