const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();

app.use(cors({
    origin: '*', // أو ضع رابط موقعك على Netlify بدلاً من '*'
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const studentRoutes = require('./routes/studentRoutes');
app.use('/api/student', studentRoutes);

const professorRoutes = require('./routes/professorRoutes');
app.use('/api/professor', professorRoutes);

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.send('Server Connect Successfully');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} and open to the network`);
});