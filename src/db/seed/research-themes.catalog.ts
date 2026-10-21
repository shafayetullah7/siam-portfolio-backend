/**
 * Dev seed source for research themes. Keep in sync with
 * siam-frontend/src/content/research.catalog.ts (Docker / CI only mount siam-api).
 */
export type ResearchThemeSeedEntry = {
  slug: string;
  title: string;
  description: string;
  tags?: readonly string[];
  status?: 'ongoing' | 'completed';
  featuredOnHome?: boolean;
  linkLabel?: string;
  problem?: string;
  approach?: string;
};

export const researchThemesCatalog: readonly ResearchThemeSeedEntry[] = [
  {
    slug: 'interpretable-representation-learning',
    title: 'Interpretable representation learning',
    description:
      'Disentangling latent structure for human-verifiable attribution in deep models. Replace with approved theme copy.',
    tags: ['Interpretability', 'Attribution', 'Latent audits'],
    status: 'ongoing',
    featuredOnHome: true,
    linkLabel: 'Explore theme & preprints',
    problem:
      'Black-box models make attribution and safety claims hard to verify in deployment.',
    approach:
      'Intrinsic certifiability and sparse dictionary views of activations, evaluated on vision and language backbones.',
  },
  {
    slug: 'sample-efficient-constrained-optimization',
    title: 'Sample-efficient constrained optimization',
    description:
      'Robust learning under data scarcity, physical boundaries, and distribution shift—with selective expert-in-the-loop queries.',
    tags: ['Active learning', 'Data scarcity', 'Optimization'],
    status: 'ongoing',
    featuredOnHome: true,
    linkLabel: 'Explore theme & preprints',
    problem:
      'Many domains cannot afford large labeled datasets or unconstrained compute.',
    approach:
      'Convex relaxations and active acquisition under explicit budget caps.',
  },
  {
    slug: 'human-aligned-oversight-governance',
    title: 'Human-aligned oversight & governance',
    description:
      'Evaluation suites, stress tests, and safety guarantees before autonomous pipelines enter high-consequence domains.',
    tags: ['Safety', 'Human oversight', 'Evaluation'],
    status: 'ongoing',
    featuredOnHome: true,
    linkLabel: 'Explore theme & preprints',
    problem:
      'Autonomous systems need empirical evidence before high-stakes rollout.',
    approach:
      'Counterfactual stress tests and human-in-the-loop evaluation protocols.',
  },
  {
    slug: 'archived-benchmarking-line',
    title: 'Archived benchmarking line (catalog only)',
    description:
      'Example past theme kept on the research index but not featured on home.',
    tags: ['Benchmarks'],
    status: 'completed',
    featuredOnHome: false,
    problem: 'Historical theme for layout testing.',
    approach: 'Completed work; details in publications list.',
  },
];
