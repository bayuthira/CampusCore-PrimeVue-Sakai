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
- Pembelajaran: pertemuan kuliah, jurnal/BAP, presensi dosen, kode presensi
  mahasiswa dinamis, serta rekap realisasi tatap muka.
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

Backend harus menggunakan versi yang sudah memiliki migration tabel
`pertemuan_kuliah`, `presensi_dosen_kuliah`, `sesi_presensi_mahasiswa`, dan
`presensi_mahasiswa_kuliah`. Terapkan migration backend sebelum memakai menu
Pembelajaran. Migration tersebut bersifat aditif dan tidak mengganti workflow
CRUD jadwal kuliah yang sudah ada.

## Alur modul pembelajaran

Modul ini menggunakan jadwal kuliah dan KRS yang sudah ada sebagai sumber
kelas dan peserta. Akses menu ditentukan berdasarkan role:

| Role | Menu | Kemampuan |
| --- | --- | --- |
| `DOSEN` | Proses Pembelajaran | Membuat pertemuan, mengisi BAP, membuka atau menutup sesi, serta mengoreksi presensi mahasiswa. |
| `MAHASISWA` | Presensi Kuliah | Melakukan check-in menggunakan kode dinamis dari dosen. |

Pada menu Manajemen RPS, dosen hanya melihat mata kuliah yang diampu pada tahun
akademik aktif. Dosen berperan `Anggota` memiliki akses baca, sedangkan dosen
berperan `Koordinator` dapat mengubah informasi RPS, matriks mingguan, dan
dokumen. Kaprodi dapat melihat serta memverifikasi RPS dalam lingkup prodinya.
Semua pembatasan tersebut divalidasi kembali oleh backend. Perubahan pada RPS
yang pernah disetujui atau ditolak akan mengembalikan statusnya menjadi
`Menunggu Verifikasi` jika dokumen RPS sudah tersedia.

Alur penggunaan dosen:

1. RPS mata kuliah diunggah dan disetujui terlebih dahulu.
2. Dosen membuka menu **Perkuliahan → Proses Pembelajaran**.
3. Dosen membuat pertemuan dan membuka sesi. Presensi dosen tercatat otomatis.
4. Sistem membuat kode presensi delapan karakter yang berlaku selama 10 menit.
5. Setelah perkuliahan, dosen melengkapi topik realisasi dan BAP, lalu menutup
   pertemuan.

Mahasiswa hanya dapat melakukan check-in jika KRS-nya berstatus `Disetujui`,
pertemuan sedang dibuka, dan kode belum kedaluwarsa. Presensi manual oleh dosen
juga hanya tersedia selama pertemuan dibuka. Setelah ditutup, BAP dan presensi
dikunci serta realisasi tatap muka dosen pengampu diperbarui.

> **Gate RPS:** dosen tetap dapat melihat status kelas pada daftar, tetapi
> seluruh proses pertemuan untuk kelas tersebut ditolak oleh backend sampai
> status RPS menjadi `Disetujui`. Saat ini status tersebut mengikuti RPS pada
> master mata kuliah, belum versi RPS per semester.

RPS diperlakukan sebagai dokumen master yang dapat digunakan kembali pada
tahun-tahun akademik berikutnya. Pergantian tahun akademik tidak mewajibkan
duplikasi RPS. Model saat ini belum menyimpan versi per kurikulum; ketika
kebutuhan itu muncul, skema harus ditambah agar RPS lama tetap menjadi histori
dan perubahan kurikulum menghasilkan versi baru, bukan menimpa versi lama.

## Konfigurasi

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Ya | URL dasar API backend tanpa slash di bagian akhir. |
| `VITE_API_SERVICE_NAME` | Tidak | Nilai header `x-app-service` untuk allow-rule Cloudflare. Default: `Satria-Management-System`. |
| `VITE_APP_NAME` | Tidak | Nama singkat aplikasi. Default: `CampusCore`. |
| `VITE_APP_LONG_NAME` | Tidak | Nama lengkap yang tampil di halaman login. |
| `VITE_THEME_PRIMARY` | Tidak | Warna utama tema. Default: `blue`. |
| `VITE_THEME_SURFACE` | Tidak | Warna permukaan/netral. Default: `slate`. |
| `VITE_THEME_PRESET` | Tidak | Preset PrimeVue: `Aura`, `Lara`, atau `Nora`. Default: `Aura`. |
| `VITE_THEME_MENU_MODE` | Tidak | Mode menu: `static` atau `overlay`. Default: `static`. |

Pilihan `VITE_THEME_PRIMARY` yang tersedia adalah `noir`, `emerald`, `green`,
`lime`, `orange`, `amber`, `yellow`, `teal`, `cyan`, `sky`, `blue`, `indigo`,
`violet`, `purple`, `fuchsia`, `pink`, dan `rose`. Pilihan surface yang tersedia
adalah `slate`, `gray`, `zinc`, `neutral`, `stone`, `soho`, `viva`, dan `ocean`.
Pengguna tetap dapat mengganti keempat pengaturan melalui configurator di UI.

Variabel tema Vite diterapkan saat aplikasi dimulai. Restart dev server setelah
mengubah `.env`; untuk deployment produksi, lakukan build ulang.

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
