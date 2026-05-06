const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-2c98aeb9-gaming-59f3.b.aivencloud.com',
    port: process.env.DB_PORT || 24076,
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD || 'AVNS_L7k5SocUokPM6bteeYW', // ⚠️ مهم جداً: استبدل دي بالباسورد الحقيقية من موقع Aiven 
    database: process.env.DB_NAME || 'defaultdb',
    ssl: {
        rejectUnauthorized: false // السطر ده مهم جداً للاتصال بقواعد بيانات Aiven علشان بتطلب اتصال مشفر
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// تجربة الاتصال للتأكد من نجاحه
promisePool.query('SELECT 1')
    .then(() => console.log('Connected successfully to Aiven MySQL Cloud Database!'))
    .catch(err => console.error('Failed to connect to database:', err.message));

module.exports = promisePool;