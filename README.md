# AI-Supported-Lightweight-C4ISR-Prototype-SINAPS

## 1. Proje Tanımı

Bu depo, "Yapay Zekâ Destekli Hafif-Ölçekli C4ISR Prototipi" bitirme projesinin ana kod deposudur. Proje, akademik raporlama ve prototip geliştirme takvimlerini entegre bir şekilde yürütmeyi amaçlar.

Prototip geliştirmesi, "simülatör-öncelikli" ve "aşamalı donanım entegrasyonu" metodolojisini benimser. Bu, yazılım bileşenlerinin (Backend, Frontend, AI) donanım gecikmelerinden bağımsız ilerlemesini sağlar.

## 2. Ekip ve Sorumluluklar

Proje yönetimi ve görev takibi Jira platformu üzerinden yapılacaktır.

* **Murat Can Barçin (Proje Koordinasyonu | Backend & AI Lideri)**
    * Sorumluluk Alanları: Jira koordinasyonu, ana backend (Spring Boot), AI mikroservisi (FastAPI), veritabanı mimarisi (PostgreSQL + PostGIS), AI/ML modülleri ve Dashboard Analiz Bileşeni.
* **Sarp Deniz Topaloğlu (Donanım Lideri)**
    * Sorumluluk Alanları: Fiziksel prototipleme (ESP32), donanım programlama ve fiziksel saha testleri.
* **Emirhan Güler (Entegrasyon Lideri)**
    * Sorumluluk Alanları: Real-time iletişim altyapısı (MQTT / Kafka), Python simülatör script'leri, veri füzyonu ve Harita Bileşeni (React + Leaflet.js).

## 3. Teknoloji Mimarisi

* **Yönetim:** Jira
* **Ana backend:** Java (Spring Boot), API `8080`
* **AI mikroservisi:** Python (FastAPI), API `8000` — `ai-service/`
* **Frontend:** React ve Leaflet.js
* **Veritabanı:** PostgreSQL + PostGIS
* **Real-time:** MQTT / Kafka
* **Simülatörler:** Python
* **Donanım:** ESP32

## 4. Proje Klasör Yapısı

/AI-Supported-Lightweight-C4ISR-Prototype-SINAPS/

|

|--- /backend/          (Spring Boot — birincil REST, MQTT, JPA)

|--- /ai-service/       (FastAPI — AI / RAG / analiz)

|--- /frontend/

|--- /hardware/

|--- /simulators/

|--- /documentation/

|--- README.md

|--- .gitignore

## 5. Kurulum ve Çalıştırma Talimatları

### Gerekli Ön Kurulumlar

* **Git:** Kodları indirmek ve güncellemek için.
* **JDK 17+:** `backend/` (Spring Boot).
* **Python 3.9+:** `ai-service/`, simülatörler; Windows’ta Anaconda kullanıyorsanız PATH’te `anaconda3`, `anaconda3\Scripts` diğer Python kurulumlarının üstünde olmalı.
* **PostgreSQL (+ PostGIS):** Varsayılan bağlantı `localhost:5433`, veritabanı ve kullanıcı `backend/src/main/resources/application.properties` içindedir (`ai-service` kendi ayarlarında farklı port kullanabilir).
* **Node.js ve npm:** Frontend (React).
* **VS Code / IntelliJ:** Önerilen editörler.

---

### A. Ana Backend (Spring Boot)

1. `cd backend`
2. Geliştirme sunucusu:
   ```bash
   # Windows
   .\mvnw.cmd spring-boot:run

   # macOS / Linux
   ./mvnw spring-boot:run
   ```
3. API varsayılan olarak `http://localhost:8080` üzerinde çalışır.

---

### B. AI Mikroservisi (`ai-service/`)

Windows’ta önerilen yol: proje kökünden `ai-service\run-local.bat` dosyasına çift tıklayın veya:

```bash
cd ai-service
run-local.bat
```

Bu betik UTF-8 konsol ayarlar, `pip install -r requirements.txt` çalıştırır ve **`python -m uvicorn`** ile servisi başlatır (yalnızca `uvicorn` yazmak, PATH’te birden fazla Python varken yanlış kurulumu seçebilir).

Manuel başlatma (örnek):

```bash
cd ai-service
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Tam model / RAG / eğitim yığını için ek paketler `requirements-train.txt` ile kurulabilir.

---

### C. Frontend Kurulumu 

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
    Uygulama `http://localhost:3000` adresinde açılacaktır. API adresleri yapılandırmaya göre değişir: ana backend `8080`, AI servisi `8000`.

---

### D. Simülatör Kurulumu

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

### E. Donanım (Hardware)

`/hardware/` klasörü, ESP32 prototipleri için geliştirilen (Arduino/PlatformIO) kodlarını içerir. Bu kodlar, `Veri Kontratı` formatına uygun JSON üretecek ve bunu MQTT sunucusuna gönderecektir.

Bu klasördeki kodlar standart `python` veya `npm` komutlarıyla çalıştırılmaz; ilgili donanıma (ESP32) flash'lanması (yüklenmesi) gerekir.