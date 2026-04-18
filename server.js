require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// Налаштовуємо CORS максимально відкрито
app.use(cors({
    origin: '*', // Дозволяємо запити з будь-якого сайту
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Головна сторінка
app.get('/', (req, res) => {
    res.send('🚀 Сервер "Шукаю дім" працює і приймає всіх!');
});

// РЕЄСТРАЦІЯ
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: { name, email, password: hashedPassword },
        });
        res.status(201).json({ message: 'Користувача створено!' });
    } catch (error) {
        console.error('Помилка реєстрації:', error);
        res.status(500).json({ error: 'Помилка реєстрації' });
    }
});

// ВХІД
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Користувача не знайдено' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ error: 'Неправильний пароль' });

        res.json({ message: 'Вхід успішний!', user: { name: user.name } });
    } catch (error) {
        console.error('Помилка входу:', error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер на порту ${PORT}`);
});
