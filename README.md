# AI-Supported-Lightweight-C4ISR-Prototype-SINAPS

## 1. Proje Tanımı

Bu depo, "Yapay Zekâ Destekli Hafif-Ölçekli C4ISR Prototipi" bitirme projesinin ana kod deposudur. Proje, akademik raporlama ve prototip geliştirme takvimlerini entegre bir şekilde yürütmeyi amaçlar.

Prototip geliştirmesi, "simülatör-öncelikli" ve "aşamalı donanım entegrasyonu" metodolojisini benimser. Bu, yazılım bileşenlerinin (Backend, Frontend, AI) donanım gecikmelerinden bağımsız ilerlemesini sağlar.

## 2. Ekip ve Sorumluluklar

Proje yönetimi ve görev takibi Jira platformu üzerinden yapılacaktır.

* **Murat Can Barçin (Proje Koordinasyonu | Backend & AI Lideri)**
    * Sorumluluk Alanları: Jira koordinasyonu, Backend API geliştirme (FastAPI), veritabanı mimarisi (PostgreSQL + PostGIS), AI/ML modülleri ve Dashboard Analiz Bileşeni.
* **Sarp Deniz Topaloğlu (Donanım Lideri)**
    * Sorumluluk Alanları: Fiziksel prototipleme (ESP32), donanım programlama ve fiziksel saha testleri.
* **Emirhan Güler (Entegrasyon Lideri)**
    * Sorumluluk Alanları: Real-time iletişim altyapısı (MQTT / Kafka), Python simülatör script'leri, veri füzyonu ve Harita Bileşeni (React + Leaflet.js).

## 3. Teknoloji Mimarisi

* **Yönetim:** Jira
* **Backend:** Python (FastAPI)
* **Frontend:** React ve Leaflet.js
* **Veritabanı:** PostgreSQL + PostGIS
* **Real-time:** MQTT / Kafka
* **Simülatörler:** Python
* **Donanım:** ESP32

## 4. Proje Klasör Yapısı

/AI-Supported-Lightweight-C4ISR-Prototype-SINAPS/

|

|--- /backend/         (Murat: FastAPI, AI, Veritabanı kodları)

|--- /frontend/        (Emirhan/Murat: React, Leaflet.js kodları)

|--- /hardware/        (Sarp: ESP32 donanım kodları)

|--- /simulators/      (Emirhan: Python simülatör script'leri)

|--- /documentation/   (Akademik raporlar, mimari çizimler, Veri Kontratı)

|--- .gitignore        (Yüklenmemesi gereken dosyaları (venv, .env) engeller)

|--- README.md         (Bu dosya)

## 5. Kurulum ve Çalıştırma Talimatları

### Gerekli Ön Kurulumlar

* **Git:** Kodları indirmek ve güncellemek için.
* **Python 3.7+:** Backend ve Simülatörler için.
* **Node.js ve npm:** Frontend (React) için.
* **VS Code:** Önerilen kod editörümüz.

---

### A. Backend Kurulumu 

Backend servisi (API, AI, DB), projenin beynidir.

1.  **Klasöre Git:**
    ```bash
    cd backend
    ```
2.  **Sanal Ortam (venv) Oluştur:**
    ```bash
    python -m venv venv
    ```
3.  **Sanal Ortamı Aktif Et:**
    ```bash
    # Windows
    .\venv\Scripts\activate
    
    # macOS / Linux
    source venv/bin/activate
    ```
4.  **Gereksinimleri Yükle:**
    ```bash
    pip install -r requirements.txt
    ```
5.  **Sunucuyu Başlat (Geliştirme Modu):**
    ```bash
    # API'yi herkesin (diğer ekip üyelerinin) erişebilmesi için --host 0.0.0.0 ile başlat
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```
    Sunucu `http://<LOKAL_IP_ADRESINIZ>:8000` adresinde çalışacaktır.

---

### B. Frontend Kurulumu 

Frontend, React ile geliştirilen "Durumsal Farkındalık Dashboard"udur.

1.  **Klasöre Git:**
    ```bash
    cd frontend
    ```
2.  **Node.js Bağımlılıklarını Yükle:**
    ```bash
    npm install
    ```
3.  **Geliştirme Sunucusunu Başlat:**
    ```bash
    npm start
    ```
    Uygulama `http://localhost:3000` adresinde açılacaktır. (Not: Backend'e bağlanmak için kod içinde Murat'ın lokal IP'sini (`http://<Murat_IP>:8000`) kullanman gerekecek.)

---

### C. Simülatör Kurulumu

Simülatörler, donanımlar hazır olana kadar sistemi test etmek için "Veri Kontratı"na uygun sahte JSON verisi üretecektir.

1.  **Klasöre Git:**
    ```bash
    cd simulators
    ```
2.  **Sanal Ortam (venv) Oluştur:**
    ```bash
    python -m venv venv
    ```
3.  **Sanal Ortamı Aktif Et:**
    ```bash
    # Windows
    .\venv\Scripts\activate
    
    # macOS / Linux
    source venv/bin/activate
    ```
4.  **Gereksinimleri Yükle:** (Buradaki `requirements.txt` MQTT istemcisi vb. içerecek)
    ```bash
    pip install -r requirements.txt
    ```
5.  **Simülatörü Çalıştır:** (Örn: `drone_simulator.py`)
    ```bash
    python drone_simulator.py
    ```

---

### D. Hardware 

`/hardware/` klasörü, ESP32 prototipleri için geliştirilen (Arduino/PlatformIO) kodlarını içerir. Bu kodlar, `Veri Kontratı` formatına uygun JSON üretecek ve bunu MQTT sunucusuna gönderecektir.

Bu klasördeki kodlar standart `python` veya `npm` komutlarıyla çalıştırılmaz; ilgili donanıma (ESP32) flash'lanması (yüklenmesi) gerekir.