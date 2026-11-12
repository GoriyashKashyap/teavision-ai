/**
 * Scientifically curated agronomic reference database for the 7 TeaVision AI classes.
 * Based on Tea Research Institute (TRI) literature and plant pathology standards.
 */

export interface DiseaseInfo {
  id: string;
  className: string;
  scientificName?: string;
  category: 'algal' | 'fungal' | 'pest' | 'healthy';
  categoryLabel: string;
  severity: 'low' | 'moderate' | 'high' | 'none';
  summary: string;
  symptoms: string[];
  causes: string[];
  preventivePractices: string[];
  recommendedNextSteps: string[];
  disclaimer: string;
}

export const DISEASE_LIBRARY: Record<string, DiseaseInfo> = {
  'Tea algal leaf spot': {
    id: 'tea-algal-leaf-spot',
    className: 'Tea algal leaf spot',
    scientificName: 'Cephaleuros virescens Kunze',
    category: 'algal',
    categoryLabel: 'Parasitic Algal Infection',
    severity: 'moderate',
    summary:
      'Caused by the parasitic green alga Cephaleuros virescens. It is prevalent in warm, humid tea estates with poor aeration or compromised bush vigor, attacking mature foliage and twigs.',
    symptoms: [
      'Circular, slightly raised orange-yellow to velvety reddish-brown spots on upper leaf surfaces.',
      'Lesions develop a crust-like, velvety texture during the sporulation phase.',
      'Affected leaves experience reduced photosynthetic capacity, premature yellowing, and eventual defoliation.',
      'Can spread to young green twigs, causing cortical cracking and dieback in severe cases.',
    ],
    causes: [
      'High relative humidity (>85%) accompanied by warm temperatures (24°C–30°C).',
      'Over-shaded tea bushes and poor canopy ventilation.',
      'Weakened bushes due to soil nutrient imbalances (particularly potassium deficiency) or poor drainage.',
    ],
    preventivePractices: [
      'Regulate shade canopy to allow morning sunlight penetration and improve wind circulation.',
      'Maintain balanced fertilizer schedules with adequate potassium (K) and zinc (Zn) nutrition.',
      'Ensure proper drainage to prevent waterlogging around root zones.',
      'Prune and destroy severely infected branches during bush maintenance.',
    ],
    recommendedNextSteps: [
      'Isolate affected sections of the estate and monitor disease spread.',
      'Consult an estate agronomist for targeted copper-based prophylactic spray recommendations if threshold is breached.',
      'Record observation in field logs with date, block location, and weather conditions.',
    ],
    disclaimer:
      'Model classification is based on visual foliage characteristics. Seek confirmation from an agricultural extension officer before applying chemical interventions.',
  },

  'Brown Blight': {
    id: 'brown-blight',
    className: 'Brown Blight',
    scientificName: 'Colletotrichum camelliae Massee / Glomerella cingulata',
    category: 'fungal',
    categoryLabel: 'Fungal Foliar Disease',
    severity: 'high',
    summary:
      'A major foliar fungal disease that causes necrotic brown lesions on mature tea leaves. It frequently establishes entry through mechanical injuries, sun scorch, or pest puncture wounds.',
    symptoms: [
      'Begins as small yellowish or brown spots on mature leaves, rapidly expanding into large, irregular brown necrotic patches.',
      'Concentric rings of dark minute dots (acervuli) visible upon close examination on upper leaf surfaces.',
      'Distinct demarcation line between healthy green tissue and dead brown tissue.',
      'Brittle, parched leaf sections that can tear or drop off under wind stress.',
    ],
    causes: [
      'Prolonged periods of heavy rain followed by bright sunlight (humid heat).',
      'Mechanical damage during plucking, pruning, or hail injury.',
      'Previous puncture damage caused by insect pests like Helopeltis.',
    ],
    preventivePractices: [
      'Handle foliage gently during harvesting to reduce mechanical wounds.',
      'Prune dead wood and remove fallen diseased leaves to reduce fungal spore reservoirs.',
      'Avoid high nitrogen application without commensurate potassium supplementation.',
      'Apply protective copper oxychloride or systemic fungicide sprays during high-risk monsoon seasons as guided by TRI guidelines.',
    ],
    recommendedNextSteps: [
      'Examine whether the lesion originated from mechanical wounding or insect feeding.',
      'Collect sample leaves in clean paper bags for plant pathology laboratory confirmation.',
      'Review harvest interval to avoid plucking through heavily infected patches.',
    ],
    disclaimer:
      'Colletotrichum species share visual traits with other blight fungi. Always verify with microscopic examination or institutional pathology support.',
  },

  'Gray Blight': {
    id: 'gray-blight',
    className: 'Gray Blight',
    scientificName: 'Pestalotiopsis theae (Sawada) Steyaert',
    category: 'fungal',
    categoryLabel: 'Fungal Foliar Disease',
    severity: 'high',
    summary:
      'One of the most destructive leaf spot diseases in tea plantations worldwide. It targets mature maintenance leaves and young harvestable flushes, drastically reducing harvest yields.',
    symptoms: [
      'Oval to irregular lesions starting at leaf margins or tips, initially brownish and fading to ash-gray or silvery-gray.',
      'Characteristic concentric zonate rings alternating between light and dark shades of gray.',
      'Numerous tiny black spore-producing structures (conidiomata) scatter across the gray center of older lesions.',
      'Leaves become dry, papery, curled, and prone to premature leaf drop.',
    ],
    causes: [
      'Fungal spores disseminated primarily by rain splash and wind.',
      'Foliage wounded by severe sun scorch, plucking trauma, or mite infestation.',
      'Dense foliage retaining moisture for extended durations without adequate drying.',
    ],
    preventivePractices: [
      'Sanitary pruning: cut back affected branches below infected zones and destroy litter.',
      'Promote good bush canopy aeration through selective weed control and shade lopping.',
      'Maintain adequate potassium reserves to strengthen epidermal leaf cell walls.',
      'Apply certified bio-control agents or standard antifungal barrier sprays according to regional extension recommendations.',
    ],
    recommendedNextSteps: [
      'Differentiate from Brown Blight by checking for the ash-gray center and black pycnidia dots.',
      'Assess block incidence percentage to determine if spot treatment or block-level spray is warranted.',
      'Document environmental humidity and rainfall during the preceding 14 days.',
    ],
    disclaimer:
      'Visual symptoms of Gray Blight can mimic potassium scorching or severe sunburn in dry conditions. Verify with estate agronomists.',
  },

  'Helopeltis': {
    id: 'helopeltis',
    className: 'Helopeltis',
    scientificName: 'Helopeltis theivora Waterhouse (Tea Mosquito Bug)',
    category: 'pest',
    categoryLabel: 'Hemipteran Insect Pest Damage',
    severity: 'high',
    summary:
      'Feeding injury caused by Helopeltis theivora (tea mosquito bug). Both nymphs and adults inject toxic saliva while sucking sap from succulent buds, young shoots, and tender flush leaves.',
    symptoms: [
      'Water-soaked, circular feeding punctures on tender young leaves and internodes within hours of feeding.',
      'Punctures darken rapidly to reddish-brown and eventually turn black or dark necrotic scabs.',
      'Young leaves curl, crinkle, and dry up into characteristic "shot-hole" perforations as healthy tissue grows around dead spots.',
      'Severe dieback of growing tips, leading to stunted shoots and complete cessation of flush growth.',
    ],
    causes: [
      'Favors shady, moist, low-elevation or mid-elevation tea microclimates.',
      'Dense unpruned tea sections and alternate host weed species (e.g., Mikania micrantha) in vicinity.',
      'Pest population spikes following early monsoon showers.',
    ],
    preventivePractices: [
      'Systematic weed sanitation: eradicate alternate weed hosts along drains and boundaries.',
      'Intensive close plucking to physically remove hiding nymphs and egg-bearing shoots.',
      'Regulate shade canopy to increase ambient light, which deters shade-preferring Helopeltis.',
      'Deploy integrated pest management (IPM) protocols, including targeted twilight spraying and light monitoring traps.',
    ],
    recommendedNextSteps: [
      'Conduct immediate morning or late-afternoon field sweeps to detect live nymphs and adults.',
      'Check tender stem internodes for insertion of pest egg-filaments.',
      'Report pest hotspot coordinates to plantation management for immediate IPM barrier application.',
    ],
    disclaimer:
      'Visual classification detects necrotic feeding lesions. Live bug verification in the field is necessary to determine active population thresholds.',
  },

  'Red spider': {
    id: 'red-spider',
    className: 'Red spider',
    scientificName: 'Oligonychus coffeae Nietner (Red Spider Mite)',
    category: 'pest',
    categoryLabel: 'Acarine Mite Pest Damage',
    severity: 'high',
    summary:
      'Caused by the red spider mite Oligonychus coffeae. Mites colonize the upper leaf surface in large colonies under fine silken webbing, piercing epidermal cells and extracting chloroplastic sap.',
    symptoms: [
      'Characteristic bronzing, copper-tinting, or rust-colored discoloration along midribs and lateral veins.',
      'Leaves lose their glossy green luster, appearing dull, dusty, and leathery.',
      'Silken fine webbing visible with trapped dust particles and minute reddish mite cast skins.',
      'Severe infestation leads to extensive leaf bronzing, drying, and premature shedding, weakening the bush frame.',
    ],
    causes: [
      'Prolonged dry spells, high ambient temperatures, and low relative humidity.',
      'Roadside tea rows subjected to heavy dust deposition, which shields mites from predatory beneficials.',
      'Indiscriminate use of broad-spectrum synthetic pyrethroids that destroy natural predatory phytoseiid mites.',
    ],
    preventivePractices: [
      'Water sprinkling or overhead misting in nurseries and young tea during drought periods.',
      'Plant windbreaks and wet perimeter roads to minimize road dust deposition onto adjacent bushes.',
      'Conserve natural predators (ladybird beetles, predatory thrips, phytoseiid mites).',
      'Apply neem-based organic formulations or specific acaricides (e.g., sulfur formulations where allowed by certifying bodies).',
    ],
    recommendedNextSteps: [
      'Use a 10x hand lens in the field to inspect the upper leaf surface for moving red mites and whitish cast skins.',
      'Assess mite counts per square inch of leaf to calculate economic threshold levels (ETL).',
      'Wash foliage with high-pressure water sprays if localized to early boundary bushes.',
    ],
    disclaimer:
      'Mite damage can resemble micronutrient deficiency or drought stress. A hand-lens confirmation of acarine presence is strongly advised.',
  },

  'Green mirid bug': {
    id: 'green-mirid-bug',
    className: 'Green mirid bug',
    scientificName: 'Lygocoris lucorum Meyer-Dür / Apolygus lucorum',
    category: 'pest',
    categoryLabel: 'Mirid Bug Foliar Damage',
    severity: 'moderate',
    summary:
      'Damage induced by green plant bugs (Miridae). They target tender shoot tips, young foliage, and flower buds by inserting piercing-sucking stylets and injecting phytotoxic digestive saliva.',
    symptoms: [
      'Small, translucent pinprick spots that rapidly turn brown or black on expanding young leaves.',
      'Irregular holes, leaf tearing, and ragged foliage edges as leaves expand around necrotized feeding points.',
      'Deformed, puckered, or distorted growing shoots resembling viral crinkling.',
      'Abscission of tender flower buds and premature termination of growing buds (crow-footing).',
    ],
    causes: [
      'Movement of adult mirid bugs from surrounding secondary hosts (flowering weeds, leguminous cover crops).',
      'Overlapping seasonal flushes coinciding with mirid bug migration.',
      'Absence of natural predatory spiders and hemipteran predators.',
    ],
    preventivePractices: [
      'Manage weeds and boundary flowering plants that act as interim reproduction hosts.',
      'Maintain regular harvesting intervals to remove tender succulent tissue favored by mirid nymphs.',
      'Monitor flush shoots weekly using sweep nets or sticky yellow monitoring traps.',
      'Implement biological control strategies promoting beneficial entomopathogenic fungi and generalist predators.',
    ],
    recommendedNextSteps: [
      'Inspect growing tips for fresh feeding pinpricks vs older ragged tears.',
      'Verify whether damage is localized to estate boundaries adjacent to weed thickets.',
      'Consult regional IPM guidelines for threshold-based selective botanical or biorational treatments.',
    ],
    disclaimer:
      'Mirid feeding damage may appear similar to early mechanical tears or hail marks. Inspect shoot tips for characteristic piercing punctures.',
  },

  'Healthy leaf': {
    id: 'healthy-leaf',
    className: 'Healthy leaf',
    scientificName: 'Camellia sinensis (L.) Kuntze',
    category: 'healthy',
    categoryLabel: 'Normal Healthy Foliage',
    severity: 'none',
    summary:
      'Vigorous, asymptomatic tea foliage exhibiting standard morphological traits, uniform chlorophyll distribution, and intact epidermal integrity.',
    symptoms: [
      'Uniform rich green coloration appropriate for the cultivar (light yellow-green for young flush, deep glossy green for mature leaves).',
      'Smooth leaf margins with characteristic serrations and no irregular necroses or tears.',
      'Clean epidermal surface free from pustules, fungal mycelia, webbing, or water-soaked lesions.',
      'Turgid, flexible leaf texture indicating healthy water and nutrient translocation.',
    ],
    causes: [
      'Optimal agronomic maintenance, balanced NPK + Mg + Zn nutrition, and favorable soil pH (4.5–5.5).',
      'Adequate soil moisture, effective shade management, and healthy root systems.',
      'Effective baseline integrated pest and disease monitoring.',
    ],
    preventivePractices: [
      'Continue standard pruning, tipping, and plucking cycles according to cultivar requirements.',
      'Maintain routine soil nutrient testing and foliar micronutrient applications.',
      'Keep plantation drains clear and maintain appropriate organic mulch cover.',
      'Perform regular scout walks across plantation blocks to maintain early-warning vigilance.',
    ],
    recommendedNextSteps: [
      'No remedial action required.',
      'Continue periodic preventive monitoring across adjacent rows.',
      'Log observation as a healthy baseline control in field surveillance datasets.',
    ],
    disclaimer:
      'A "Healthy leaf" prediction indicates the absence of visible signs of the 6 trained disease/pest categories on this sample. It does not certify immunity to root disorders, systemic viruses, or latent infections.',
  },
};

