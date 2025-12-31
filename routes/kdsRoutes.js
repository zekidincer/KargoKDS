const express = require('express');
const router = express.Router();
const kdsController = require('../controllers/kdsController');

// URL Eşleşmeleri  //

router.post('/login', kdsController.login);
router.get('/dashboard-stats', kdsController.getDashboardStats);

router.get('/depo-senaryo', kdsController.getDepoSenaryo);
router.post('/talep-sifirla', kdsController.talepSifirla);
router.post('/talep-arttir', kdsController.talepArttir);

router.post('/arac-sat', kdsController.aracSat);
router.post('/arac-bakim', kdsController.aracBakim);
router.get('/filo-dengele', kdsController.filoDengele);
router.get('/filo-bilgileri', kdsController.getFiloBilgileri);

router.post('/simulasyon', kdsController.runSimulasyon);

router.get('/depolar', kdsController.getDepolar);
router.get('/vehicles', kdsController.getVehicles);

router.get('/personel-listesi', kdsController.getPersonelListesi);
router.post('/personel-aksiyon', kdsController.personelAksiyon);

module.exports = router;
