require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// Налаштування доступу (CORS) - дозволяємо запити з будь-яких джерел
app.use(cors());
app.use(express.json());

// Головна сторінка для перевірки
app.get('/', (req, res) => {
    res.send('🚀 Сервер "Шукаю дім" успішно працює в хмарі!');
});

// РЕЄСТРАЦІЯ
app.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: { name, email, password: hashedPassword },
        });
        res.status(201).json({ message: 'Користувача створено!' });
    } catch (error) {
        console.error('Помилка реєстрації:', error);
        res.status(500).json({ error: 'Помилка реєстрації. Можливо, такий email вже існує.' });
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

// ДИНАМІЧНИЙ ПОРТ - Найважливіше для Render!
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущено на порту ${PORT}`);
});