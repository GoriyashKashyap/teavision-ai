"""Agronomic AI Assistant Service.
Provides scientifically verified tea plantation guidance and disease intelligence
powered by Google Gemini (with TRI/UPASI grounding) and fallback to a curated
Tea Research Institute (TRI) Sri Lanka expert knowledge base.
"""

from __future__ import annotations

import logging
from typing import List, Optional
import httpx

from app.core.config import settings
from app.schemas.assistant import AssistantChatResponse

logger = logging.getLogger("teavision.assistant")

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


async def _call_gemini_llm(
    message: str,
    context_disease: Optional[str] = None,
    history: Optional[List[dict]] = None,
) -> Optional[AssistantChatResponse]:
    """Call Google Gemini 1.5 Flash via REST API with TRI plant pathology grounding."""
    if not settings.GEMINI_API_KEY or not settings.GEMINI_API_KEY.strip():
        return None

    # Construct grounding knowledge
    grounding_text = "\n\n".join([
        f"### {v['title']}\n"
        f"- Symptoms: {v['symptoms']}\n"
        f"- Causes & Environmental Triggers: {v['causes']}\n"
        f"- Prevention: {v['prevention']}\n"
        f"- Estate Management: {v['management']}\n"
        f"- Biological / Organic Alternatives: {v['organic']}"
        for v in KNOWLEDGE_BASE.values()
    ])

    system_instruction = (
        "You are the TeaVision Senior Plant Pathologist and Tea Agronomist Assistant. "
        "You specialize in Camellia sinensis (tea plant) agronomy, foliar pathology, and integrated pest management (IPM).\n\n"
        "GROUNDING PLANT PATHOLOGY KNOWLEDGE (Tea Research Institute of Sri Lanka & UPASI):\n"
        f"{grounding_text}\n\n"
        f"CURRENT DIAGNOSTIC CONTEXT: Leaf category is '{context_disease or 'General Inquiry'}'.\n\n"
        "INSTRUCTIONS:\n"
        "1. Give direct, empathetic, and actionable advice for tea plantation workers, smallholders, and estate managers.\n"
        "2. Prioritize cultural management (shade regulation, drainage, plucking table hygiene) and organic bio-controls (Beauveria bassiana, Trichoderma, neem extracts).\n"
        "3. For chemical measures: Emphasize that chemical products, dosages, and pre-harvest intervals (PHI) must strictly comply with local estate guidelines and regulatory authorities.\n"
        "4. Format your answer with clear markdown headings, bullet points, and bold terms.\n"
        "5. Conclude your response with exactly 3 relevant follow-up questions formatted as:\n"
        "FOLLOWUP_QUESTIONS:\n"
        "- <Question 1>\n"
        "- <Question 2>\n"
        "- <Question 3>"
    )

    contents = []
    if history:
        for msg in history[-6:]:
            role = "user" if msg.get("role") == "user" else "model"
            content = msg.get("content") or msg.get("text", "")
            if content:
                contents.append({
                    "role": role,
                    "parts": [{"text": content}]
                })

    contents.append({
        "role": "user",
        "parts": [{"text": message}]
    })

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent"
        f"?key={settings.GEMINI_API_KEY}"
    )

    payload = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1024,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                logger.warning(f"Gemini API returned {response.status_code}: {response.text}")
                return None

            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return None

            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if not text:
                return None

            # Parse followups if present
            followups: List[str] = []
            reply_text = text.strip()
            if "FOLLOWUP_QUESTIONS:" in text:
                parts = text.split("FOLLOWUP_QUESTIONS:")
                reply_text = parts[0].strip()
                raw_followups = parts[1].strip().split("\n")
                for q in raw_followups:
                    clean_q = q.strip().lstrip("-*123. ").strip()
                    if clean_q and len(clean_q) > 5:
                        followups.append(clean_q)

            if not followups:
                followups = [
                    f"What are the organic controls for {context_disease or 'this condition'}?",
                    f"What weather triggers {context_disease or 'disease outbreaks'}?",
                    "How does shade regulation improve bush health?",
                ]

            return AssistantChatResponse(
                reply=reply_text,
                suggested_followups=followups[:3],
                references=REFERENCES,
                disclaimer=DISCLAIMER,
                provider=f"Gemini ({settings.GEMINI_MODEL})",
            )
    except Exception as exc:
        logger.warning(f"Failed to query Gemini LLM ({exc}); using fallback rule-based system.", exc_info=True)
        return None


def _rule_based_query(
    message: str,
    context_disease: Optional[str] = None,
) -> AssistantChatResponse:
    """Fallback rule-based agronomic response from local TRI knowledge base."""
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
            provider="rule-based (offline TRI knowledge base)",
        )

    # Intent flags
    is_organic = any(w in msg for w in ["organic", "natural", "biological", "bio", "chemical-free", "home remedy"])
    is_prevention = any(w in msg for w in ["prevent", "avoid", "protect", "stop", "care", "cultural"])
    is_symptoms = any(w in msg for w in ["symptom", "identify", "look like", "diagnose", "tell", "distinguish"])
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
            provider="rule-based (offline TRI knowledge base)",
        )

    # General query
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
        provider="rule-based (offline TRI knowledge base)",
    )


async def process_assistant_query(
    message: str,
    context_disease: Optional[str] = None,
    history: Optional[List[dict]] = None,
) -> AssistantChatResponse:
    """Analyze user prompt and return agronomic intelligence (Gemini LLM or rule-based fallback)."""
    # 1. Try Gemini LLM if configured
    gemini_res = await _call_gemini_llm(message, context_disease, history)
    if gemini_res is not None:
        return gemini_res

    # 2. Fall back to curated TRI rule-based system
    return _rule_based_query(message, context_disease)
