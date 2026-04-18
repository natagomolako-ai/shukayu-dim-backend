require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Головна сторінка
app.get('/', (req, res) => {
    res.send('Сервер "Шукаю дім" працює!');
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
        console.error(error);
        res.status(500).json({ error: 'Помилка реєстрації. Можливо, email вже зайнятий.' });
    }
});

// ВХІД (ЛОГІН)
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Шукаємо користувача
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Користувача не знайдено' });
        }

        // Перевіряємо пароль
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неправильний пароль' });
        }

        res.json({ 
            message: 'Вхід успішний!',
            user: { name: user.name, email: user.email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на http://localhost:${PORT}`);
});