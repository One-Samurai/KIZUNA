import { Tier } from '@kizuna/contracts';

export type RewardCategory = 'merch' | 'experience' | 'digital';

export interface Reward {
  id: string;
  name: string;
  category: RewardCategory;
  tierRequired: Tier;
  xpCost: bigint;
  stock: number | 'unlimited';
  blurb: string;
  emblem: string;
  image: string;
}

export const REWARDS: Reward[] = [
  {
    id: 'cap-rookie',
    name: 'ONE Black Logo Baseball Cap',
    category: 'merch',
    tierRequired: Tier.Rookie,
    xpCost: 30n,
    stock: 'unlimited',
    blurb: 'Official ONE crest cap. Adjustable. Ships from Tokyo.',
    emblem: '◈',
    image: '/shop/cap.png',
  },
  {
    id: 'tee-samurai',
    name: 'ONE Japan Logo Tee — White',
    category: 'merch',
    tierRequired: Tier.Samurai,
    xpCost: 80n,
    stock: 250,
    blurb: 'Tokyo-issue logo tee. Japan-only colorway. 100% cotton.',
    emblem: '⌖',
    image: '/shop/tee.png',
  },
  {
    id: 'hoodie-ronin',
    name: 'ONE Muay Thai Hoodie',
    category: 'merch',
    tierRequired: Tier.Ronin,
    xpCost: 220n,
    stock: 120,
    blurb: 'Heavyweight Muay Thai pullover. Numbered run, holder-only.',
    emblem: '✶',
    image: '/shop/hoodie.jpg',
  },
  {
    id: 'jacket-shogun',
    name: 'ONE Tokyo Dragon Souvenir Jacket',
    category: 'merch',
    tierRequired: Tier.Shogun,
    xpCost: 600n,
    stock: 30,
    blurb: 'Hand-finished sukajan with embroidered dragon. Shogun+ only.',
    emblem: '☵',
    image: '/shop/jacket.png',
  },
  {
    id: 'autograph-legend',
    name: 'Christian Lee — Autographed Walkout Hoodie',
    category: 'experience',
    tierRequired: Tier.Legend,
    xpCost: 900n,
    stock: 20,
    blurb: 'World-champ walkout zip-hoodie, hand-signed and authenticated.',
    emblem: '✍',
    image: '/shop/autograph.png',
  },
  {
    id: 'photo-legend',
    name: 'Cageside Photo Op — ONE Tokyo',
    category: 'experience',
    tierRequired: Tier.Legend,
    xpCost: 1500n,
    stock: 5,
    blurb: 'Meet & shoot with the roster at the next Tokyo Fight Night.',
    emblem: '◉',
    image: '/shop/photo.jpg',
  },
  {
    id: 'wallpaper-rookie',
    name: 'Fight Night Wallpaper Pack',
    category: 'digital',
    tierRequired: Tier.Rookie,
    xpCost: 10n,
    stock: 'unlimited',
    blurb: 'Five 4K stills from ONE Friday Fights. Holder-exclusive.',
    emblem: '✦',
    image: '/shop/wallpaper.jpg',
  },
  {
    id: 'pfp-samurai',
    name: 'Brandon Vera "The Truth" PFP Frame',
    category: 'digital',
    tierRequired: Tier.Samurai,
    xpCost: 40n,
    stock: 'unlimited',
    blurb: '"The Truth" themed frame. Stamped with your handle + tier seal.',
    emblem: '❖',
    image: '/shop/pfp.png',
  },
];
