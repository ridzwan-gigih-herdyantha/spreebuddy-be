import { User } from '../../modules/users/user.model.js';
import { ROLES } from '../../common/constants/roles.js';

const DEFAULT_PASSWORD = 'password';
const USER_COUNT = 50;

const LOCATIONS = [
  { district: 'Kebayoran Baru', city: 'Jakarta Selatan', state: 'DKI Jakarta', zip: '12110' },
  { district: 'Gambir', city: 'Jakarta Pusat', state: 'DKI Jakarta', zip: '10110' },
  { district: 'Kebon Jeruk', city: 'Jakarta Barat', state: 'DKI Jakarta', zip: '11530' },
  { district: 'Matraman', city: 'Jakarta Timur', state: 'DKI Jakarta', zip: '13140' },
  { district: 'Kelapa Gading', city: 'Jakarta Utara', state: 'DKI Jakarta', zip: '14240' },
  { district: 'Coblong', city: 'Bandung', state: 'Jawa Barat', zip: '40132' },
  { district: 'Bekasi Selatan', city: 'Bekasi', state: 'Jawa Barat', zip: '17144' },
  { district: 'Beji', city: 'Depok', state: 'Jawa Barat', zip: '16421' },
  { district: 'Bogor Tengah', city: 'Bogor', state: 'Jawa Barat', zip: '16121' },
  { district: 'Kejaksan', city: 'Cirebon', state: 'Jawa Barat', zip: '45123' },
  { district: 'Gubeng', city: 'Surabaya', state: 'Jawa Timur', zip: '60281' },
  { district: 'Klojen', city: 'Malang', state: 'Jawa Timur', zip: '65111' },
  { district: 'Candisari', city: 'Semarang', state: 'Jawa Tengah', zip: '50252' },
  { district: 'Laweyan', city: 'Surakarta', state: 'Jawa Tengah', zip: '57146' },
  { district: 'Gondokusuman', city: 'Yogyakarta', state: 'DI Yogyakarta', zip: '55222' },
  { district: 'Denpasar Barat', city: 'Denpasar', state: 'Bali', zip: '80119' },
  { district: 'Medan Baru', city: 'Medan', state: 'Sumatera Utara', zip: '20153' },
  { district: 'Ilir Barat I', city: 'Palembang', state: 'Sumatera Selatan', zip: '30129' },
  { district: 'Sukajadi', city: 'Pekanbaru', state: 'Riau', zip: '28123' },
  { district: 'Padang Barat', city: 'Padang', state: 'Sumatera Barat', zip: '25111' },
  { district: 'Panakkukang', city: 'Makassar', state: 'Sulawesi Selatan', zip: '90231' },
  { district: 'Wanea', city: 'Manado', state: 'Sulawesi Utara', zip: '95117' },
  { district: 'Balikpapan Kota', city: 'Balikpapan', state: 'Kalimantan Timur', zip: '76111' },
  { district: 'Banjarmasin Tengah', city: 'Banjarmasin', state: 'Kalimantan Selatan', zip: '70111' },
  { district: 'Pontianak Kota', city: 'Pontianak', state: 'Kalimantan Barat', zip: '78121' },
  { district: 'Tangerang', city: 'Tangerang', state: 'Banten', zip: '15111' },
  { district: 'Serpong', city: 'Tangerang Selatan', state: 'Banten', zip: '15310' },
  { district: 'Serang', city: 'Serang', state: 'Banten', zip: '42111' },
  { district: 'Telanaipura', city: 'Jambi', state: 'Jambi', zip: '36122' },
  { district: 'Tanjung Karang Pusat', city: 'Bandar Lampung', state: 'Lampung', zip: '35116' },
];

const STREETS = [
  'Jl. Jenderal Sudirman', 'Jl. Gatot Subroto', 'Jl. Ahmad Yani', 'Jl. Diponegoro',
  'Jl. Gajah Mada', 'Jl. Merdeka', 'Jl. Pahlawan', 'Jl. Veteran', 'Jl. Imam Bonjol',
  'Jl. Hayam Wuruk', 'Jl. Pemuda', 'Jl. Kartini', 'Jl. Sisingamangaraja',
  'Jl. Asia Afrika', 'Jl. M.H. Thamrin', 'Jl. H.R. Rasuna Said', 'Jl. Pandanaran',
  'Jl. Cut Nyak Dien', 'Jl. Teuku Umar', 'Jl. Kyai Haji Wahid Hasyim',
];

const NAMES = [
  'Ahmad Fauzi', 'Siti Nurhaliza', 'Budi Santoso', 'Dewi Lestari', 'Rizky Pratama',
  'Putri Ayu Wulandari', 'Eko Prasetyo', 'Nur Aisyah', 'Agus Setiawan', 'Rina Marlina',
  'Dimas Aditya', 'Fitri Handayani', 'Bambang Wijaya', 'Maya Sari', 'Hendra Gunawan',
  'Indah Permata', 'Yusuf Maulana', 'Ratna Kusuma', 'Andi Firmansyah', 'Lia Amelia',
  'Reza Nugroho', 'Sri Rahayu', 'Tono Hartono', 'Novi Anggraini', 'Iqbal Ramadhan',
  'Desi Puspita', 'Wahyu Hidayat', 'Ayu Safitri', 'Fajar Kurniawan', 'Mega Puspitasari',
  'Doni Saputra', 'Yuni Kartika', 'Arif Rahman', 'Silvia Handoko', 'Teguh Wibowo',
  'Anisa Rahmawati', 'Galih Prakoso', 'Vina Oktaviani', 'Rudi Hermawan', 'Tari Melati',
  'Bayu Segara', 'Citra Dewanti', 'Irfan Hakim', 'Larasati Putri', 'Oka Mahendra',
  'Zahra Salsabila', 'Hary Susanto', 'Melly Ginting', 'Surya Darma', 'Kiki Amalia',
];

const PHONE_PREFIXES = [
  '0811', '0812', '0813', '0821', '0822', '0851', '0852', '0853',
  '0855', '0856', '0857', '0858', '0817', '0818', '0819', '0859',
  '0877', '0878', '0895', '0896', '0897', '0898', '0881', '0882',
];

const EMAIL_PROVIDERS = ['gmail.com', 'yahoo.com', 'outlook.com'];

function usernameFor(name: string, taken: Set<string>) {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20) || 'user';

  let candidate = base;
  let n = 1;
  while (taken.has(candidate)) candidate = `${base}${++n}`;
  taken.add(candidate);
  return candidate;
}

export default {
  name: 'user',

  async run() {
    await User.deleteMany({});
    await User.syncIndexes();
    console.log('[user] Cleared users collection');

    const admin = Array.from({ length: 2 }, (_, i) => {
      const n = i + 1;
      return {
        name: `Admin ${n}`,
        username: `admin${n}`,
        email: `admin${n}@spreebuddy.test`,
        password: DEFAULT_PASSWORD,
        phone: `081100000${n.toString().padStart(3, '0')}`,
        role: ROLES.ADMIN,
      };
    });

    const taken = new Set<string>();

    const users = Array.from({ length: USER_COUNT }, (_, i) => {
      const name = NAMES[i % NAMES.length];
      const username = usernameFor(name, taken);
      const loc = LOCATIONS[i % LOCATIONS.length];
      const street = `${STREETS[i % STREETS.length]} No. ${(i % 90) + 1}`;

      const phone = `${PHONE_PREFIXES[i % PHONE_PREFIXES.length]}${(10_000_000 + i * 137).toString()}`;

      return {
        name,
        username,
        email: `${username}@${EMAIL_PROVIDERS[i % EMAIL_PROVIDERS.length]}`,
        password: DEFAULT_PASSWORD,
        phone,

        address: {
          street,
          district: loc.district,
          city: loc.city,
          state: loc.state,
          zip: loc.zip,
          fullAddress: `${street}, ${loc.district}, ${loc.city}, ${loc.state} ${loc.zip}`,
        },

        role: ROLES.USER,
      };
    });

    // create() agar pre-save hook tetap berjalan
    await User.create([...admin, ...users]);

    const total = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });

    console.log(
      `[user] Seeded ${total} users (${adminCount} admin, ${
        total - adminCount
      } users). Password: "${DEFAULT_PASSWORD}"`
    );
  },
};
