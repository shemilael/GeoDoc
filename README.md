
# GeoDoc — Penanda Waktu & Lokasi Foto

> Aplikasi web untuk menambah label waktu, lokasi, dan watermark pada foto dokumentasi berbasis data EXIF.

---

## Fitur Utama

- **Upload Foto**: Pilih foto dari perangkat, aplikasi otomatis membaca metadata EXIF (timestamp & geotagging).
- **Validasi Metadata**: Foto tanpa metadata akan diberi peringatan dan tidak dapat diunduh sebagai dokumentasi sah.
- **Label Otomatis**: Tanggal, koordinat, dan lokasi (reverse geocoding) otomatis ditampilkan di foto.
- **Pengaturan Label**: Atur posisi, warna, ukuran, dan font label sesuai kebutuhan.
- **Watermark**: Tambahkan logo instansi atau watermark teks, atur posisi dan ukuran.
- **Download Hasil**: Unduh foto yang sudah diberi label dan watermark.
- **Mobile Friendly**: Tampilan responsif, mudah digunakan di HP maupun desktop.
- **Petunjuk Penggunaan**: Tersedia halaman [petunjuk interaktif]([petunjuk.html](https://shemilael.github.io/GeoDoc/petunjuk.html)) lengkap dengan gambar.

## Struktur Proyek

```
GeoDoc/
├── assets/           # Gambar petunjuk & ilustrasi
├── index.html        # Halaman utama aplikasi
├── petunjuk.html     # Halaman dokumentasi/petunjuk penggunaan
├── scripts/
│   └── app.js        # Kode JavaScript utama
├── styles/
│   └── main.css      # Gaya CSS aplikasi
├── README.md         # Dokumentasi proyek
├── LICENSE           # Lisensi MIT
```

## Cara Menjalankan

1. **Klon repositori**
   ```
   git clone https://github.com/shemilael/GeoDoc.git
   cd GeoDoc
   ```
2. **Buka file [index.html]([index.html](https://shemilael.github.io/GeoDoc/index.html)) di browser** (cukup klik dua kali atau drag ke browser).

Tidak perlu instalasi server atau dependensi tambahan.

## Panduan Penggunaan

1. Klik **Upload** dan pilih foto dokumentasi lapangan.
2. Jika foto valid (ada metadata), label waktu & lokasi otomatis muncul di foto.
3. Atur posisi, warna, ukuran, dan font label sesuai kebutuhan.
4. (Opsional) Tambahkan logo instansi sebagai watermark.
5. Klik **Download Hasil** untuk mengunduh foto siap pakai.
6. Untuk panduan visual, buka [petunjuk.html](petunjuk.html).

## Teknologi

- HTML5, CSS3 (Tailwind & custom), JavaScript
- [EXIF.js](https://github.com/exif-js/exif-js) untuk pembacaan metadata EXIF
- [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) untuk reverse geocoding

## Kontribusi

Kontribusi sangat terbuka! Silakan ajukan pull request atau buka issue untuk saran/perbaikan.

## Lisensi

MIT — lihat file [LICENSE](LICENSE)
