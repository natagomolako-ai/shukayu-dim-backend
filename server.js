require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const app = express();
const prisma = new PrismaClient();

// Налаштовуємо CORS (дозволяємо все, щоб точно спрацювало)
app.use(cors());
app.use(express.json());

// Цей шлях ми перевірятимемо в браузері
app.get('/', (req, res) => {
    console.log("Хтось зайшов на головну сторінку!");
    res.send('🚀 Сервер "Шукаю дім" ПРАЦЮЄ! Масюсік передає привіт 🐾');
});

// Реєстрація
app.post('/register', async (req, res) => {
    console.log("Спроба реєстрації:", req.body.email);
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

// Вхід
app.post('/login', async (req, res) => {
    console.log("Спроба входу:", req.body.email);
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Користувача не знайдено' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Пароль невірний' });

        res.json({ message: 'Успішно', user: { name: user.name } });
    } catch (error) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер стартував на порту ${PORT}`);
});