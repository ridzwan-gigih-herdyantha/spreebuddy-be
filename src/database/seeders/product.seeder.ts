import Product, { ProductType } from '../../modules/products/product.model.js';
import { generateSlug } from '../../common/utils/slug.js';

interface SeedProduct {
  name: string;
  category: string;
  regularPrice: number;
  salePrice?: number;
  images?: string[];
  weight: number;
  dimensions: { length: number; width: number; height: number };
  description: string;
}

const placeholderFor = (name: string) =>
  `https://placehold.co/800x800/e2e8f0/475569/png?text=${encodeURIComponent(name)}`;

const PRODUCTS: SeedProduct[] = [
  { name: 'Xiaomi Redmi 14C 4G 6/128GB', category: 'Elektronik', regularPrice: 1_799_000, salePrice: 1_499_000, weight: 400, dimensions: { length: 18, width: 10, height: 6 }, description: 'Smartphone entry-level dengan layar 6.88 inci 120Hz, kamera 50MP, dan baterai 5160mAh.' },
  { name: 'Infinix HOT 50 4G 8/128GB', category: 'Elektronik', regularPrice: 1_699_000, salePrice: 1_499_000, weight: 400, dimensions: { length: 18, width: 10, height: 6 }, description: 'Smartphone tipis 7.8mm dengan layar 6.7 inci 120Hz dan sertifikasi IP54.' },
  { name: 'Redmi Buds 6', category: 'Elektronik', regularPrice: 629_000, weight: 120, dimensions: { length: 12, width: 9, height: 5 }, description: 'TWS dengan driver ganda, ANC 49dB, dan daya tahan baterai hingga 42 jam.' },
  { name: 'Redmi Buds 5 Pro ANC', category: 'Elektronik', regularPrice: 1_559_000, salePrice: 959_000, weight: 130, dimensions: { length: 12, width: 9, height: 5 }, description: 'TWS flagship dengan ANC hibrida 52dB, LDAC, dan koneksi ganda.' },
  { name: 'Redmi Buds 6 Play', category: 'Elektronik', regularPrice: 599_000, salePrice: 149_000, weight: 110, dimensions: { length: 12, width: 9, height: 5 }, description: 'TWS ringan dengan driver 10mm dan latensi rendah untuk gaming.' },

  { name: 'Erigo T-Shirt Oversize Antelope Black Unisex', category: 'Fashion Pria', regularPrice: 300_000, salePrice: 103_000, images: ['https://cdn.shopify.com/s/files/1/0607/2841/0296/files/T-SHIRT-OVERSIZE-ANTELOPE-BLACK-100.jpg', 'https://cdn.shopify.com/s/files/1/0607/2841/0296/files/id-11134201-7r98v-lxdi6hhlmyzw03.jpg'], weight: 250, dimensions: { length: 30, width: 25, height: 3 }, description: 'Kaos oversize berbahan katun combed 24s dengan potongan boxy.' },
  { name: 'Erigo Short Shirt Rayon Jazlyn Black Unisex', category: 'Fashion Pria', regularPrice: 350_000, salePrice: 118_000, images: ['https://cdn.shopify.com/s/files/1/0607/2841/0296/files/SHORT-SHIRT-JAZLYN-BLACK-100.jpg', 'https://cdn.shopify.com/s/files/1/0607/2841/0296/files/id-11134201-7r992-lu4f3wm79i6of5.jpg'], weight: 220, dimensions: { length: 30, width: 25, height: 3 }, description: 'Kemeja lengan pendek berbahan rayon yang jatuh dan adem dipakai.' },
  { name: 'Erigo Short Shirt Pocket Danvin Terracotta', category: 'Fashion Pria', regularPrice: 199_000, salePrice: 145_000, images: ['https://cdn.shopify.com/s/files/1/0607/2841/0296/files/id-11134201-7rasb-m5dzvdwf96ww66.jpg', 'https://cdn.shopify.com/s/files/1/0607/2841/0296/files/id-11134201-7rasf-m5dzve78tcpkbf.jpg'], weight: 230, dimensions: { length: 30, width: 25, height: 3 }, description: 'Kemeja lengan pendek dengan saku dada dan warna terracotta.' },
  { name: 'Erigo Chino Pants Sirius Black Unisex', category: 'Fashion Pria', regularPrice: 500_000, salePrice: 183_000, images: ['https://cdn.shopify.com/s/files/1/0607/2841/0296/files/2B1NqcBy-CHINO-PANTS-SIRIUS-BLACK-100.jpg', 'https://cdn.shopify.com/s/files/1/0607/2841/0296/files/id-11134201-7r98t-lu4f2p0b2uvj75.jpg'], weight: 450, dimensions: { length: 35, width: 28, height: 5 }, description: 'Celana chino potongan regular dengan bahan twill yang tidak mudah kusut.' },
  { name: 'Erigo Relax Chino Pants Light Grey', category: 'Fashion Pria', regularPrice: 349_000, salePrice: 247_000, images: ['https://cdn.shopify.com/s/files/1/0607/2841/0296/files/COVER_RELAX-CHINO-PANTS-EVANDER-LIGHT-KHAKY-01.jpg', 'https://cdn.shopify.com/s/files/1/0607/2841/0296/files/id-11134201-7rasc-m5axev46y1p2ae.jpg'], weight: 470, dimensions: { length: 35, width: 28, height: 5 }, description: 'Celana chino potongan relax fit dengan pinggang elastis di bagian belakang.' },

  { name: 'Elzatta Gamis Tali Alimah', category: 'Fashion Wanita', regularPrice: 359_000, images: ['https://cdn.shopify.com/s/files/1/0019/2659/4627/files/Brown_1_a96bec0d-08af-452c-b5d0-cf3fc33dbfa9.jpg', 'https://cdn.shopify.com/s/files/1/0019/2659/4627/files/DustyBlue_1.jpg'], weight: 500, dimensions: { length: 35, width: 28, height: 6 }, description: 'Gamis dengan aksen tali pinggang dan bahan yang jatuh mengikuti siluet.' },
  { name: 'Elzatta Gamis Kancing Full A', category: 'Fashion Wanita', regularPrice: 429_000, salePrice: 399_000, images: ['https://cdn.shopify.com/s/files/1/0019/2659/4627/files/DEEPTEAL_0c56a97f-9df8-421d-b39a-06b449ddfc92.jpg', 'https://cdn.shopify.com/s/files/1/0019/2659/4627/files/HITAM_2_9bdca854-e0b3-4718-88c7-6c9dadb7191b.jpg'], weight: 520, dimensions: { length: 35, width: 28, height: 6 }, description: 'Gamis kancing penuh depan sehingga ramah untuk menyusui.' },
  { name: 'Elzatta Gamis Basic Knit Plain', category: 'Fashion Wanita', regularPrice: 299_000, salePrice: 259_000, images: ['https://cdn.shopify.com/s/files/1/0019/2659/4627/files/E170825byHA18531.jpg', 'https://cdn.shopify.com/s/files/1/0019/2659/4627/files/snapedit_1776658185483.jpg'], weight: 480, dimensions: { length: 35, width: 28, height: 6 }, description: 'Gamis rajut polos untuk pemakaian harian, lentur dan tidak mudah kusut.' },
  { name: 'Elzatta Gamis Bordir Hajar', category: 'Fashion Wanita', regularPrice: 559_000, images: ['https://cdn.shopify.com/s/files/1/0019/2659/4627/files/Elzatta230825byHA107.jpg', 'https://cdn.shopify.com/s/files/1/0019/2659/4627/files/E170825byHA978.jpg'], weight: 550, dimensions: { length: 35, width: 28, height: 6 }, description: 'Gamis dengan detail bordir pada bagian dada dan lengan.' },
  { name: 'Elzatta Gamis Beads Miryam', category: 'Fashion Wanita', regularPrice: 799_000, images: ['https://cdn.shopify.com/s/files/1/0019/2659/4627/files/E160825byHA1492_d262f321-d3b6-4250-be2a-c9f6a250f734.jpg', 'https://cdn.shopify.com/s/files/1/0019/2659/4627/files/E160825byHA1448_eaee26c2-b112-48ef-acd5-b112c239b8ec.jpg'], weight: 600, dimensions: { length: 38, width: 30, height: 7 }, description: 'Gamis semi formal dengan hiasan beads, cocok untuk acara resmi.' },

  { name: 'Skintific 5X Ceramide Barrier Repair Moisture Gel 30g', category: 'Kesehatan & Kecantikan', regularPrice: 135_000, salePrice: 119_000, weight: 90, dimensions: { length: 8, width: 8, height: 6 }, description: 'Pelembap gel dengan 5 jenis ceramide untuk memperbaiki skin barrier.' },
  { name: 'Skintific Aqua Light Daily Sunscreen SPF 50 PA++++ 30ml', category: 'Kesehatan & Kecantikan', regularPrice: 99_000, weight: 70, dimensions: { length: 12, width: 5, height: 4 }, description: 'Sunscreen bertekstur ringan tanpa white cast, aman untuk kulit sensitif.' },
  { name: 'Somethinc Low pH Good Morning Gel Cleanser 100ml', category: 'Kesehatan & Kecantikan', regularPrice: 120_000, salePrice: 80_000, weight: 140, dimensions: { length: 15, width: 5, height: 5 }, description: 'Sabun cuci muka gel ber-pH rendah yang tidak membuat kulit kering.' },
  { name: 'Somethinc Niacinamide + Moisture Sabi Beet Brightening Serum 20ml', category: 'Kesehatan & Kecantikan', regularPrice: 169_000, weight: 80, dimensions: { length: 11, width: 4, height: 4 }, description: 'Serum niacinamide 10% untuk mencerahkan dan menyamarkan noda.' },
  { name: 'Wardah Acnederm Zinc Gluconate Toner 60ml', category: 'Kesehatan & Kecantikan', regularPrice: 45_000, weight: 100, dimensions: { length: 13, width: 5, height: 5 }, description: 'Toner untuk kulit berjerawat dengan kandungan zinc gluconate.' },

  { name: 'Miyako Rice Cooker MCM-508 1.8L', category: 'Rumah Tangga', regularPrice: 256_000, weight: 3000, dimensions: { length: 32, width: 30, height: 28 }, description: 'Magic com 3 in 1 kapasitas 1.8 liter dengan panci anti lengket.' },
  { name: 'Cosmos Rice Cooker CRJ-6601 1.8L', category: 'Rumah Tangga', regularPrice: 249_800, weight: 3100, dimensions: { length: 32, width: 30, height: 28 }, description: 'Rice cooker harmond 1.8 liter dengan fungsi menanak, menghangatkan, dan mengukus.' },
  { name: 'Philips Setrika Uap GC1424/45', category: 'Rumah Tangga', regularPrice: 386_735, weight: 1400, dimensions: { length: 30, width: 15, height: 16 }, description: 'Setrika uap 1400W dengan telapak anti lengket dan semburan uap 70g.' },
  { name: 'Maspion Automatic Iron HA-110 350W', category: 'Rumah Tangga', regularPrice: 129_000, weight: 900, dimensions: { length: 26, width: 13, height: 14 }, description: 'Setrika kering 350W dengan pengatur suhu otomatis.' },
  { name: 'Sharp Setrika Kering EI-N05-B', category: 'Rumah Tangga', regularPrice: 169_000, weight: 950, dimensions: { length: 26, width: 13, height: 14 }, description: 'Setrika kering ringan dengan telapak anti lengket dan kabel berputar.' },

  { name: 'Indomie Mi Goreng Spesial 85g', category: 'Makanan & Minuman', regularPrice: 4_000, weight: 85, dimensions: { length: 12, width: 10, height: 3 }, description: 'Mi instan goreng dengan bumbu spesial, favorit sejuta umat.' },
  { name: 'Kapal Api Kopi Special Bubuk 165g', category: 'Makanan & Minuman', regularPrice: 35_400, weight: 165, dimensions: { length: 15, width: 10, height: 4 }, description: 'Kopi bubuk robusta dengan aroma kuat dan rasa pekat.' },
  { name: 'Kapal Api Kopi Spesial Silver 100g', category: 'Makanan & Minuman', regularPrice: 9_600, weight: 100, dimensions: { length: 13, width: 9, height: 3 }, description: 'Kopi bubuk kemasan sachet ekonomis untuk konsumsi harian.' },
  { name: 'Silverqueen Chunky Bar Cashew', category: 'Makanan & Minuman', regularPrice: 12_500, weight: 62, dimensions: { length: 14, width: 7, height: 2 }, description: 'Cokelat susu dengan potongan kacang mete utuh.' },
  { name: 'Richeese Nabati Wafer Keju 145g', category: 'Makanan & Minuman', regularPrice: 11_500, weight: 145, dimensions: { length: 18, width: 10, height: 5 }, description: 'Wafer renyah dengan krim keju di setiap lapisannya.' },

  { name: 'ASICS Novablast 6', category: 'Olahraga & Outdoor', regularPrice: 2_299_000, weight: 900, dimensions: { length: 33, width: 22, height: 13 }, description: 'Sepatu lari daily trainer dengan midsole FF Blast Max yang responsif.' },
  { name: 'Adidas Adizero EVO SL', category: 'Olahraga & Outdoor', regularPrice: 2_500_000, weight: 850, dimensions: { length: 33, width: 22, height: 13 }, description: 'Sepatu lari ringan dengan busa Lightstrike Pro untuk sesi tempo.' },
  { name: 'Adidas Supernova Rise 3', category: 'Olahraga & Outdoor', regularPrice: 2_100_000, weight: 950, dimensions: { length: 33, width: 22, height: 13 }, description: 'Sepatu lari harian dengan bantalan Dreamstrike+ dan support Solution.' },
  { name: 'Ortuseight Solar 2.0', category: 'Olahraga & Outdoor', regularPrice: 2_499_000, salePrice: 2_199_000, weight: 880, dimensions: { length: 33, width: 22, height: 13 }, description: 'Sepatu lari lokal dengan pelat karbon untuk race jarak menengah.' },
  { name: 'Adidas Run Light Crew Socks', category: 'Olahraga & Outdoor', regularPrice: 300_000, weight: 120, dimensions: { length: 20, width: 14, height: 3 }, description: 'Kaus kaki lari berbahan ringan dengan bantalan di titik tumpuan.' },

  { name: 'Bandai HG 1/144 RX-78-2 Gundam Revive', category: 'Hobi & Koleksi', regularPrice: 210_000, weight: 300, dimensions: { length: 31, width: 19, height: 8 }, description: 'Model kit High Grade skala 1/144 dengan artikulasi yang diperbarui.' },
  { name: 'Bandai RG 1/144 RX-93 Nu Gundam', category: 'Hobi & Koleksi', regularPrice: 650_000, weight: 450, dimensions: { length: 31, width: 19, height: 10 }, description: 'Model kit Real Grade dengan inner frame dan detail tinggi.' },
  { name: 'Bandai MG 1/100 Freedom Gundam Ver 2.0', category: 'Hobi & Koleksi', regularPrice: 950_000, weight: 800, dimensions: { length: 38, width: 30, height: 14 }, description: 'Model kit Master Grade skala 1/100 dengan inner frame penuh.' },
  { name: 'Bandai EG 1/144 Strike Gundam', category: 'Hobi & Koleksi', regularPrice: 160_000, weight: 250, dimensions: { length: 31, width: 19, height: 8 }, description: 'Model kit Entry Grade tanpa lem dan tanpa gunting, cocok untuk pemula.' },
  { name: 'Tamiya Mini 4WD Avante Mk.III', category: 'Hobi & Koleksi', regularPrice: 135_000, weight: 200, dimensions: { length: 25, width: 15, height: 6 }, description: 'Kit mobil Mini 4WD dengan sasis VS untuk balap trek.' },

  { name: 'GS Astra Aki Motor GTZ5S 12V-5Ah', category: 'Otomotif', regularPrice: 256_000, weight: 2200, dimensions: { length: 15, width: 10, height: 12 }, description: 'Aki kering maintenance free untuk motor matic dan bebek standar.' },
  { name: 'Aspira Aki Motor GTZ5S 12V-3.5Ah', category: 'Otomotif', regularPrice: 210_000, weight: 2000, dimensions: { length: 15, width: 10, height: 12 }, description: 'Aki kering untuk motor harian dengan harga terjangkau.' },
  { name: 'Quantum Aki Motor GTZ5S 12V-3.5Ah', category: 'Otomotif', regularPrice: 200_000, weight: 2000, dimensions: { length: 15, width: 10, height: 12 }, description: 'Aki kering entry level untuk motor matic 110-125cc.' },
  { name: 'GS Astra Aki Motor GTZ7S 12V-5.5Ah', category: 'Otomotif', regularPrice: 330_000, weight: 2500, dimensions: { length: 16, width: 11, height: 13 }, description: 'Aki kering untuk motor sport dan matic 150cc.' },
  { name: 'GS Astra Aki Motor GTZ8V 12V-7.4Ah', category: 'Otomotif', regularPrice: 544_000, weight: 3000, dimensions: { length: 17, width: 12, height: 14 }, description: 'Aki kering kapasitas besar untuk motor dengan beban kelistrikan tinggi.' },

  { name: 'Project Hail Mary - Andy Weir', category: 'Buku & Alat Tulis', regularPrice: 358_000, salePrice: 248_000, weight: 500, dimensions: { length: 23, width: 16, height: 4 }, description: 'Novel fiksi ilmiah tentang misi penyelamatan umat manusia seorang diri.' },
  { name: 'The Housemaid - Freida McFadden', category: 'Buku & Alat Tulis', regularPrice: 258_000, weight: 420, dimensions: { length: 23, width: 16, height: 3 }, description: 'Thriller psikologis tentang seorang asisten rumah tangga dan majikannya.' },
  { name: 'Babel - R.F. Kuang', category: 'Buku & Alat Tulis', regularPrice: 238_000, weight: 700, dimensions: { length: 24, width: 16, height: 5 }, description: 'Fantasi historis tentang penerjemahan, kolonialisme, dan kekuasaan.' },
  { name: 'Marketing 7.0 - Philip Kotler', category: 'Buku & Alat Tulis', regularPrice: 518_000, weight: 600, dimensions: { length: 24, width: 16, height: 4 }, description: 'Buku pemasaran yang membahas konvergensi teknologi dan strategi merek.' },
  { name: 'An Offer from a Gentleman - Julia Quinn', category: 'Buku & Alat Tulis', regularPrice: 238_000, salePrice: 188_000, weight: 380, dimensions: { length: 23, width: 15, height: 3 }, description: 'Novel roman historis seri Bridgerton buku ketiga.' },
];

export default {
  name: 'product',

  async run() {
    await Product.deleteMany({});
    await Product.syncIndexes(); // rebuild indexes (e.g. unique slug) on the clean collection
    console.log('[product] Cleared products collection');

    const products = PRODUCTS.map((p, i) => ({
      name: p.name,
      slug: generateSlug(p.name),
      description: p.description,
      images: p.images ?? [placeholderFor(p.name)],
      type: ProductType.PHYSICAL,
      regularPrice: p.regularPrice,
      salePrice: p.salePrice,
      weight: p.weight,
      dimensions: p.dimensions,
      stock: 15 + ((i * 7) % 86),
      category: p.category,
    }));

    await Product.create(products);

    const onSale = products.filter((p) => p.salePrice !== undefined).length;
    console.log(`[product] Seeded ${products.length} products (${onSale} on sale)`);
  },
};
