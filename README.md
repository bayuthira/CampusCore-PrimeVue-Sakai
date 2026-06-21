# CampusCore

CampusCore adalah antarmuka web sistem informasi kampus terpadu. Aplikasi ini
menggabungkan pengelolaan akademik, SDM, aset, fasilitas, kendaraan, dokumen,
dan administrasi pengguna dalam satu dashboard berbasis peran.

Frontend ini dibangun dengan Vue 3, Vite, PrimeVue, Pinia, dan Tailwind CSS.
CampusCore membutuhkan layanan backend terpisah yang menyediakan API sesuai
endpoint yang digunakan di direktori `src/stores`.

## Fitur utama

- Akademik: mahasiswa, dosen, program studi, mata kuliah, kurikulum, jadwal,
  rombongan belajar, KRS, dosen PA, dan RPS.
- SDM: pegawai, unit kerja, cuti, izin, absensi, biometrik, surat tugas, dan SPPD.
- Sarana: aset, barang habis pakai, ruangan, kendaraan, dan penjadwalannya.
- Administrasi: pengguna, role, dokumen, dan kontrol akses berbasis peran.
- Ekspor laporan ke PDF dan CSV yang kompatibel dengan aplikasi spreadsheet.

## Prasyarat

- Node.js 20 atau lebih baru
- npm 10 atau lebih baru
- Backend CampusCore yang dapat diakses dari browser

## Menjalankan secara lokal

```bash
git clone https://github.com/bayuthira/CampusCore-PrimeVue-Sakai.git
cd CampusCore-PrimeVue-Sakai
cp .env.example .env
npm ci
npm run dev
```

Sesuaikan `VITE_API_BASE_URL` di `.env` dengan alamat backend. Vite biasanya
menjalankan aplikasi di `http://localhost:5173`.

## Konfigurasi

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Ya | URL dasar API backend tanpa slash di bagian akhir. |
| `VITE_APP_NAME` | Tidak | Nama singkat aplikasi. Default: `CampusCore`. |
| `VITE_APP_LONG_NAME` | Tidak | Nama lengkap yang tampil di halaman login. |

Jangan menyimpan credential atau token di file `.env`. Semua variabel dengan
awalan `VITE_` akan disertakan ke bundle frontend dan dapat dibaca pengguna.

## Pemeriksaan kualitas

```bash
npm run lint
npm run build
npm audit
```

Gunakan `npm run lint:fix` untuk menerapkan perbaikan ESLint secara otomatis.
Hasil build produksi akan dibuat di direktori `dist`.

## Deployment

Repo menyertakan `vercel.json` untuk fallback routing SPA. Pada platform lain,
konfigurasikan seluruh route yang tidak ditemukan agar mengarah ke
`/index.html`, lalu isi environment variable pada pengaturan platform.

## Kontribusi dan keamanan

Issue dan pull request dipersilakan. Jangan menyertakan data mahasiswa,
pegawai, credential, token, atau alamat layanan internal dalam laporan publik.
Laporkan kerentanan keamanan secara privat kepada pemilik repository.

## Lisensi dan atribusi

CampusCore tersedia di bawah [MIT License](LICENSE.md). Tampilan aplikasi
diturunkan dari [Sakai](https://github.com/primefaces/sakai-vue), template MIT
oleh PrimeTek Informatics, dan menggunakan [PrimeVue](https://primevue.org/).
