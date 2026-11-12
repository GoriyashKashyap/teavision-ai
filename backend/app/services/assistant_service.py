"""Agronomic AI Assistant Service.
Provides scientifically verified tea plantation guidance and disease intelligence
based on Tea Research Institute (TRI) and UPASI agronomic literature.
"""

from __future__ import annotations

import re
from typing import Dict, List, Optional
from app.schemas.assistant import AssistantChatResponse

# Curated Plant Pathology Knowledge Base
KNOWLEDGE_BASE = {
    "tea algal leaf spot": {
        "title": "Tea Algal Leaf Spot (Cephaleuros virescens)",
        "symptoms": "Circular raised orange-yellow to velvety reddish-brown spots on upper leaf surfaces and green stems.",
        "causes": "High humidity (>85%), warm temperatures (24-30°C), dense unpruned canopies, and poor soil drainage.",
        "prevention": "Regulate shade trees to allow morning sun penetration; ensure balanced potassium (K) nutrition; improve field drainage.",
        "management": "Prune severely affected twigs during winter/dry maintenance; apply copper-based protective sprays if recommended by the local estate extension officer.",
        "organic": "Neem oil formulations (0.5%) and shade lopping to maximize solar drying of leaf canopies.",
    },
    "brown blight": {
        "title": "Brown Blight (Colletotrichum camelliae / Glomerella cingulata)",
        "symptoms": "Yellowish spots turning into large, irregular necrotic brown lesions with concentric rings of minute black dots (acervuli).",
        "causes": "Heavy rainfall followed by bright sunshine; entry through wounds from plucking, sun scorch, or insect punctures.",
        "prevention": "Handle tender shoots gently during plucking to prevent tissue bruising; avoid high nitrogen application without adequate potassium; prune dead wood.",
        "management": "Remove fallen diseased leaves; apply protective copper oxychloride (0.25%) or approved systemic fungicides during pre-monsoon flushes.",
        "organic": "Foliar application of Trichoderma viride or Bacillus subtilis bio-fungicide formulations.",
    },
    "gray blight": {
        "title": "Gray Blight (Pestalotiopsis theae)",
        "symptoms": "Oval or irregular lesions starting at leaf margins, fading to ash-gray with concentric rings and tiny black conidiomata dots.",
        "causes": "Foliage injured by sun scorch, shear plucking wounds, or mite feeding; warm wet microclimates.",
        "prevention": "Promote bush aeration; regulate plucking shear height to avoid lacerating mature foliage; maintain potassium reserves.",
        "management": "Sanitary pruning below infected zones; burn or bury infected trimmings; apply recommended barrier sprays.",
        "organic": "Extracts of neem cake wash or bio-fungicide sprays with Trichoderma harzianum.",
    },
    "helopeltis": {
        "title": "Helopeltis (Tea Mosquito Bug - Helopeltis theivora)",
        "symptoms": "Water-soaked punctures on tender shoots turning dark brown or black within hours; crinkled 'shot-hole' leaves and shoot dieback.",
        "causes": "Moist, shaded valleys; presence of alternate weed hosts like Mikania micrantha; population surges after initial monsoon showers.",
        "prevention": "Intensive weed sanitation along perimeter drains; close plucking (7-8 day rounds) to physically remove nymphs and eggs; reduce heavy shade.",
        "management": "Twilight spraying targeting adult activity; deploy light monitoring traps; spot-spray localized boundary infestations.",
        "organic": "Beauveria bassiana entomopathogenic fungus; 5% Neem Seed Kernel Extract (NSKE) as an anti-feedant.",
    },
    "red spider": {
        "title": "Red Spider Mite (Oligonychus coffeae)",
        "symptoms": "Bronzing or copper discoloration along midribs; dusty, leathery leaf appearance with silken webs and trapped dust on upper surfaces.",
        "causes": "Prolonged dry, hot spells; dusty roadside bushes; indiscriminate broad-spectrum synthetic pyrethroids killing predatory mites.",
        "prevention": "Plant roadside vegetative windbreaks and wet perimeter paths; conserve predatory ladybird beetles and phytoseiid mites.",
        "management": "Water spraying/sprinkling in nurseries and young tea; apply wettable sulfur (0.2%) or specific approved acaricides during early infestation.",
        "organic": "Sulfur-based sprays where permitted; high-pressure water washing of infested border bushes.",
    },
    "green mirid bug": {
        "title": "Green Mirid Bug (Lygocoris lucorum / Apolygus lucorum)",
        "symptoms": "Tiny pinprick spots on expanding leaves causing ragged holes, tearing, and distorted growing shoots (crow-footing).",
        "causes": "Migration from flowering weeds and legume cover crops during tender flush emergence.",
        "prevention": "Mow or suppress flowering weed borders; adhere to strict plucking rounds; inspect tender buds weekly.",
        "management": "Monitor using yellow sticky traps; apply botanical bio-pesticides at dusk when bugs are active on top canopy.",
        "organic": "Pyrethrum extracts or insecticidal soap sprays targeting young nymphs.",
    },
    "healthy leaf": {
        "title": "Healthy Leaf (Camellia sinensis)",
        "symptoms": "Normal vibrant green color, uniform texture, intact serrations, absence of lesions, pustules, or feeding punctures.",
        "causes": "Balanced agronomic nutrition (NPK:Mg 4:1:2:1 ratio), adequate soil pH (4.5-5.5), sound drainage, and timely plucking.",
        "prevention": "Maintain scheduled soil testing; apply balanced foliar micronutrients (Zinc, Magnesium, Boron); inspect bushes weekly.",
        "management": "Continue regular plucking table maintenance and preventive integrated pest management scout rounds.",
        "organic": "Compost mulch, vermicompost application, and biological nitrogen fixers.",
    },
}

REFERENCES = [
    "Tea Research Institute of Sri Lanka (TRISL) Advisory Circulars on Foliar Diseases & IPM.",
    "United Planters' Association of Southern India (UPASI) Tea Scientific Department Guidelines.",
    "Food and Agriculture Organization (FAO) Guide on Sustainable Tea Pest & Disease Management.",
]

DISCLAIMER = (
    "AI Agronomist guidance is synthesized from agricultural literature for field monitoring. "
    "Always consult estate plant pathologists or agricultural extension officers before applying chemical treatments."
)


def process_assistant_query(
    message: str,
    context_disease: Optional[str] = None,
    history: Optional[List[dict]] = None,
) -> AssistantChatResponse:
    """Analyze user prompt and generate an authoritative agricultural response."""
    msg = message.lower().strip()

    # Identify target disease from message or context
    target_key: Optional[str] = None
    for key in KNOWLEDGE_BASE.keys():
        if key in msg or (key == "red spider" and "mite" in msg) or (key == "helopeltis" and "mosquito" in msg):
            target_key = key
            break

    if not target_key and context_disease:
        norm_context = context_disease.lower().strip()
        for key in KNOWLEDGE_BASE.keys():
            if key in norm_context:
                target_key = key
                break

    # If asking generally about diseases
    if any(q in msg for q in ["what diseases", "all diseases", "list diseases", "categories"]):
        reply = (
            "TeaVision AI is calibrated to detect **7 key tea foliage conditions**:\n\n"
            "1. **Tea algal leaf spot** (*Cephaleuros virescens* - parasitic alga)\n"
            "2. **Brown Blight** (*Colletotrichum camelliae* - foliar fungus)\n"
            "3. **Gray Blight** (*Pestalotiopsis theae* - foliar fungus)\n"
            "4. **Helopeltis** (*Helopeltis theivora* - tea mosquito bug)\n"
            "5. **Red spider** (*Oligonychus coffeae* - acarine mite)\n"
            "6. **Green mirid bug** (*Lygocoris lucorum* - sucking insect)\n"
            "7. **Healthy leaf** (*Camellia sinensis* - normal foliage)\n\n"
            "Which condition would you like management or diagnostic guidance on?"
        )
        return AssistantChatResponse(
            reply=reply,
            suggested_followups=[
                "How do I prevent Brown Blight?",
                "What causes Gray Blight?",
                "How do I control Helopeltis naturally?",
            ],
            references=REFERENCES,
            disclaimer=DISCLAIMER,
        )

    # If asking about organic / natural methods
    is_organic = any(w in msg for w in ["organic", "natural", "biological", "bio", "chemical-free", "home remedy"])

    # If asking about prevention
    is_prevention = any(w in msg for w in ["prevent", "avoid", "protect", "stop", "care", "cultural"])

    # If asking about symptoms / identification
    is_symptoms = any(w in msg for w in ["symptom", "identify", "look like", "diagnose", "tell", "distinguish"])

    # If asking about causes / weather
    is_causes = any(w in msg for w in ["cause", "why", "trigger", "weather", "rain", "sun", "humid", "dry"])

    if target_key:
        info = KNOWLEDGE_BASE[target_key]
        parts = [f"### {info['title']}\n"]

        if is_organic:
            parts.append(f"**Biological & Organic Management:**\n{info['organic']}\n")
            parts.append(f"**Cultural Practices:**\n{info['prevention']}")
        elif is_prevention:
            parts.append(f"**Preventive Cultural Practices:**\n{info['prevention']}\n")
            parts.append(f"**General Management:**\n{info['management']}")
        elif is_symptoms:
            parts.append(f"**Key Foliar Symptoms:**\n{info['symptoms']}\n")
            parts.append(f"**Primary Causes & Triggers:**\n{info['causes']}")
        elif is_causes:
            parts.append(f"**Environmental Causes & Triggers:**\n{info['causes']}\n")
            parts.append(f"**Preventive Actions:**\n{info['prevention']}")
        else:
            parts.append(f"**Symptoms:** {info['symptoms']}\n")
            parts.append(f"**Triggers:** {info['causes']}\n")
            parts.append(f"**Recommended Management:** {info['management']}\n")
            parts.append(f"**Organic Alternatives:** {info['organic']}")

        reply = "\n".join(parts)

        followups = [
            f"What organic controls exist for {info['title'].split('(')[0].strip()}?",
            f"What weather triggers {info['title'].split('(')[0].strip()}?",
            "How does shade management help tea bushes?",
        ]

        return AssistantChatResponse(
            reply=reply,
            suggested_followups=followups,
            references=REFERENCES,
            disclaimer=DISCLAIMER,
        )

    # General tea agronomy query
    reply = (
        "Hello! I am your **TeaVision Agronomist Assistant**.\n\n"
        "I can help you with:\n"
        "- Detailed symptoms and field diagnosis for the 7 trained tea leaf categories.\n"
        "- Non-chemical and organic integrated pest management (IPM) protocols.\n"
        "- Cultural practices including shade lopping, plucking cycles, and potassium nutrition.\n"
        "- Distinguishing between fungal blights, insect damage, and environmental scorch.\n\n"
        "Please ask a question about any tea leaf symptom, disease, or pest!"
    )
    return AssistantChatResponse(
        reply=reply,
        suggested_followups=[
            "How do I prevent Brown Blight in rainy seasons?",
            "How can I tell Gray Blight apart from sunburn?",
            "What organic controls work best for Red Spider Mite?",
            "What plucking schedule deters Helopeltis?",
        ],
        references=REFERENCES,
        disclaimer=DISCLAIMER,
    )

