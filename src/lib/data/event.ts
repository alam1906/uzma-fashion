export const event = {
  brand: 'Uzma Fashion',
  title: 'Grand Opening Uzma Fashion',
  startsAt: '2026-10-25T10:00:00+07:00',
  date: '25 Oktober 2026',
  shortDate: '25.10.26',
  day: 'Minggu',
  time: '10.00 WIB',
  theme: 'Lulu’ul de Lumière'
} as const;

export const collections = [
  {
    id: '01',
    name: 'Luminous Depth',
    category: 'Evening Series',
    description:
      'Siluet panjang dalam warna navy yang tenang, diperkaya kilau lembut untuk malam yang berkesan.',
    image: 'collection-look',
    position: '50% 8%',
    width: 800,
    height: 1200,
    alt: 'Busana navy dengan hijab rose gold dan detail mutiara dari koleksi Luminous Depth'
  },
  {
    id: '02',
    name: 'Pearl Reverie',
    category: 'Signature Detail',
    description:
      'Tekstur halus dan aksen mutiara membentuk karakter anggun yang sederhana namun tetap istimewa.',
    image: 'pearl-detail',
    position: '50% 45%',
    width: 800,
    height: 1200,
    alt: 'Detail mutiara dan bordir lembut pada koleksi Pearl Reverie'
  },
  {
    id: '03',
    name: 'Rose Nocturne',
    category: 'Occasion Edit',
    description:
      'Perpaduan warna malam dan rose gold untuk tampilan feminin yang tegas, modern, dan penuh percaya diri.',
    image: 'uzma-hero',
    position: '50% 22%',
    width: 800,
    height: 1422,
    alt: 'Busana panjang navy dengan bordir rose gold dari koleksi Rose Nocturne'
  },
  {
    id: '04',
    name: 'Quiet Radiance',
    category: 'Grand Opening Edit',
    description:
      'Pilihan busana serbaguna dengan garis bersih dan warna hangat untuk menemani momen sehari-hari.',
    image: 'grand-opening-store',
    position: '50% 50%',
    width: 800,
    height: 1000,
    alt: 'Pilihan busana modest berwarna navy, ivory, dan rose di Uzma Fashion'
  }
] as const;

export const offers = [
  {
    id: '01',
    label: 'Exclusive Gift',
    kicker: 'Grand Opening Privilege',
    title: 'Exclusive',
    italicTitle: 'Gift',
    detail: 'Untuk 20 pembeli pertama dengan minimal transaksi Rp300.000.',
    highlight: '20',
    image: 'offer-exclusive-gift',
    alt: 'Hadiah eksklusif grand opening Uzma Fashion'
  },
  {
    id: '02',
    label: 'Opening Day Special',
    kicker: 'For every purchase',
    title: 'Opening Day',
    italicTitle: 'Special',
    detail: 'Nikmati diskon 10% untuk setiap pembelian selama hari Grand Opening.',
    highlight: '10%',
    image: 'offer-opening-day',
    alt: 'Pilihan busana dengan penawaran spesial hari grand opening'
  },
  {
    id: '03',
    label: 'Come Back & Discover More',
    kicker: 'Your next visit',
    title: 'Come Back &',
    italicTitle: 'Discover More',
    detail:
      'Dapatkan voucher belanja Rp50.000 untuk kunjungan berikutnya dengan minimal transaksi Rp300.000.',
    highlight: 'Rp50.000',
    image: 'offer-return-visit',
    alt: 'Voucher kunjungan berikutnya Uzma Fashion'
  }
] as const;

const calendar = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Uzma Fashion//Grand Opening//ID',
  'CALSCALE:GREGORIAN',
  'METHOD:PUBLISH',
  'BEGIN:VEVENT',
  'UID:grand-opening-20261025@uzma-fashion',
  'DTSTAMP:20260928T000000Z',
  `DTSTART:${new Date(event.startsAt).toISOString().replace(/[-:]/g, '').replace('.000', '')}`,
  `SUMMARY:${event.title}`,
  'DESCRIPTION:Be part of the beginning of Uzma Fashion.',
  'BEGIN:VALARM',
  'TRIGGER:-P1D',
  'ACTION:DISPLAY',
  'DESCRIPTION:Besok Grand Opening Uzma Fashion pukul 10.00 WIB.',
  'END:VALARM',
  'END:VEVENT',
  'END:VCALENDAR',
  ''
].join('\r\n');

export const calendarHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`;
