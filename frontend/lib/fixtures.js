export const news = [
  {
    id: 1,
    date: '2026-11-02',
    title: [
      'خدمات جديدة لإنستغرام وتيك توك',
      'New Instagram and TikTok services',
    ],
  },
  {
    id: 2,
    date: '2026-10-25',
    title: ['تحسين سرعة تحديث الحالات', 'Faster order status updates'],
  },
];
export const providers = [
  { name: 'Mock Provider', latency: '180ms', balance: 540, status: 'up' },
  { name: 'Provider B', latency: '—', balance: null, status: 'off' },
];
export const proxies = ['92ms', '140ms', '—'].map((latency, i) => ({
  address: '10.0.0.' + (11 + i) + ':8080',
  latency,
  status: i === 2 ? 'rej' : 'up',
}));
export const health = {
  cpu: 34,
  ram: 61,
  disk: 47,
  telegram: true,
  services: ['API', 'Worker', 'Redis', 'PostgreSQL', 'Telegram Bot'].map(
    (name) => ({ name, status: 'up' })
  ),
};
