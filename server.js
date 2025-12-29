const express = require('express');
const cors = require('cors');
const path = require('path');
const kdsRoutes = require('./routes/kdsRoutes'); // Rotaları içeri al

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ==========================================
// 1. HTML SAYFA ROTALARI (Görünüm)
// ==========================================
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'login.html')); });
app.get('/depolar', (req, res) => { res.sendFile(path.join(__dirname, 'depolar.html')); });
app.get('/simulasyon', (req, res) => { res.sendFile(path.join(__dirname, 'simulasyon.html')); });
app.get('/dashboard', (req, res) => { res.sendFile(path.join(__dirname, 'dashboard.html')); });
app.get('/filo', (req, res) => { res.sendFile(path.join(__dirname, 'filo.html')); });
app.get('/personel', (req, res) => { res.sendFile(path.join(__dirname, 'personel.html')); });

// ==========================================
// 2. API ROTALARI (MVC Yapısı)
// ==========================================
// Tüm /api isteklerini routes klasörüne yönlendir
app.use('/api', kdsRoutes); 

// Sunucuyu Başlat
app.listen(3000, () => { 
    console.log('🚀 MVC KDS Sunucusu Aktif: http://localhost:3000'); 
});