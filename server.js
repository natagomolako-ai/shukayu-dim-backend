require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const axios = require('axios');

const app = express();
const prisma = new PrismaClient();

// Дозволяємо приймати великі запити (до 10 мегабайт), щоб влізли фото
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


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

// ==========================================
// 4.5. РОБОТА З ТВАРИНКАМИ (ОГОЛОШЕННЯ)
// ==========================================

// А) ВІДДАЄМО список тваринок в Адмінку
app.get('/api/pets', async (req, res) => {
    try {
        // Просимо базу Prisma віддати всіх тваринок, нові будуть зверху
        const pets = await prisma.pet.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(pets);
    } catch (error) {
        console.error("Помилка при отриманні тварин:", error);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

// Б) ЗБЕРІГАЄМО нову тваринку з форми "Додати"
app.post('/api/pets', async (req, res) => {
    try {
        // Prisma бере дані з форми і створює новий запис у базі
        const newPet = await prisma.pet.create({
            data: {
                name: req.body.name || null,
                type: req.body.type,
                gender: req.body.gender,
                age: req.body.age,
                sterilization: req.body.sterilization,
                vaccination: req.body.vaccination,
                region: req.body.region,
                city: req.body.city,
                description: req.body.description,
                photo: req.body.photo || null
            }
        });
        // Відповідаємо фронтенду, що все супер (код 201)
        res.status(201).json({ message: 'Анкету успішно відправлено на перевірку!', pet: newPet });
    } catch (error) {
        console.error("Помилка при збереженні тваринки:", error);
        res.status(500).json({ error: 'Не вдалося зберегти анкету в базу' });
    }
});

// В) ОПУБЛІКУВАТИ анкету (змінити статус на published)
app.put('/api/pets/:id/publish', async (req, res) => {
    try {
        const updatedPet = await prisma.pet.update({
            where: { id: req.params.id },
            data: { status: 'published' }
        });
        res.json({ message: 'Опубліковано успішно!' });
    } catch (error) {
        console.error("Помилка публікації:", error);
        res.status(500).json({ error: 'Не вдалося змінити статус' });
    }
});

// Г) ВИДАЛИТИ анкету назавжди
app.delete('/api/pets/:id', async (req, res) => {
    try {
        await prisma.pet.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Анкету видалено!' });
    } catch (error) {
        console.error("Помилка видалення:", error);
        res.status(500).json({ error: 'Не вдалося видалити' });
    }
});


// 5. ЗАПУСК СЕРВЕРА
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер стартував на порту ${PORT}`);
});

// 6. САМОПІНГ (Щоб не спав Render та база Aiven)
setInterval(async () => {
  try {
    await axios.get('https://shukayu-dim-backendi.onrender.com');
    await prisma.$queryRaw`SELECT 1`; 
    console.log('⏰ Будильник спрацював: Бекенд та База активні!');
  } catch (err) {
    console.error('❌ Помилка будильника:', err.message);
  }
}, 600000); // 10 хвилин

