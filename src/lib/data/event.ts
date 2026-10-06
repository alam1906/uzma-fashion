export const event = {
  brand: 'Uzma Fashion',
  title: 'Grand Opening Uzma Fashion',
  startsAt: '2026-10-08T09:00:00+07:00',
  date: '8 Oktober 2026',
  shortDate: '08.10.26',
  day: 'Kamis',
  time: '09.00 WIB',
  theme: 'Lulu’ul de Lumière'
} as const;

export const storeLocation = {
  embedUrl:
    'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3958.2966857308547!2d107.89850997499917!3d-7.2069544927986176!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zN8KwMTInMjUuMCJTIDEwN8KwNTQnMDMuOSJF!5e0!3m2!1sid!2sid!4v1791242420565!5m2!1sid!2sid'
} as const;

export const collections = [
  {
    id: '01',
    name: 'A New Chapter Begins',
    category: null,
    imageCaption: 'Elegant & Premium',
    description:
      'Koleksi terbaru yang dikurasi dengan penuh perhatian untuk menghadirkan keanggunan yang tak lekang oleh waktu dan keindahan yang begitu effortless dalam setiap penampilan.',
    image: 'uzma-pearl-silk',
    position: '50% 70%',
    width: 1536,
    height: 1024,
    alt: 'Sutra ocean blue dan mutiara dengan sentuhan rose gold'
  },
  {
    id: '02',
    name: 'The Spotligh Is On',
    category: 'Signature Detail',
    imageCaption: 'Fashionable & Mewah',
    description:
      'A new collection is ready to take the stage. Tempat keanggunan berpadu dengan gaya fashion kontemporer.',
    image: 'pearl-detail',
    position: '50% 45%',
    width: 800,
    height: 1200,
    alt: 'Detail mutiara dan bordir lembut pada busana Uzma Fashion'
  },
  {
    id: '03',
    name: 'New Store\nNew Collection\nNew Story',
    category: 'Occasion Edit',
    imageCaption: 'Catchy & Modern',
    description:
      'Kami membuka pintu menuju dunia fashion yang baru. Dengan koleksi terbaru dan gaya berbeda yang telah kami ciptakan khusus untuk anda.',
    image: 'grand-opening-store',
    position: '50% 50%',
    width: 800,
    height: 1000,
    alt: 'Interior butik Uzma Fashion dengan busana navy, ivory, dan rose'
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
    image: 'offer-perfume-luxury',
    alt: 'Ilustrasi parfum mewah dengan detail rose gold di atas kain ocean blue'
  },
  {
    id: '02',
    label: 'Opening Day Special',
    kicker: 'For the first ten',
    title: 'Opening Day',
    italicTitle: 'Special',
    detail:
      'Rayakan Grand Opening dengan hadiah spesial untuk 10 pembeli pertama, dengan minimal belanja Rp500.000.',
    highlight: '10 pembeli pertama',
    image: 'offer-premium-hijab',
    alt: 'Ilustrasi hijab premium rose gold dengan lipatan lembut di atas kain ocean blue'
  },
  {
    id: '03',
    label: 'Come Back & Discover More',
    kicker: 'For the first three',
    title: 'Come Back &',
    italicTitle: 'Discover More',
    detail:
      'Jadilah salah satu dari 3 pembeli pertama dan dapatkan voucher belanja Rp50.000 dengan minimal belanja Rp1.000.000.',
    highlight: 'Rp50.000',
    image: 'offer-return-visit',
    alt: 'Ilustrasi voucher belanja Uzma Fashion dengan tas belanja rose gold'
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
  `DESCRIPTION:Besok Grand Opening Uzma Fashion pukul ${event.time}.`,
  'END:VALARM',
  'END:VEVENT',
  'END:VCALENDAR',
  ''
].join('\r\n');

export const calendarHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(calendar)}`;
