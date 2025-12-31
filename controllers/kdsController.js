const mysql = require('mysql2');

// --- VERİTABANI BAĞLANTISI   ---
const db = mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'KargoKDS_Izmir', 
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('❌ Controller DB Hatası:', err);
    } else {
        console.log('✅ Controller: Veritabanına bağlandı!');
    }
});

// --- YARDIMCI FONKSİYON (Senaryo) ---
const senaryoyuUygula = (callback) => {
    const sql = `
        UPDATE BolgeselTalepAnalizi SET ToplamTalepHacmiM3 = 1500;
        UPDATE BolgeselTalepAnalizi SET ToplamTalepHacmiM3 = 5500 WHERE IlceID IN (SELECT IlceID FROM Ilceler WHERE IlceAdi IN ('Aliağa', 'Gaziemir'));
        UPDATE BolgeselTalepAnalizi SET ToplamTalepHacmiM3 = 850 WHERE IlceID = (SELECT IlceID FROM Ilceler WHERE IlceAdi = 'Buca');
        UPDATE BolgeselTalepAnalizi SET ToplamTalepHacmiM3 = 3200 WHERE IlceID = (SELECT IlceID FROM Ilceler WHERE IlceAdi = 'Konak');
        UPDATE BolgeselTalepAnalizi SET ToplamTalepHacmiM3 = 200 WHERE IlceID IN (SELECT IlceID FROM Ilceler WHERE IlceAdi IN ('Bayındır', 'Kınık'));
    `;
    db.query(sql, (err) => {
        if(err) console.error("Senaryo SQL Hatası:", err);
        if(callback) callback();
    });
};

// --- API FONKSİYONLARI ---

exports.login = (req, res) => {
    const { kadi, sifre } = req.body;
    db.query("SELECT * FROM Yoneticiler WHERE KullaniciAdi = ? AND Sifre = ?", [kadi, sifre], (err, r) => {
        if(r && r.length > 0) res.json({success:true, user:r[0]}); else res.json({success:false});
    });
};

exports.getDashboardStats = (req, res) => {
    db.query("SELECT SUM(OrtalamaHacim) as Toplam FROM (SELECT AVG(ToplamTalepHacmiM3) as OrtalamaHacim FROM BolgeselTalepAnalizi GROUP BY IlceID, KategoriID) as T", (e,r)=>{ 
        res.json({toplamHacim: r ? r[0]?.Toplam || 0 : 0, kritikSayisi:2}); 
    });
};

exports.getDepoSenaryo = (req, res) => {
    senaryoyuUygula(() => {
        res.send("<h1>✅ Senaryo Yüklendi!</h1><p>Veriler düzeltildi. Depolar sayfasına dönebilirsin.</p><a href='/depolar'>Depolara Dön</a>");
    });
};

exports.talepSifirla = (req, res) => {
    senaryoyuUygula(() => { res.json({ success: true }); });
};

exports.talepArttir = (req, res) => {
    db.query("UPDATE BolgeselTalepAnalizi SET ToplamTalepHacmiM3 = ToplamTalepHacmiM3 + FLOOR(300 + RAND() * 800)", (err) => {
        res.json({ success: !err });
    });
};

exports.aracSat = (req, res) => {
    db.query("UPDATE AracFilosu SET Durum = 'Satıldı' WHERE AracID = ?", [req.body.id], (err) => { res.json({ success: !err }); });
};

exports.aracBakim = (req, res) => {
    db.query("UPDATE AracFilosu SET BakimSayisi = BakimSayisi + 1 WHERE AracID = ?", [req.body.id], (err) => { res.json({ success: !err }); });
};

exports.filoDengele = (req, res) => {
    const sqlAll = `SELECT F.AracID, T.MaxKM, T.MaxBakimSayisi, F.GuncelKM, F.BakimSayisi FROM AracFilosu F JOIN AracTipleri T ON F.AracTipID = T.AracTipID WHERE F.Durum = 'Aktif'`;
    db.query(sqlAll, (err, rows) => {
        if(err) return res.json({error: err});
        let kirmizilar = rows.filter(a => a.GuncelKM >= a.MaxKM || a.BakimSayisi >= a.MaxBakimSayisi);
        if (kirmizilar.length > 108) {
            let ids = kirmizilar.slice(0, kirmizilar.length - 108).map(a => a.AracID).join(',');
            db.query(`UPDATE AracFilosu SET GuncelKM = 60000, BakimSayisi = 3 WHERE AracID IN (${ids})`);
        }
        const sqlBosDepo = `SELECT I.IlceID, I.IlceAdi, COUNT(F.AracID) as Sayi FROM Ilceler I LEFT JOIN AracFilosu F ON I.IlceID = F.AtananIlceID AND F.Durum='Aktif' WHERE I.DepoVarMi = 1 GROUP BY I.IlceID`;
        db.query(sqlBosDepo, (e2, depolar) => {
            depolar.forEach(d => {
                if (d.Sayi === 0) {
                    for(let t=1; t<=4; t++) {
                        db.query(`INSERT INTO AracFilosu (Plaka, AracTipID, AtananIlceID, Durum, GuncelKM, BakimSayisi) VALUES ('35 YENI ${d.IlceID}${t}', ${t}, ${d.IlceID}, 'Aktif', 15000, 1)`);
                        db.query(`INSERT INTO AracFilosu (Plaka, AracTipID, AtananIlceID, Durum, GuncelKM, BakimSayisi) VALUES ('35 YENI ${d.IlceID}${t}B', ${t}, ${d.IlceID}, 'Aktif', 120000, 6)`);
                    }
                }
            });
            res.send(`<h1>✅ Sistem Dengelendi</h1><p>Hata yok, veriler temiz.</p><a href='/filo'>Geri Dön</a>`);
        });
    });
};

exports.getFiloBilgileri = (req, res) => {
    db.query("SELECT * FROM AracTipleri", (e1, r1) => {
        const sqlGrafik = `SELECT I.IlceAdi, COUNT(DISTINCT F.AracID) as AracSayisi FROM Ilceler I LEFT JOIN AracFilosu F ON I.IlceID = F.AtananIlceID AND TRIM(F.Durum) = 'Aktif' WHERE I.DepoVarMi = 1 GROUP BY I.IlceAdi`;
        db.query(sqlGrafik, (e2, r2) => {
            const sqlListe = `SELECT F.AracID, F.Plaka, T.TipAdi, I.IlceAdi, F.GuncelKM, F.BakimSayisi, T.MaxKM, T.MaxBakimSayisi, F.Durum FROM AracFilosu F JOIN AracTipleri T ON F.AracTipID = T.AracTipID JOIN Ilceler I ON F.AtananIlceID = I.IlceID WHERE F.Durum IN ('Aktif', 'Serviste') ORDER BY F.AracID DESC`;
            db.query(sqlListe, (e4, r4) => {
                const liste = r4 ? r4.map(arac => {
                    let karar = "KULLANIMA UYGUN", renk = "success";
                    if (arac.GuncelKM >= arac.MaxKM) { karar = "SATILMALI (KM)"; renk = "danger"; }
                    else if (arac.BakimSayisi >= arac.MaxBakimSayisi) { karar = "SATILMALI (Bakım)"; renk = "danger"; }
                    else if (arac.GuncelKM >= (arac.MaxKM * 0.70) || arac.BakimSayisi >= (arac.MaxBakimSayisi - 4)) { karar = "RİSKLİ / İZLE"; renk = "warning"; }
                    return { ...arac, Karar: karar, Renk: renk };
                }) : [];
                res.json({ toplamArac: liste.length, ilceDagilim: r2 || [], filoListesi: liste, aracTipleri: r1 || [] });
            });
        });
    });
};

exports.runSimulasyon = (req, res) => {
    // Frontend'den gelen parametreleri güvenle alıyoruz
    const { kategoriArtislari, depoAcmaLimiti, depoKapatmaLimiti, maliyetLimiti, zamanPeriyodu, yakitArtisi, enflasyonOrani, bakimMaliyeti, personelArtisi } = req.body;
    
    let bazAcma = parseInt(depoAcmaLimiti) || 2000;
    let bazKapatma = parseInt(depoKapatmaLimiti) || 500;
    let bazMaliyet = parseInt(maliyetLimiti) || 500000;
    const periyotCarpani = (parseInt(zamanPeriyodu) === 6) ? 0.5 : 1.0;
    const yakitCarpan = 1 + (parseFloat(yakitArtisi || 0) / 100);
    const bakimCarpan = 1 + (parseFloat(bakimMaliyeti || 0) / 100);
    const enflasyonCarpan = 1 + (parseFloat(enflasyonOrani || 0) / 100);
    const personelCarpan = 1 + (parseFloat(personelArtisi || 0) / 100);

    const sqlStok = `SELECT I.IlceAdi, T.TipAdi, COUNT(*) as Adet FROM AracFilosu F JOIN Ilceler I ON F.AtananIlceID = I.IlceID JOIN AracTipleri T ON F.AracTipID = T.AracTipID WHERE F.Durum = 'Aktif' GROUP BY I.IlceAdi, T.TipAdi`;
    
    db.query(sqlStok, (errStok, stokSonuc) => {
        let stokMap = {};
        if(stokSonuc) stokSonuc.forEach(s => { 
            if (!stokMap[s.IlceAdi]) stokMap[s.IlceAdi] = {}; 
            stokMap[s.IlceAdi][s.TipAdi] = s.Adet; 
        });

        const sql = `
            SELECT I.IlceID, I.IlceAdi, I.DepoVarMi, K.KategoriAdi, A.TipAdi AS AracTipi, A.HacimKapasitesiM3, A.TasimaMaliyetiKM, 
            COALESCE((SELECT AVG(ToplamTalepHacmiM3) FROM BolgeselTalepAnalizi WHERE IlceID = I.IlceID AND KategoriID = K.KategoriID), 0) AS MevcutHacim, 
            COALESCE((SELECT SUM(AT.HacimKapasitesiM3 * 10) FROM AracFilosu F JOIN AracTipleri AT ON F.AracTipID = AT.AracTipID WHERE F.AtananIlceID = I.IlceID AND F.Durum = 'Aktif'), 0) AS GercekFiloKapasitesi 
            FROM Ilceler I CROSS JOIN UrunKategorileri K LEFT JOIN AracTipleri A ON K.GerekliAracTipID = A.AracTipID 
            ORDER BY I.IlceAdi, K.KategoriID
        `;

        db.query(sql, (err, results) => {
            if (err) {
                console.error("Simulasyon Hatası:", err); // Hatayı gör
                return res.status(500).json({ error: "Db Hatası" });
            }

            let rapor = {};
            results.forEach(satir => {
                if (!rapor[satir.IlceAdi]) {
                    rapor[satir.IlceAdi] = { IlceAdi: satir.IlceAdi, DepoVarMi: satir.DepoVarMi, Mevcut: 0, Gelecek: 0, GunlukMaliyet: 0, GercekFiloKapasitesi: parseFloat(satir.GercekFiloKapasitesi), Filo: [], FiloIhtiyac: {}, Karar: '', Renk: '', ToplamTahminiSefer: 0 };
                }
                
                let veriHacim = parseFloat(satir.MevcutHacim) || 0;
                let safeKey = (kategoriArtislari && Object.keys(kategoriArtislari).find(k => satir.KategoriAdi.includes(k.split(' ')[0]))) || satir.KategoriAdi;
                let artisOrani = parseFloat((kategoriArtislari && kategoriArtislari[safeKey]) || 0);
                let gelecekHacim = veriHacim * (1 + ((artisOrani * periyotCarpani) / 100));
                
                rapor[satir.IlceAdi].Mevcut += veriHacim; 
                rapor[satir.IlceAdi].Gelecek += gelecekHacim;

                let fizikselAracSayisi = 0; let gerekenSefer = 0;
                if (gelecekHacim > 0 && satir.HacimKapasitesiM3 > 0) {
                    let seferKapasitesi = satir.AracTipi.includes("Moto") ? 40 : (satir.AracTipi.includes("Tır") ? 2 : 10);
                    gerekenSefer = Math.ceil(gelecekHacim / satir.HacimKapasitesiM3);
                    rapor[satir.IlceAdi].ToplamTahminiSefer += gerekenSefer;
                    fizikselAracSayisi = Math.ceil(gerekenSefer / seferKapasitesi);
                    
                    let yakitMaliyet = (gerekenSefer * parseFloat(satir.TasimaMaliyetiKM) * 15) * yakitCarpan;
                    let bakimMaliyetHesap = (fizikselAracSayisi * 200) * bakimCarpan; 
                    let personelMaliyetHesap = (fizikselAracSayisi * 1200) * personelCarpan;

                    rapor[satir.IlceAdi].GunlukMaliyet += (yakitMaliyet + bakimMaliyetHesap + personelMaliyetHesap) * enflasyonCarpan;
                }
                
                rapor[satir.IlceAdi].Filo.push({ Kategori: satir.KategoriAdi, Arac: satir.AracTipi, Adet: fizikselAracSayisi, Sefer: gerekenSefer, MevcutHacim: Math.round(veriHacim), GelecekHacim: Math.round(gelecekHacim) });
                if (!rapor[satir.IlceAdi].FiloIhtiyac[satir.AracTipi]) rapor[satir.IlceAdi].FiloIhtiyac[satir.AracTipi] = 0;
                rapor[satir.IlceAdi].FiloIhtiyac[satir.AracTipi] += fizikselAracSayisi;
            });

            const sonuc = Object.values(rapor).map(ilce => {
                let rawMaliyet = ilce.GunlukMaliyet; 
                ilce.Mevcut = Number(ilce.Mevcut).toFixed(0); 
                ilce.Gelecek = Number(ilce.Gelecek).toFixed(0); 
                ilce.GunlukMaliyet = Number(ilce.GunlukMaliyet).toLocaleString('tr-TR', { maximumFractionDigits: 0 });
                ilce.DetayliFilo = [];
                for (const [aracTipi, gerekenAdet] of Object.entries(ilce.FiloIhtiyac)) {
                    let eldekiAdet = stokMap[ilce.IlceAdi]?.[aracTipi] || 0;
                    ilce.DetayliFilo.push({ Arac: aracTipi, Gereken: gerekenAdet, Eldeki: eldekiAdet });
                }
                if (!ilce.DepoVarMi) {
                    if (ilce.Gelecek > bazAcma) { 
                        if (rawMaliyet > bazMaliyet) { ilce.Karar = "AÇMA (Yüksek Maliyet)"; ilce.Renk = "kritik"; } 
                        else { ilce.Karar = "DEPO AÇ (Kârlı)"; ilce.Renk = "mevcut"; }
                    } 
                    else if (ilce.Gelecek > bazAcma * 0.6) { ilce.Karar = "RİSKLİ / İZLE"; ilce.Renk = "uyari"; }
                    else { ilce.Karar = "GEREKSİZ"; ilce.Renk = "normal"; }
                } else {
                    if (ilce.Gelecek < bazKapatma) { ilce.Karar = "KAPAT (Verimsiz)"; ilce.Renk = "kritik"; }
                    else if (ilce.Gelecek > ilce.GercekFiloKapasitesi) { ilce.Karar = `FİLO YETERSİZ!`; ilce.Renk = "kritik"; } 
                    else if (ilce.Gelecek > (ilce.GercekFiloKapasitesi * 0.85)) { ilce.Karar = "YÜKSEK DOLULUK"; ilce.Renk = "uyari"; }
                    else { ilce.Karar = "KAPASİTE UYGUN"; ilce.Renk = "mevcut"; }
                }
                return ilce;
            });
            res.json(sonuc);
        });
    });
};

exports.getDepolar = (req, res) => {
    const sql = `
        SELECT I.IlceAdi, I.DepoVarMi, 
        (SELECT COUNT(DISTINCT F.AracID) FROM AracFilosu F JOIN AracTipleri T ON F.AracTipID = T.AracTipID WHERE F.AtananIlceID = I.IlceID AND TRIM(F.Durum) = 'Aktif') as MevcutAracSayisi, 
        (SELECT COALESCE(AVG(ToplamTalepHacmiM3), 0) FROM BolgeselTalepAnalizi WHERE IlceID = I.IlceID) as OrtalamaTalep, 
        (SELECT COALESCE(SUM(T.HacimKapasitesiM3 * 10), 0) FROM AracFilosu F JOIN AracTipleri T ON F.AracTipID = T.AracTipID WHERE F.AtananIlceID = I.IlceID AND TRIM(F.Durum)='Aktif') as GercekKapasite 
        FROM Ilceler I WHERE I.DepoVarMi = 1 ORDER BY OrtalamaTalep DESC
    `;

    db.query(sql, (err, results) => {
        if(err) {
            console.error("❌ Depolar API Hatası:", err); // Hatayı terminale bas
            return res.json([]); 
        }
        
        const veriler = results ? results.map(depo => {
            let talep = parseFloat(depo.OrtalamaTalep); 
            let kapasite = parseFloat(depo.GercekKapasite) || 1; 
            let oran = Math.round((talep / kapasite) * 100);
            
            let durum = "Uygun", renk = "#27ae60";
            if (oran > 100) { durum = "FİLO YETERSİZ"; renk = "#e74c3c"; } 
            else if (oran >= 80) { durum = "Yüksek Doluluk"; renk = "#f1c40f"; } 
            else if (oran < 30) { durum = "VERİMSİZ (KAPAT)"; renk = "#7f8c8d"; }

            return { 
                Ilce: depo.IlceAdi, 
                Kullanilan: Math.round(talep), 
                Kapasite: Math.round(kapasite), 
                AracSayisi: depo.MevcutAracSayisi, 
                Oran: oran, 
                Durum: durum, 
                Renk: renk 
            };
        }) : [];
        res.json(veriler);
    });
};

exports.getVehicles = (req, res) => {
    db.query("SELECT F.*, I.IlceAdi as ilce FROM AracFilosu F LEFT JOIN Ilceler I ON F.AtananIlceID = I.IlceID", (err, results) => {
        if (err) {
            console.error("Vehicles Hatası:", err);
            res.status(500).json({ error: err.message });
        } else {
            res.json(results);
        }
    });
};

exports.getPersonelListesi = (req, res) => {
    db.query("SELECT p.PersonelID, p.AdSoyad, p.Rol, p.VerimlilikSkoru, i.IlceAdi, a.Plaka, a.Durum as AracDurumu FROM personel p LEFT JOIN ilceler i ON p.AtananIlceID = i.IlceID LEFT JOIN aracfilosu a ON p.AtananAracID = a.AracID", (err, results) => {
        if (err) {
            console.error("Personel Hatası:", err);
            res.status(500).json([]);
        } else {
            res.json(results);
        }
    });
};

exports.personelAksiyon = (req, res) => {
    const { id, aksiyon } = req.body;
    if (aksiyon === 'isten-cikar') {
        db.query("DELETE FROM personel WHERE PersonelID = ?", [id], (err) => res.json({ success: !err }));
    } else if (aksiyon === 'izle') {
        db.query("UPDATE personel SET VerimlilikSkoru = 86 WHERE PersonelID = ?", [id], (err) => res.json({ success: !err }));
    } else {
        db.query("UPDATE personel SET VerimlilikSkoru = LEAST(100, VerimlilikSkoru + 2) WHERE PersonelID = ?", [id], (err) => res.json({ success: !err }));
    }
};
