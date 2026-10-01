# 🎮 CASE CLASH | CS2 & VALORANT Skin Kasa Açma Arenası

**Railway.app Hosting Uyumlu** | Gerçek Skin Fotoğrafları | HWID Koruma & Çoklu Sekme Engeli | 30 Dk Bot Pazar Sistemi | Canlı Takas & Sohbet

---

## 🌟 Proje Özellikleri

1. **HWID Bazlı Oyuncu Girişi & İlk Girişte 5 Bakiye (1 Bakiye = 1 Kasa):**
   - Tarayıcının Canvas, WebGL, Donanım parametreleri ve AudioContext verilerinden benzersiz bir **HWID (Donanım Kimliği)** üretilir.
   - Bu HWID sistemde **ilk defa** görülüyorsa oyuncuya **5 Ücretsiz Bakiye** tanımlanır.
   - Aynı HWID üzerinden farklı isimle çoklu hesap açılsa dahi 5 bakiye hakkı tekrar verilmez (0 bakiye ile başlar).

2. **Aynı HWID'den Çoklu Sekme (Multi-Tab) Engeli:**
   - Aynı cihaz veya tarayıcıdan ikinci bir sekme açıldığında sistem bunu anında algılar ve ikinci sekmede **"Aynı HWID ile Aktif Oturum Var!"** tam ekran uyarısı vererek erişimi kilitler.

3. **Gerçek Skin Fotoğrafları:**
   - **CS2:** Steam Topluluk CDN ve resmi CS2 varlıkları (AWP Dragon Lore, M4A4 Howl, Karambit Fade, Kelebek Fade/Doppler, Printstream vb.).
   - **VALORANT:** Riot Games resmi CDN yüksek çözünürlüklü şeffaf ikonları (media.valorant-api.com).

4. **CS2 ve VALORANT Kasaları Tercihi:**
   - Oyuncular ana sayfada CS2 ve Valorant sekmeleri arasında tek tıkla geçiş yapabilir.
   - Her oyun için popüler tematik kasalar mevcuttur.

5. **Sevilen VALORANT Bıçakları (Özel Seçilmiş):**
   - Düşük kaliteli bıçaklar elenmiştir. Yalnızca topluluğun en çok sevdiği efsanevi bıçaklar eklenmiştir:
     - *Kuronami no Yaiba*
     - *Reaver Karambit (Yağmacı Karambit)*
     - *Champions 2021 Karambit*
     - *Champions 2022 Butterfly (Kelebek)*
     - *Ignite Fan (Flâneur Yelpaze)*
     - *Onimaru Kunitsuna (Oni Katana)*
     - *Prime//2.0 Karambit (Asil Karambit)*
     - *VCT LOCK//IN Misericórdia*
     - *Sovereign Sword (Asil Kılıç)*
     - *Xenohunter Knife (Uzaylı Avcısı Bıçağı)*

6. **4 Dakikada Bir 3 Dakikalık Şans Etkinliği (+%3 Nadir Çıkma Şansı):**
   - Her 4 dakikalık döngüde sistem rastgele 1 kasa seçer.
   - Seçilen kasada 3 dakika boyunca Kırmızı (Covert/Exclusive) ve Sarı/Altın (Bıçak/Knife) çıkma olasılığı **+%3 artar**.
   - Üst bilgi çubuğunda canlı geri sayım ve kasada alevli parıltı animasyonu gösterilir.

7. **Gelişmiş Pazar (Market) & 30 Dakikalık Bot Alımı:**
   - Oyuncular çıkardıkları skinleri istedikleri fiyattan pazara koyabilir.
   - **30 Dakika Kuralı:** Eğer ilan 30 dakika içinde başka bir oyuncu tarafından alınmazsa, sistem botu o skini piyasa değerinin **%86'sına** otomatik olarak satın alır ve bakiyeyi satıcıya aktarır!
   - **Son 5 Dakika Uyarısı:** Sürenin bitimine 5 dakika kaldığında ilan üzerinde kırmızı animasyonlu uyarı belirir ve satıcıya uyarı bildirimi gider.

8. **Oyuncular Arası Canlı Takas (P2P Trading):**
   - Çevrimiçi oyuncular listesinden herhangi bir oyuncuya takas teklifi gönderebilir, kendi envanterinizden ve karşı taraftan skin seçebilirsiniz.
   - Karşı tarafa anlık sesli ve görsel bildirim gider, onaylandığında skinler güvenle el değiştirir.

9. **Canlı Global Sohbet:**
   - Sağ alt köşeden açılıp kapanabilen modern canlı sohbet penceresi.

10. **Yalnızca Kırmızı ve Sarı Çıkarıldığında Sunucu Bildirimi:**
    - Kasadan mavi veya mor çıktığında sunucu spamlanmaz.
    - Ancak herhangi bir oyuncu **Kırmızı (Covert/Exclusive)** veya **Sarı/Altın (Bıçak/Knife)** çıkardığında, bağlı tüm oyuncuların ekranına **özel sesli ve konfetili kutlama afişi** gider!

11. **Gerçekçi CS:GO Yatay Çark Açılış Animasyonu:**
    - Web Audio API ile çarkın merkez iğnesinden geçen her skin için mekanik tıkırtı sesi.
    - Fiziksel yavaşlama (cubic-bezier easing) ve son eşyada duruş.

---

## 🚀 Railway.app ile Hostlama Rehberi

Bu proje Railway.app platformunda hiçbir ayar yapmadan doğrudan çalışacak şekilde optimize edilmiştir (`PORT` otomatik algılanır, `Dockerfile`, `railway.json` ve `Procfile` dahildir).

### Yöntem 1: GitHub ile Railway'e Bağlama (En Kolay)
1. Bu proje klasörünü kendi GitHub hesabınızda bir repository olarak yükleyin:
   ```bash
   git init
   git add .
   git commit -m "CS2 & Valorant Case Clash - Initial Commit"
   git branch -M main
   git remote add origin https://github.com/<kullanici-adiniz>/<repo-adiniz>.git
   git push -u origin main
   ```
2. [railway.app](https://railway.app) adresine gidin ve giriş yapın.
3. **"New Project"** -> **"Deploy from GitHub repo"** seçeneğini seçin.
4. Yüklediğiniz repoyu seçin.
5. Railway otomatik olarak `Node.js` ortamını algılar ve projeyi canlıya alır!
6. **Settings** sekmesinden **"Generate Domain"** butonuna basarak size özel `https://xxx.up.railway.app` linkinizi alın.

### Yöntem 2: Railway CLI ile Doğrudan Yükleme
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

---

## 💻 Yerel Ortamda Test Etme

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. Sunucuyu başlatın:
   ```bash
   npm start
   ```

3. Tarayıcınızda açın:
   ```
   http://localhost:3000
   ```
