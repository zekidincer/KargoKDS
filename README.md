# 🚚 Zeka Kargo - Karar Destek Sistemi (KDS)

Bu proje, İzmir genelinde faaliyet gösteren kurgusal **"Zeka Kargo"** firması için geliştirilmiş, veri analitiği odaklı bir **Karar Destek Sistemi (KDS)** uygulamasıdır. Sistem, yönetici kadrosuna operasyonel verimliliği artırmak için somut kararlar üretme yeteneği sunar.

## 🏗️ Teknik Mimari (Katı MVC Yapısı)

Proje, akademik ve profesyonel standartlara uygun olarak **MVC (Model-View-Controller)** mimarisi üzerine inşa edilmiştir:

* **Model:** Veritabanı şemaları ve güvenli bağlantı yönetimi.
* **View:** Bootstrap ve Chart.js ile zenginleştirilmiş, kullanıcı dostu HTML5 arayüzleri.
* **Controller (`kdsController.js`):** Karar verme algoritmalarının ve iş mantığının (Business Logic) merkezi.
* **Routes (`kdsRoutes.js`):** API uç noktalarının ve sayfa yönlendirmelerinin yönetimi.

## 🧠 Öne Çıkan Karar Destek Özellikleri

Sistem, sadece veri raporlamakla kalmaz, karmaşık senaryolar üzerinde **yönetsel kararlar** üretir:

1.  **Dinamik Filo Dengeleme:** İlçelerdeki talep yoğunluğunu analiz ederek, araç bulunmayan depolara otomatik araç atama kararı verir (Create/Update senaryosu).
2.  **Maliyet Odaklı Depo Simülasyonu:** Gelecek hacim tahminlerini; yakıt artışı, enflasyon ve personel giderleriyle harmanlayarak "Depo Aç", "Kapat" veya "Riskli/İzle" gibi stratejik çıktılar sunar.
3.  **Akıllı Araç Yönetimi:** Araçların teknik limitlerini (KM, bakım sayısı) izleyerek otomatik "SATILMALI" statüsü atar.
4.  **Personel Performans Yönetimi:** Verimlilik skorlarına göre personel üzerinde CRUD (Ekle, Oku, Güncelle, Sil) işlemleri ve gelişim takibi sağlar.

## ⚙️ Güvenlik ve Yapılandırma

* **Environment Config (.env):** Veritabanı şifreleri ve hassas bilgiler kodun içinde değil, `.env` dosyasında saklanarak güvenli bir mimari sağlanmıştır.
* **Modüler Yapı:** `package.json` üzerinden yönetilen bağımlılıklar ile kolay kurulum imkanı sunulmuştur.

## 🚀 Kurulum ve Çalıştırma

1.  Bağımlılıkları yükleyin:
    ```bash
    npm install
    ```
2.  Proje ana dizinine `.env` dosyasını ekleyin:
    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASS=
    DB_NAME=KargoKDS_Izmir
    ```
3.  Uygulamayı başlatın:
    ```bash
    npm start
    ```
4.  Tarayıcıdan erişin: `http://localhost:3000`

## 📊 Veri Seti Üretimi
`veri_bas.js` betiği, İzmir'in 30 ilçesi için geçmiş 24 aylık, sezonluk çarpanlar içeren gerçekçi bir talep veri seti üretmektedir.
