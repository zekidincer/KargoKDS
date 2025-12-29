const mysql = require('mysql2');

// Veritabanı Ayarları
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'KargoKDS_Izmir'
});

// İzmir İlçeleri ve Kategoriler
const ilceler = [
    "Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", 
    "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", 
    "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", 
    "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"
];

const kategoriler = [
    { id: 1, ad: 'Elektronik' }, { id: 2, ad: 'Moda' }, { id: 3, ad: 'Ev, Yaşam' },
    { id: 4, ad: 'Oto, Bahçe' }, { id: 5, ad: 'Anne, Bebek' }, { id: 6, ad: 'Spor, Outdoor' },
    { id: 7, ad: 'Kozmetik' }, { id: 8, ad: 'Süpermarket' }, { id: 9, ad: 'Kitap, Hobi' }
];

db.connect(async (err) => {
    if (err) { console.error('Hata:', err); return; }
    console.log('✅ Veritabanına bağlandı. Veri üretimi başlıyor...');

    // İlçe ID'lerini veritabanından çekelim
    const [ilceRows] = await db.promise().query("SELECT IlceID, IlceAdi FROM Ilceler");
    
    let toplamSatir = 0;
    const query = "INSERT INTO BolgeselTalepAnalizi (IlceID, KategoriID, ToplamTalepHacmiM3, Tarih) VALUES ?";
    let values = [];

    // SON 24 AYIN DÖNGÜSÜ (2023 Ocak - 2024 Aralık)
    for (let yil = 2023; yil <= 2024; yil++) {
        for (let ay = 1; ay <= 12; ay++) {
            
            // Tarih formatı: YYYY-MM-01
            let tarih = `${yil}-${ay.toString().padStart(2, '0')}-01`;

            ilceRows.forEach(ilce => {
                kategoriler.forEach(kat => {
                    // RASTGELE HACİM ÜRET (Mantıklı Sınırlar İçinde)
                    // Büyük ilçelere daha çok hacim verelim
                    let nufusCarpani = ["Konak", "Buca", "Karşıyaka", "Bornova"].includes(ilce.IlceAdi) ? 3 : 1;
                    
                    // Yazın Çeşme/Urla/Foça artsın (Sezonsallık)
                    if(["Çeşme", "Urla", "Foça"].includes(ilce.IlceAdi) && (ay >= 6 && ay <= 9)) {
                        nufusCarpani *= 2; 
                    }

                    // Rastgele sayı: 10 ile 500 arası * Çarpan
                    let hacim = Math.floor(Math.random() * 490 + 10) * nufusCarpani;

                    values.push([ilce.IlceID, kat.id, hacim, tarih]);
                    toplamSatir++;
                });
            });
        }
    }

    // Veriyi parça parça basalım (Bulk Insert)
    if (values.length > 0) {
        db.query(query, [values], (err, res) => {
            if (err) console.error(err);
            else console.log(`🎉 Başarılı! Toplam ${toplamSatir} adet geçmiş veri eklendi.`);
            db.end();
        });
    }
});
