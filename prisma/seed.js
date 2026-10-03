const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEPARTMENTS = [
  {
    name: 'Centre for Development Studies',
    slug: 'centre-for-development-studies',
    description: 'Interdisciplinary research and discourse on socio-economic development and policy.',
  },
  {
    name: 'Centre for Foreign Languages',
    slug: 'centre-for-foreign-languages',
    description: 'Linguistic studies, cultural exchange, and international communication skills.',
  },
  {
    name: 'Centre for Indian Languages',
    slug: 'centre-for-indian-languages',
    description: 'Exploration, literature, and preservation of indigenous and regional Indian languages.',
  },
  {
    name: 'Department of Agriculture',
    slug: 'department-of-agriculture',
    description: 'Agronomy, sustainable farming technologies, soil sciences, and crop development.',
  },
  {
    name: 'Department of Bioinformatics',
    slug: 'department-of-bioinformatics',
    description: 'Computational biology, structural genomics, molecular dynamics, and algorithmic genetics.',
  },
  {
    name: 'Department of Biotechnology',
    slug: 'department-of-biotechnology',
    description: 'Cell biology, genetic engineering, industrial microbiology, and biosystems.',
  },
  {
    name: 'Department of Chemistry',
    slug: 'department-of-chemistry',
    description: 'Organic, inorganic, physical, and analytical chemistry investigations.',
  },
  {
    name: 'Department of Commerce and Business Studies',
    slug: 'department-of-commerce-and-business-studies',
    description: 'Finance, accounting, corporate governance, marketing, and business administration.',
  },
  {
    name: 'Department of Computer Science',
    slug: 'department-of-computer-science',
    description: 'Software systems, artificial intelligence, algorithms, distributed computing, and cybersecurity.',
  },
  {
    name: 'Department of Economics',
    slug: 'department-of-economics',
    description: 'Macroeconomics, econometric modeling, fiscal policies, and economic theory.',
  },
  {
    name: 'Department of English',
    slug: 'department-of-english',
    description: 'Literary criticism, world literature in English, rhetoric, and cultural studies.',
  },
  {
    name: 'Department of Environmental Science',
    slug: 'department-of-environmental-science',
    description: 'Ecology, climate change mitigation, environmental monitoring, and sustainable resource management.',
  },
  {
    name: 'Department of Geography',
    slug: 'department-of-geography',
    description: 'Geospatial technologies, GIS, geomorphology, climate patterns, and human geography.',
  },
  {
    name: 'Department of Geology',
    slug: 'department-of-geology',
    description: 'Earth sciences, mineralogy, structural geology, paleontology, and hydrogeology.',
  },
  {
    name: 'Department of Hindi',
    slug: 'department-of-hindi',
    description: 'Hindi literature, linguistics, prose, poetry, and linguistic translation.',
  },
  {
    name: 'Department of History',
    slug: 'department-of-history',
    description: 'Ancient, medieval, modern Indian and world historiography, archeology, and social records.',
  },
  {
    name: 'Department of Law and Governance',
    slug: 'department-of-law-and-governance',
    description: 'Constitutional law, jurisprudence, human rights, public policy, and legal governance.',
  },
  {
    name: 'Department of Life Science',
    slug: 'department-of-life-science',
    description: 'Zoology, botany, physiological sciences, ecology, and evolutionary biology.',
  },
  {
    name: 'Department of Mass Communication and Media',
    slug: 'department-of-mass-communication-and-media',
    description: 'Journalism, broadcast media, digital content, advertising, and public relations.',
  },
  {
    name: 'Department of Mathematics',
    slug: 'department-of-mathematics',
    description: 'Pure and applied mathematics, differential equations, topology, and mathematical analysis.',
  },
  {
    name: 'Department of Pharmacy',
    slug: 'department-of-pharmacy',
    description: 'Pharmaceutical sciences, drug development, pharmacology, pharmacokinetics, and therapeutics.',
  },
  {
    name: 'Department of Physical Education',
    slug: 'department-of-physical-education',
    description: 'Kinesiology, sports physiology, athletic training, and wellness education.',
  },
  {
    name: 'Department of Physics',
    slug: 'department-of-physics',
    description: 'Quantum mechanics, condensed matter, high energy physics, electronics, and optics.',
  },
  {
    name: 'Department of Political Science and International Relations',
    slug: 'department-of-political-science-and-international-relations',
    description: 'Political theory, comparative politics, international diplomacy, and geopolitical strategy.',
  },
  {
    name: 'Department of Psychology',
    slug: 'department-of-psychology',
    description: 'Cognitive science, clinical psychology, behavioral research, and mental wellbeing.',
  },
  {
    name: 'Department of Social Work',
    slug: 'department-of-social-work',
    description: 'Community development, rural intervention, social policy, and welfare advocacy.',
  },
  {
    name: 'Department of Sociology',
    slug: 'department-of-sociology',
    description: 'Social structures, sociology of India, cultural movements, and qualitative field research.',
  },
  {
    name: 'Department of Statistics',
    slug: 'department-of-statistics',
    description: 'Statistical inference, stochastic modeling, data science, probability, and biostatistics.',
  },
  {
    name: 'Department of Teacher Education',
    slug: 'department-of-teacher-education',
    description: 'Pedagogy, educational psychology, curriculum planning, and innovative teacher training.',
  },
];

async function main() {
  console.log('Seeding all 29 official CUSB departments...');
  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { slug: dept.slug },
      update: { name: dept.name, description: dept.description },
      create: dept,
    });
  }
  const count = await prisma.department.count();
  console.log(`Successfully verified ${count} departments in database.`);
}

main()
  .catch((e) => {
    console.error('Error seeding departments:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
