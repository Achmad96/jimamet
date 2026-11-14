export interface DetectionBox {
  label: string;
  confidence: number;
  // [top, left, width, height] in percentage
  box: [number, number, number, number];
}

export interface SampleMeal {
  id: string;
  name: string;
  portion: string;
  image: string;
  alt: string;
  calories: number;
  dailyPercent: number;
  tags: string[];
  note: string;
  detections?: DetectionBox[];
  macros: {
    protein: { value: string; percent: number };
    carbs: { value: string; percent: number };
    fat: { value: string; percent: number };
    fiber: { value: string; percent: number };
  };
}

export const SAMPLE_MEALS: SampleMeal[] = [
  {
    id: "nasi-rames",
    name: "Nasi Rames Ayam & Tempe",
    portion: "1 Piring Sedang (±360g)",
    image: "/meal-nasi-rames.jpg",
    alt: "Nasi Rames Ayam & Tempe dengan nasi putih, ayam goreng dada, tempe orek, dan tumis kangkung",
    calories: 520,
    dailyPercent: 26,
    tags: ["Nasi Putih", "Ayam Goreng Dada", "Tempe Orek", "Tumis Kangkung"],
    note: "Pilihan sangat baik! Asupan protein tinggi untuk pembentukan otot, didukung serat dari kangkung.",
    detections: [
      { label: "Nasi Putih", confidence: 99, box: [20, 45, 45, 45] },
      { label: "Ayam Goreng", confidence: 98, box: [65, 52, 32, 32] },
      { label: "Tumis Kangkung", confidence: 94, box: [22, 10, 38, 40] },
      { label: "Tempe Orek", confidence: 95, box: [60, 10, 32, 32] },
    ],
    macros: {
      protein: { value: "34g", percent: 68 },
      carbs: { value: "56g", percent: 54 },
      fat: { value: "17g", percent: 36 },
      fiber: { value: "6.2g", percent: 45 },
    },
  },
  {
    id: "gado-gado",
    name: "Gado-Gado Sayur & Telur",
    portion: "1 Piring Lengkap (±320g)",
    image: "/meal-gado-gado.jpg",
    alt: "Gado-Gado Sayur & Telur dengan sayuran kukus, tahu, tempe, telur rebus, dan saus kacang",
    calories: 395,
    dailyPercent: 20,
    tags: ["Sayuran Kukus", "Tahu & Tempe", "Telur Rebus", "Saus Kacang"],
    note: "Menu padat serat dan vitamin. Saus kacang menyumbang lemak sehat nabati yang baik untuk jantung.",
    detections: [
      { label: "Telur Rebus", confidence: 98, box: [30, 55, 30, 30] },
      { label: "Saus Kacang", confidence: 97, box: [35, 25, 45, 45] },
      { label: "Tahu & Tempe", confidence: 95, box: [58, 20, 34, 34] },
      { label: "Sayuran Kukus", confidence: 93, box: [18, 20, 40, 35] },
    ],
    macros: {
      protein: { value: "22g", percent: 44 },
      carbs: { value: "38g", percent: 38 },
      fat: { value: "18g", percent: 40 },
      fiber: { value: "8.5g", percent: 62 },
    },
  },
  {
    id: "soto-ayam",
    name: "Soto Ayam Lamongan",
    portion: "1 Mangkuk Kuah Kaldu (±380g)",
    image: "/meal-soto-ayam.jpg",
    alt: "Soto Ayam Lamongan dengan ayam suwir, kuah kaldu kuning, telur rebus, kol, tauge, dan jeruk nipis",
    calories: 340,
    dailyPercent: 17,
    tags: ["Ayam Suwir", "Kuah Kaldu Kuning", "Telur Rebus", "Kol & Tauge"],
    note: "Menu hangat rendah lemak jenuh. Tambahkan sedikit perasan jeruk nipis untuk membantu penyerapan zat besi.",
    detections: [
      { label: "Kuah Kaldu Kuning", confidence: 99, box: [15, 15, 70, 70] },
      { label: "Ayam Suwir", confidence: 96, box: [35, 30, 35, 35] },
      { label: "Telur Rebus", confidence: 97, box: [42, 60, 28, 28] },
      { label: "Kol & Tauge", confidence: 93, box: [30, 20, 35, 35] },
    ],
    macros: {
      protein: { value: "28g", percent: 56 },
      carbs: { value: "32g", percent: 32 },
      fat: { value: "10g", percent: 22 },
      fiber: { value: "3.8g", percent: 28 },
    },
  },
];

export const FEATURES = [
  {
    badge: "Deteksi Otomatis",
    title: "Pindai Makanan dengan Kamera",
    description: "Cukup arahkan kamera atau unggah foto piring Anda. Sistem cerdas Jimamet langsung mengenali makanan anda tanpa perlu diketik manual.",
  },
  {
    badge: "Data Standar Kemenkes",
    title: "Hitung Kalori & Nutrisi Akurat",
    description: "Ketahui jumlah kalori, protein, karbohidrat, lemak, hingga serat pada setiap porsi makan Anda. Perhitungan berpedoman pada Tabel Komposisi Pangan Indonesia resmi.",
  },
  {
    badge: "Catatan Harian",
    title: "Buku Harian Pola Makan Rapi",
    description: "Simpan riwayat makan harian secara otomatis. Anda bisa memantau apakah asupan kalori hari ini sudah mencukupi, seimbang, atau melebihi kebutuhan harian.",
  },
  {
    badge: "Pendampingan Nyata",
    title: "Tanya AI & Konsultasi Ahli Gizi",
    description: "Dapatkan saran makan sehat instan dari NutriCoach AI. Bila membutuhkan panduan khusus seperti diet diabetes atau hipertensi, Anda dapat terhubung langsung ke Ahli Gizi profesional.",
  },
];

export const STEPS = [
  {
    step: "01",
    title: "Foto Makanan Anda",
    desc: "Arahkan kamera ponsel ke piring makan Anda, atau unggah foto dari galeri sebelum mulai makan.",
    highlight: "Bisa foto langsung atau unggah gambar",
  },
  {
    step: "02",
    title: "Sistem Menghitung Gizi Seketika",
    desc: "Aplikasi langsung mendeteksi hidangan dan menampilkan rincian kalori, protein, karbohidrat, dan lemak sesuai porsi.",
    highlight: "Hasil keluar dalam hitungan detik",
  },
  {
    step: "03",
    title: "Pantau Pola Makan & Capai Target Sehat",
    desc: "Catatan tersimpan ke grafik harian Anda. Anda dapat melihat perkembangan pola makan dan meminta saran ahli kapan saja.",
    highlight: "Catatan rapi dan mudah dievaluasi",
  },
];

export const FOOD_CATEGORIES = [
  {
    title: "Makanan Pokok & Olahan Nasi",
    items: ["Nasi Putih", "Nasi Goreng", "Nasi Uduk", "Lontong / Ketupat", "Mie Goreng", "Bihun Goreng"],
  },
  {
    title: "Lauk Pauk Nusantara",
    items: ["Ayam Goreng", "Rendang Sapi", "Ikan Goreng", "Sate Ayam & Sapi", "Telur Balado", "Empal Daging"],
  },
  {
    title: "Sayuran & Menu Berkuah",
    items: ["Gado-Gado", "Tumis Kangkung", "Capcay Sayur", "Soto Ayam & Daging", "Sayur Asem", "Bakso Kuah"],
  },
  {
    title: "Lauk Nabati & Pelengkap",
    items: ["Tempe Goreng & Orek", "Tahu Goreng & Bacem", "Perkedel Kentang", "Sambal Terasi", "Kerupuk Putih", "Lalapan Segar"],
  },
];

export const STATS = [
  {
    value: "500+",
    label: "Menu Nusantara Dikenali",
    desc: "Database gizi lengkap hidangan rumahan, lauk pauk, hingga masakan tradisional.",
  },
  {
    value: "1 Detik",
    label: "Analisis Cepat",
    desc: "Informasi kalori dan nutrisi langsung tampil seketika saat foto diambil.",
  },
  {
    value: "Standar Resmi",
    label: "Tabel Gizi Kemenkes RI",
    desc: "Penghitungan mengacu pada standar resmi Kementerian Kesehatan Republik Indonesia.",
  },
  {
    value: "2 Jalur",
    label: "AI & Ahli Gizi Asli",
    desc: "Tanya jawab praktis dengan asisten pintar AI serta rujukan konsultasi dokter/ahli gizi.",
  },
];

export const FAQS = [
  {
    q: "Apakah Jimamet bisa mengenali masakan rumahan sehari-hari?",
    a: "Tentu saja. Jimamet dilatih khusus mengenali berbagai hidangan populer Indonesia, mulai dari nasi goreng, lauk pauk (ayam, ikan, telur, tempe, tahu), masakan berkuah seperti soto dan bakso, hingga aneka olahan sayuran seperti tumis kangkung dan capcay.",
  },
  {
    q: "Dari mana data kalori dan nutrisi makanan dihitung?",
    a: "Penghitungan kalori, protein, lemak, dan karbohidrat pada Jimamet berpedoman pada Tabel Komposisi Pangan Indonesia (TKPI) resmi dari Kementerian Kesehatan Republik Indonesia, sehingga sesuai dengan bahan dan cara masak di tanah air.",
  },
  {
    q: "Apakah saya harus menimbang makanan sebelum difoto?",
    a: "Tidak perlu. Jimamet otomatis memperkirakan takaran porsi standar yang biasa dikonsumsi masyarakat. Jika porsi makan Anda lebih sedikit atau lebih banyak, Anda tetap bisa menyesuaikan ukuran porsi dengan satu sentuhan mudah.",
  },
  {
    q: "Bagaimana cara berkonsultasi dengan Ahli Gizi?",
    a: "Selain asisten cerdas NutriCoach AI yang siap menjawab pertanyaan seputar makanan 24 jam, pengguna juga dapat terhubung langsung dengan Ahli Gizi terdaftar untuk konsultasi mendalam mengenai program diet, diabetes, asam urat, atau kondisi kesehatan lainnya.",
  },
  {
    q: "Apakah aplikasi Jimamet gratis untuk digunakan?",
    a: "Ya! Anda dapat mendaftar akun gratis dan langsung menggunakan fitur pemindaian makanan kamera, penghitungan kalori, serta pencatatan pola makan harian tanpa pungutan biaya pendaftaran.",
  },
];
