from fastapi import FastAPI

# FastAPI uygulamasını oluştur
app = FastAPI()

# Ana yolu ("/") tanımla
@app.get("/")
def read_root():
    # Bu, /api/v1/telemetry/latest (SIN-11) gibi 
    # görevlerinizin nasıl çalışacağına bir örnektir.
    return {"Proje": "Yapay Zekâ Destekli Hafif-Ölçekli C4ISR Prototipi", "Status": "SIN-8 Tamamlandı"}