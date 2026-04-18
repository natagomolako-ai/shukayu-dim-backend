require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const app = express();
const prisma = new PrismaClient();

// 1. НАЛАШТУВАННЯ ДОСТУПУ (CORS)
// Дозволяємо запити з будь-якого місця, щоб браузер не блокував твій сайт
app.use(cors());

// Додатковий "ручний" захист від блокувань браузером
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    // Якщо браузер просто перевіряє зв'язок (OPTIONS), одразу кажемо "ОК"
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// 2. ГОЛОВНА СТОРІНКА (Для перевірки в браузері)
app.get('/', (req, res) => {
    console.log("Хтось зайшов на сервер!");
    res.send('🚀 Сервер "Шукаю дім" ПРАЦЮЄ! Масюсік передає привіт 🐾');
});

// 3. РЕЄСТРАЦІЯ
app.post('/register', async (req, res) => {
    console.log("Спроба реєстрації:", req.body.email);
    try {
        const { name, email, password } = req.body;
        
        // Хешуємо пароль (шифруємо його для безпеки)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
            data: { 
                name, 
                email, 
                password: hashedPassword 
            }
        });
        
        res.status(201).json({ message: 'Користувача створено!' });
    } catch (error) {
        console.error("Помилка БД:", error.message);
        res.status(500).json({ error: 'Такий E-mail вже є або сталась помилка бази даних' });
    }
});

// 4. ВХІД (LOGIN)
app.post('/login', async (req, res) => {
    console.log("Спроба входу:", req.body.email);
    try {
        const { email, password } = req.body;
        
        // Шукаємо користувача за імейлом
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
            return res.status(401).json({ error: 'Користувача з таким E-mail не знайдено' });
        }

        // Перевіряємо, чи правильний пароль
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Пароль невірний' });
        }

        // Якщо все добре, повертаємо ім'я користувача
        res.json({ 
            message: 'Вхід успішний!', 
            user: { name: user.name } 
        });
    } catch (error) {
        console.error("Помилка входу:", error.message);
        res.status(500).json({ error: 'Помилка сервера при спробі входу' });
    }
});

// 5. ЗАПУСК СЕРВЕРА
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер стартував на порту ${PORT}`);
    console.log(`🔗 Посилання для перевірки: https://shukayu-dim-backendl.onrender.com`);
});