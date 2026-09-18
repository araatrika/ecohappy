// Real @araatrika Instagram posts used across the site (slider + "More on our Instagram" blocks).
// Each entry is a real photo actually posted to Instagram, not a stock or generated image.
// `href`: links to the specific post where we still have the permalink saved; otherwise the
// profile, so we never guess at a URL we can't verify.
export type InstagramPost = {
  img: string;
  alt: string;
  href: string;
  caption: string;
};

export const instagramPosts: InstagramPost[] = [
  {
    img: '/assets/social/ig-ganpati-seedballs.jpg',
    alt: 'Eco Happy seed balls made as Ganpati visarjan prasad, displayed for a Pune pop-up stall',
    href: 'https://www.instagram.com/araatrika/',
    caption: 'Ganpati visarjan seed balls',
  },
  {
    img: '/assets/social/ig-sep02.jpg',
    alt: 'Visitors browsing the Eco Happy stall of newspaper stationery and seed products at a campus exhibition',
    href: 'https://www.instagram.com/araatrika/',
    caption: 'Campus exhibition stall',
  },
  {
    img: '/assets/social/ig-aug26.jpg',
    alt: 'Two Eco Happy team members handing over gift boxes at a Marriott Bonvoy corporate gifting delivery',
    href: 'https://www.instagram.com/p/DcghQxNCB1J/',
    caption: 'Marriott Bonvoy corporate gifting',
  },
];
