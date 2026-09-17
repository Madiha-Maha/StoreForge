import { Product, ProductVariant } from '../types';

interface SuggestionCategory {
  keywords: string[];
  category: 'Audio' | 'Workspace' | 'EDC & Carry' | 'Lifestyle';
  items: Array<{
    name: string;
    tagline: string;
    description: string;
    basePrice: number;
    compareAtPrice?: number;
    badge?: string;
    images: string[];
    variants: ProductVariant[];
    specifications: Record<string, string>;
  }>;
}

// Curated library of authentic product suggestions for high-frequency e-commerce search intents
const CURATED_SUGGESTION_BANK: SuggestionCategory[] = [
  {
    keywords: ['shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', 'runner', 'runners', 'footwear', 'loafer', 'loafers', 'kicks'],
    category: 'EDC & Carry',
    items: [
      {
        name: 'Vanguard All-Weather Carbon Performance Runners',
        tagline: 'Dual-density supercritical foam with full-length curved carbon plate.',
        description: 'Engineered for relentless endurance and city sprints. Features breathable ripstop water-resistant upper, Vibram Megagrip traction lug outsole, and responsive energy rebound.',
        basePrice: 165,
        compareAtPrice: 195,
        badge: 'Best Seller',
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1000&q=80',
        ],
        variants: [
          { id: 'var_sh_1_9', name: 'Charcoal Black / US 9', sku: 'SH-VNG-BLK-9', color: 'Charcoal Black', colorHex: '#18181b', priceDelta: 0, stock: 14 },
          { id: 'var_sh_1_10', name: 'Charcoal Black / US 10', sku: 'SH-VNG-BLK-10', color: 'Charcoal Black', colorHex: '#18181b', priceDelta: 0, stock: 22 },
          { id: 'var_sh_1_11', name: 'Charcoal Black / US 11', sku: 'SH-VNG-BLK-11', color: 'Charcoal Black', colorHex: '#18181b', priceDelta: 0, stock: 18 },
          { id: 'var_sh_1_w10', name: 'Arctic Chalk / US 10', sku: 'SH-VNG-WHT-10', color: 'Arctic Chalk', colorHex: '#f5f5f4', priceDelta: 0, stock: 16 },
        ],
        specifications: {
          'Upper Material': 'Seamless Hydrophobic Engineered Mesh',
          'Midsole': 'Supercritical Nitrogen-Infused TPU Foam',
          'Plate': 'Full-Length Curved 3K Carbon Fiber',
          'Outsole': 'Vibram Litebase High-Traction Rubber',
          'Drop': '8mm Heel-to-Toe Drop',
        },
      },
      {
        name: 'Atelier Hand-Burnished Tuscan Leather Derby Shoes',
        tagline: 'Full-grain vegetable-tanned Italian calfskin with Goodyear-welted sole.',
        description: 'Handcrafted in Florence using traditional artisanal cobbler techniques. Lined with ultra-soft calf leather with shock-absorbing cork footbed that molds to your feet over time.',
        basePrice: 220,
        compareAtPrice: 260,
        badge: 'Artisan Made',
        images: [
          'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=1000&q=80',
        ],
        variants: [
          { id: 'var_sh_2_9', name: 'Espresso Brown / US 9', sku: 'SH-DER-BRN-9', color: 'Espresso Brown', colorHex: '#451a03', priceDelta: 0, stock: 9 },
          { id: 'var_sh_2_10', name: 'Espresso Brown / US 10', sku: 'SH-DER-BRN-10', color: 'Espresso Brown', colorHex: '#451a03', priceDelta: 0, stock: 12 },
          { id: 'var_sh_2_blk', name: 'Onyx Black / US 10', sku: 'SH-DER-BLK-10', color: 'Onyx Black', colorHex: '#18181b', priceDelta: 0, stock: 11 },
        ],
        specifications: {
          'Leather Grade': 'Full-Grain Grade-A Italian Calfskin',
          'Construction': '360° Goodyear Welt (Fully Resolable)',
          'Insole': 'Full Ergonomic Memory Cork Footbed',
          'Origin': 'Handmade in Tuscany, Italy',
        },
      },
      {
        name: 'Strata Minimalist Daily Suede Cupsole Sneakers',
        tagline: 'Buttery Portuguese water-resistant split suede with natural gum sole.',
        description: 'Clean architectural silhouette built for effortless all-day wear. Cushioned with orthotic arch support and lined with antimicrobial bamboo weave.',
        basePrice: 135,
        compareAtPrice: 160,
        badge: 'Staff Pick',
        images: [
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80',
        ],
        variants: [
          { id: 'var_sh_3_sand', name: 'Sandstone Grey / US 9.5', sku: 'SH-STR-SND-95', color: 'Sandstone Grey', colorHex: '#a8a29e', priceDelta: 0, stock: 15 },
          { id: 'var_sh_3_olive', name: 'Nordic Olive / US 10', sku: 'SH-STR-OLV-10', color: 'Nordic Olive', colorHex: '#365314', priceDelta: 0, stock: 12 },
        ],
        specifications: {
          'Upper': 'Wax-Treated Portuguese Split Suede',
          'Sole': 'Vulcanized Natural Brazilian Gum Rubber',
          'Lining': 'Organic Bamboo Viscose Moisture Wicking',
        },
      },
    ],
  },
  {
    keywords: ['jacket', 'coat', 'hoodie', 'apparel', 'shirt', 'clothes', 'sweater', 'parka', 'pants', 'trousers', 'clothing'],
    category: 'Lifestyle',
    items: [
      {
        name: 'Aero 3-Layer Stormproof Technical Shell Parka',
        tagline: '20,000mm hydrostatic waterproof membrane with YKK AquaGuard zips.',
        description: 'Master unpredictability with our lightest seam-sealed mountain shell. Features magnetic storm flap, helmet-compatible hood, and concealed underarm ventilation.',
        basePrice: 245,
        compareAtPrice: 295,
        badge: 'New',
        images: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
        ],
        variants: [
          { id: 'var_jk_m', name: 'Stealth Black / Medium', sku: 'JK-STORM-BLK-M', color: 'Stealth Black', colorHex: '#18181b', priceDelta: 0, stock: 18 },
          { id: 'var_jk_l', name: 'Stealth Black / Large', sku: 'JK-STORM-BLK-L', color: 'Stealth Black', colorHex: '#18181b', priceDelta: 0, stock: 15 },
          { id: 'var_jk_sl', name: 'Glacier Grey / Large', sku: 'JK-STORM-GRY-L', color: 'Glacier Grey', colorHex: '#94a3b8', priceDelta: 0, stock: 10 },
        ],
        specifications: {
          'Waterproof Rating': '20,000mm Hydrostatic Head',
          'Breathability': '25,000g/m²/24hr MVP',
          'Hardware': 'Matte Black YKK AquaGuard Sealed Zippers',
          'Fit': 'Articulated Ergonomic Athletic Cut',
        },
      },
      {
        name: 'Kanso 480GSM Heavyweight French Terry Zip Hoodie',
        tagline: '100% GOTS organic combed cotton pre-shrunk with ribbed side gussets.',
        description: 'Substantial, structured drape that gets softer with every wash. Custom matte metal drawcord aglets and deep double-needle hand warmer pockets.',
        basePrice: 110,
        compareAtPrice: 135,
        badge: 'Best Seller',
        images: [
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
        ],
        variants: [
          { id: 'var_hd_blk_m', name: 'Washed Charcoal / Medium', sku: 'HD-HWT-CHR-M', color: 'Washed Charcoal', colorHex: '#27272a', priceDelta: 0, stock: 24 },
          { id: 'var_hd_blk_l', name: 'Washed Charcoal / Large', sku: 'HD-HWT-CHR-L', color: 'Washed Charcoal', colorHex: '#27272a', priceDelta: 0, stock: 20 },
          { id: 'var_hd_oat_l', name: 'Raw Oatmeal Heather / Large', sku: 'HD-HWT-OAT-L', color: 'Raw Oatmeal', colorHex: '#e7e5e4', priceDelta: 0, stock: 16 },
        ],
        specifications: {
          'Fabric Weight': '480 GSM Ultra-Heavy Combed Cotton',
          'Weave': '100% GOTS Organic Loopback French Terry',
          'Hardware': 'Antiqued Nickel 2-Way Heavy Gauge Zipper',
        },
      },
    ],
  },
  {
    keywords: ['watch', 'watches', 'chronograph', 'timepiece', 'strap'],
    category: 'EDC & Carry',
    items: [
      {
        name: 'Vanguard Automatic 200M Diver Watch 41mm',
        tagline: 'Japanese Miyota 9015 high-beat movement with ceramic bezel.',
        description: 'Built to withstand deep oceanic depths and high-stakes boardroom meetings. Domed sapphire crystal with 5 layers of interior anti-reflective coating.',
        basePrice: 385,
        compareAtPrice: 450,
        badge: 'Limited Run',
        images: [
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80',
        ],
        variants: [
          { id: 'var_wt_blk', name: 'Marine Navy / Steel Bracelet', sku: 'WT-DIV-NVY', color: 'Marine Navy', colorHex: '#1e3a8a', priceDelta: 0, stock: 8 },
          { id: 'var_wt_obs', name: 'Obsidian Black / FKM Rubber Strap', sku: 'WT-DIV-BLK', color: 'Obsidian Black', colorHex: '#18181b', priceDelta: -25, stock: 12 },
        ],
        specifications: {
          'Movement': 'Miyota 9015 Automatic (28,800 bph, 42h Power Reserve)',
          'Case': '316L Marine-Grade Stainless Steel',
          'Crystal': 'Double-Domed AR Sapphire',
          'Water Resistance': '20 ATM / 200 Meters',
        },
      },
    ],
  },
  {
    keywords: ['chair', 'seating', 'desk', 'desk chair', 'office chair', 'ergonomic'],
    category: 'Workspace',
    items: [
      {
        name: 'Form Kinetic Mesh Ergonomic Studio Chair',
        tagline: 'Self-adjusting synchro-tilt lumbar chassis with breathable elastomer mesh.',
        description: 'Engineered for 12+ hour creative and coding workflows. 4D multidirectional armrests, forward tilt mechanism, and weight-activated tension control.',
        basePrice: 395,
        compareAtPrice: 480,
        badge: 'Popular',
        images: [
          'https://images.unsplash.com/photo-1580481077195-c3a9f029314b?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=1000&q=80',
        ],
        variants: [
          { id: 'var_ch_graphite', name: 'Graphite Mesh / Polished Base', sku: 'CH-KIN-GRP', color: 'Graphite', colorHex: '#3f3f46', priceDelta: 0, stock: 11 },
          { id: 'var_ch_mineral', name: 'Mineral White / Silver Base', sku: 'CH-KIN-WHT', color: 'Mineral White', colorHex: '#e2e8f0', priceDelta: 25, stock: 7 },
        ],
        specifications: {
          'Mechanism': 'Harmonic Weight-Balancing Synchro-Tilt',
          'Lumbar': 'Independent Dynamic Sacral Lumbar Pad',
          'Armrests': '4D (Height, Width, Depth, Angle)',
          'Weight Capacity': '330 lbs (150 kg)',
        },
      },
    ],
  },
  {
    keywords: ['camera', 'photo', 'lens', 'photography', 'drone'],
    category: 'Lifestyle',
    items: [
      {
        name: 'Lumina Retro 4K Compact Creator Camera',
        tagline: 'Large 1-inch CMOS sensor with f/1.8 optical zoom and film simulation.',
        description: 'Capture filmic grain and cinematic 4K video in a pocket-sized magnesium chassis with tactile mechanical dials and flip-up OLED touch viewfinder.',
        basePrice: 520,
        compareAtPrice: 590,
        badge: 'Staff Pick',
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80',
        ],
        variants: [
          { id: 'var_cam_slv', name: 'Vintage Silver & Black Leather', sku: 'CAM-LUM-SLV', color: 'Vintage Silver', colorHex: '#d4d4d8', priceDelta: 0, stock: 6 },
          { id: 'var_cam_blk', name: 'Stealth All-Black Matte', sku: 'CAM-LUM-BLK', color: 'Stealth Black', colorHex: '#18181b', priceDelta: 0, stock: 9 },
        ],
        specifications: {
          'Sensor': '20.1 Megapixel 1.0-type Stacked CMOS',
          'Lens': '24-70mm equivalent f/1.8-2.8 Optical Glass',
          'Video': '4K HDR 30p / 1080p 120fps Slow Motion',
          'Connectivity': 'USB-C Direct Stream / Wi-Fi 6',
        },
      },
    ],
  },
  {
    keywords: ['sunglasses', 'glasses', 'eyewear', 'shades'],
    category: 'EDC & Carry',
    items: [
      {
        name: 'Strata Hand-Polished Italian Acetate Aviators',
        tagline: 'Japanese polarized nylon lenses with 7-barrel OBE German hinges.',
        description: 'Sculpted from Mazzucchelli bio-acetate with custom diamond-wire core. Eliminates glare with 100% UVA/UVB barrier and scratch-resistant oleophobic coating.',
        basePrice: 125,
        compareAtPrice: 155,
        badge: 'Best Seller',
        images: [
          'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80',
        ],
        variants: [
          { id: 'var_sg_tort', name: 'Vintage Tortoise / G-15 Green Lens', sku: 'SG-AV-TRT', color: 'Vintage Tortoise', colorHex: '#78350f', priceDelta: 0, stock: 19 },
          { id: 'var_sg_blk', name: 'Matte Obsidian / Smoke Polarized', sku: 'SG-AV-BLK', color: 'Matte Obsidian', colorHex: '#18181b', priceDelta: 0, stock: 25 },
        ],
        specifications: {
          'Frame': 'Mazzucchelli 1849 Cellulose Acetate',
          'Lenses': 'Polarized Impact-Resistant CR-39 Glass',
          'Hinges': 'Engineered German 7-Barrel OBE Rivets',
        },
      },
    ],
  },
  {
    keywords: ['coffee', 'mug', 'cup', 'beans', 'brew', 'espresso'],
    category: 'Lifestyle',
    items: [
      {
        name: 'Aero Precision Conical Burr Hand Grinder',
        tagline: '48mm heptagonal 420-grade stainless steel burrs with dual ball bearings.',
        description: 'Effortless micron-level grind adjustment from espresso to French press. Solid unibody aluminum alloy body with genuine walnut ergonomic handle.',
        basePrice: 115,
        compareAtPrice: 140,
        badge: 'Audiophile',
        images: [
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80',
        ],
        variants: [
          { id: 'var_gr_anod', name: 'Space Grey Anodized / Walnut', sku: 'CF-GR-GRY', color: 'Space Grey', colorHex: '#4b5563', priceDelta: 0, stock: 17 },
          { id: 'var_gr_slv', name: 'Brushed Silver / Beech', sku: 'CF-GR-SLV', color: 'Brushed Silver', colorHex: '#d1d5db', priceDelta: 0, stock: 14 },
        ],
        specifications: {
          'Burr Set': '48mm 420 Martensitic Stainless Steel',
          'Adjustment': '30 Microns Per Click (0.03mm precision)',
          'Capacity': '35g whole bean hopper',
        },
      },
    ],
  },
];

// Contextual fallback image pools for procedural generation
const GENERAL_IMAGE_POOLS = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=1000&q=80',
];

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Procedurally generates buyable product suggestions tailored to any search query
 */
export function generateSuggestionsForQuery(query: string, existingProducts: Product[]): Product[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  // Check if query matches any curated library category
  const matchedBanks = CURATED_SUGGESTION_BANK.filter((bank) =>
    bank.keywords.some((kw) => cleanQuery.includes(kw) || kw.includes(cleanQuery))
  );

  const results: Product[] = [];

  if (matchedBanks.length > 0) {
    matchedBanks.forEach((bank) => {
      bank.items.forEach((item, idx) => {
        const id = `sug_${cleanQuery.replace(/[^a-z0-9]/g, '')}_${idx + 1}`;
        // Ensure no duplicate with existing
        if (!existingProducts.some((p) => p.name.toLowerCase() === item.name.toLowerCase())) {
          results.push({
            id,
            name: item.name,
            slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            tagline: item.tagline,
            description: item.description,
            basePrice: item.basePrice,
            compareAtPrice: item.compareAtPrice,
            category: bank.category,
            tags: [cleanQuery, 'suggested', bank.category.toLowerCase()],
            images: item.images,
            featured: true,
            badge: item.badge || 'Smart Suggestion',
            totalStock: item.variants.reduce((acc, v) => acc + v.stock, 0) || 25,
            rating: 4.88 + (idx * 0.03),
            reviewCount: 38 + idx * 19,
            variants: item.variants,
            specifications: item.specifications,
            reviews: [
              {
                id: `rev_sug_${idx}`,
                author: 'Verified Collector',
                rating: 5,
                title: 'Surpassed expectations',
                comment: 'The craftsmanship and finish match top-tier luxury standards. Exactly what I was searching for.',
                date: '2026-09-02',
                verified: true,
              },
            ],
          });
        }
      });
    });
  }

  // If no specific keyword bank matched (e.g. user typed "perfume", "smart ring", "skateboard", "neon sign", etc.)
  // Generate 3 authentic bespoke buyable products based on the query!
  if (results.length === 0) {
    const formattedTerm = titleCase(cleanQuery);
    const prefixes = ['Apex Studio Edition', 'Atelier Handcrafted', 'Strata Precision', 'Kanso Minimalist'];
    const taglines = [
      `Engineered for daily perfection with premium materials and ergonomic finesse.`,
      `Artisan-built ${cleanQuery} designed to age with a timeless natural patina.`,
      `Next-generation high-durability ${cleanQuery} crafted for discerning collectors.`,
      `Ultralight minimalist construction with refined industrial aesthetics.`,
    ];
    const prices = [68, 125, 185, 240];

    for (let i = 0; i < 3; i++) {
      const name = `${prefixes[i]} ${formattedTerm}`;
      const img = GENERAL_IMAGE_POOLS[i % GENERAL_IMAGE_POOLS.length];
      const basePrice = prices[i];
      const id = `sug_gen_${cleanQuery.replace(/[^a-z0-9]/g, '')}_${i + 1}`;

      results.push({
        id,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        tagline: taglines[i],
        description: `Experience the ideal union of form and performance. This custom ${cleanQuery} is precision-machined and finished to deliver unparalleled reliability, tactile satisfaction, and modern minimalism.`,
        basePrice,
        compareAtPrice: Math.round(basePrice * 1.22),
        category: 'Lifestyle',
        tags: [cleanQuery, 'custom-search', 'suggested'],
        images: [img, GENERAL_IMAGE_POOLS[(i + 1) % GENERAL_IMAGE_POOLS.length]],
        featured: true,
        badge: i === 0 ? 'Smart Suggestion' : 'Popular',
        totalStock: 18 + i * 7,
        rating: 4.86 + (i * 0.04),
        reviewCount: 29 + i * 14,
        variants: [
          {
            id: `var_${id}_blk`,
            name: 'Matte Obsidian Black',
            sku: `GEN-${cleanQuery.toUpperCase().slice(0, 4)}-BLK`,
            color: 'Matte Obsidian',
            colorHex: '#18181b',
            priceDelta: 0,
            stock: 12,
          },
          {
            id: `var_${id}_slv`,
            name: 'Brushed Titanium / Raw',
            sku: `GEN-${cleanQuery.toUpperCase().slice(0, 4)}-TI`,
            color: 'Brushed Titanium',
            colorHex: '#d4d4d8',
            priceDelta: 15,
            stock: 8,
          },
        ],
        specifications: {
          'Category Standard': `Premium Grade ${formattedTerm}`,
          'Build Materials': 'Aerospace-Grade Alloy / Hydrophobic Weave',
          'Finish': 'Satin Anodized / Bead-Blasted Finish',
          'Warranty': '2-Year Global Manufacturer Guarantee',
        },
        reviews: [
          {
            id: `rev_gen_${i}`,
            author: 'Marcus Vance',
            rating: 5,
            title: 'Fantastic design and build',
            comment: `Found this through search and ordered immediately. The quality of this ${cleanQuery} is unmatched.`,
            date: '2026-08-28',
            verified: true,
          },
        ],
      });
    }
  }

  return results;
}
