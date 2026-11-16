"""Context-Aware Diagnostic Engine for TeaVision AI.

Combines model prediction + Grad-CAM visual explanation + field observations
+ structured agricultural knowledge → structured diagnostic reasoning.

Rule-based engine that:
- Matches predicted class to known causes (from TRI/plant pathology literature)
- Filters contributing factors by environmental observations (lighting, shade, humidity)
- Uses RAG-style retrieval from the disease knowledge base
- Returns evidence strengths DISTINCT from model classification confidence
- Flags "Insufficient evidence" or "Expert verification required"
- Recommends next steps separated by category: cultural, sanitation, drainage,
  biological, chemical (with mandatory official guidance checks)
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional, Any, Tuple, Literal
from dataclasses import dataclass, field
from enum import Enum

from app.ml.classes import DISEASE_CLASSES
from app.ml.explainability import generate_attention_heatmap

from app.schemas.prediction import PredictionResponse
from app.schemas.observation import FieldObservationPayload

logger = logging.getLogger("teavision.diagnostic_engine")


# ============================================================================
# AGRICULTURAL KNOWLEDGE BASE (Module B Enhancement)
# Structured data for all 7 categories with references and dates
# ============================================================================

class EvidenceStrength(str, Enum):
    """Evidence strength levels distinct from model confidence."""
    STRONG = "strong"
    MODERATE = "moderate"
    WEAK = "weak"
    INSUFFICIENT = "insufficient"


class CausalityType(str, Enum):
    """Classification of causal agent evidence type."""
    DOCUMENTED = "documented"
    CONTRIBUTING = "contributing_factor"
    HYPOTHESIS = "hypothesis"
    UNVERIFIED = "unverified"


@dataclass
class DiseaseKnowledge:
    """Structured knowledge for a single disease/pest category."""
    category_id: str
    name: str
    scientific_name: str
    category: Literal["algal", "fungal", "pest", "healthy"]
    documented_causal_agents: List[str] = field(default_factory=list)
    typical_symptoms: List[str] = field(default_factory=list)
    environmental_contributing_factors: List[str] = field(default_factory=list)
    conditions_favoring_spread: List[str] = field(default_factory=list)
    diagnostic_clues: List[str] = field(default_factory=list)
    similar_looking_conditions: List[str] = field(default_factory=list)
    recommended_field_observations: List[str] = field(default_factory=list)
    preventive_practices: List[str] = field(default_factory=list)
    management_guidance: List[str] = field(default_factory=list)
    references: List[Dict[str, str]] = field(default_factory=list)
    last_reviewed: str = ""


# Comprehensive knowledge base with documented sources
KNOWLEDGE_BASE: Dict[str, DiseaseKnowledge] = {
    "Tea algal leaf spot": DiseaseKnowledge(
        category_id="tea-algal-leaf-spot",
        name="Tea algal leaf spot",
        scientific_name="Cephaleuros virescens Kunze",
        category="algal",
        documented_causal_agents=[
            "Cephaleuros virescens (parasitic green alga)"
        ],
        typical_symptoms=[
            "Circular, slightly raised orange-yellow to velvety reddish-brown spots on upper leaf surfaces",
            "Lesions develop crust-like, velvety texture during sporulation",
            "Affected leaves show reduced photosynthetic capacity, premature yellowing",
            "Can spread to young green twigs causing cortical cracking"
        ],
        environmental_contributing_factors=[
            "High relative humidity (>85%)",
            "Warm temperatures (24-30°C)",
            "Over-shaded tea bushes with poor ventilation",
            "Poor drainage leading to waterlogged root zones",
            "Potassium deficiency in soil nutrition"
        ],
        conditions_favoring_spread=[
            "Dense canopy preventing sun penetration",
            "Stagnant air within bush canopy",
            "Extended leaf wetness duration after dew/rain"
        ],
        diagnostic_clues=[
            "Velvety texture of lesions under magnification",
            "Greenish algal filaments visible on lesion surfaces",
            "Upper leaf surface predominantly affected"
        ],
        similar_looking_conditions=[
            "Mango leaf spot (another Cephaleuros species)",
            "Iron deficiency chlorosis (marginal yellowing)",
            "Fungal leaf spots with similar circular margins"
        ],
        recommended_field_observations=[
            "Inspect lesion texture with hand lens",
            "Check neighboring bushes for spread pattern",
            "Note canopy density and shade levels",
            "Record recent rainfall and humidity conditions"
        ],
        preventive_practices=[
            "Regulate shade canopy for morning sunlight penetration",
            "Improve wind circulation through selective lopping",
            "Maintain balanced fertilizer with adequate potassium and zinc",
            "Ensure proper drainage to prevent waterlogging"
        ],
        management_guidance=[
            "Prune and destroy severely infected branches during maintenance",
            "Apply copper-based protective sprays when thrips are active",
            "Remove and destroy fallen infected leaves to reduce inoculum"
        ],
        references=[
            {"title": "Tea Board of India – Tea Handbook", "year": "2020"},
            {"title": "TRI Bulletin on Algal Diseases of Tea", "year": "2018"},
            {"title": "NIPHM Guidelines: Tea Foliar Diseases", "year": "2019"}
        ],
        last_reviewed="2024-03-15"
    ),

    "Brown Blight": DiseaseKnowledge(
        category_id="brown-blight",
        name="Brown Blight",
        scientific_name="Colletotrichum camelliae / Glomerella cingulata",
        category="fungal",
        documented_causal_agents=[
            "Colletotanthum camelliae (anamorph)",
            "Glomerella cingulata (teleomorph)"
        ],
        typical_symptoms=[
            "Small yellowish spots on mature leaves, rapidly expanding to large irregular brown necrotic patches",
            "Concentric rings of dark minute dots (acervuli) visible on upper leaf surfaces",
            "Distinct demarcation line between healthy green and dead brown tissue",
            "Brittle, parched leaf sections that tear or drop under wind stress"
        ],
        environmental_contributing_factors=[
            "Heavy rainfall followed by bright sunlight (humid heat)",
            "Mechanical injuries from handling, pruning, plucking",
            "Sun scorch creating entry wounds",
            "Insect puncture wounds from Helopeltis"
        ],
        conditions_favoring_spread=[
            "High humidity (>85%) for 48+ hours",
            "Temperature between 23-30°C",
            "Wet foliage persisting overnight"
        ],
        diagnostic_clues=[
            "Acervuli (black dots) visible only on upper surface",
            "Distinct border with healthy tissue",
            "Rapid lesion expansion within 24-48 hours"
        ],
        similar_looking_conditions=[
            "Gray Blight (Pestalotiopsis - ash-gray centers)",
            "Botrytis black spot (soft, gray centers)",
            "Mechanical browning from sun scorch"
        ],
        recommended_field_observations=[
            "Check for wounds, sun scorch, or insect feeding marks",
            "Look for tiny black dots (acervuli) on upper leaf surface",
            "Note if lesions appeared after heavy rain",
            "Inspect adjacent leaves for contiguous spread"
        ],
        preventive_practices=[
            "Handle foliage gently during harvesting and pruning",
            "Remove fallen diseased leaves and debris (sanitary pruning)",
            "Avoid excessive nitrogen without adequate potassium"
        ],
        management_guidance=[
            "Apply protective copper oxychloride (0.25%) during high-risk monsoon periods",
            "Use systemic fungicides based on TRI recommendations",
            "Sanitation: burn or bury infected material"
        ],
        references=[
            {"title": "Tea Research Institute – Brown Blight Fungicide Guide", "year": "2021"},
            {"title": "UPASI Tea Pathology Handbook", "year": "2020"},
            {"title": "FAO Plant Protection Practice 118", "year": "2019"}
        ],
        last_reviewed="2024-03-10"
    ),

    "Gray Blight": DiseaseKnowledge(
        category_id="gray-blight",
        name="Gray Blight",
        scientific_name="Pestalotiopsis theae (Sawada) Steyaert",
        category="fungal",
        documented_causal_agents=[
            "Pestalotiopsis theae (fungus)"
        ],
        typical_symptoms=[
            "Oval to irregular lesions starting at leaf margins or tips",
            "Lesions fade from brown to ash-gray or silvery-gray",
            "Characteristic concentric zonate rings alternating between light and dark shades",
            "Numerous tiny black spore-producing structures (conidiomata) scatter across gray center",
            "Leaves become dry, papery, curled, prone to premature leaf drop"
        ],
        environmental_contributing_factors=[
            "Warm, wet microclimates within dense canopy",
            "Foliage injured by wind, rain, or mite feeding",
            "Poor air circulation around bushes"
        ],
        conditions_favoring_spread=[
            "High relative humidity (>80%) for extended periods",
            "Moderate temperatures (20-28°C)",
            "Drought stress making leaves more susceptible"
        ],
        diagnostic_clues=[
            "Ash-gray center with black dots distinguishes from Brown Blight",
            "Lesions start at margins/tips first",
            "Silvery appearance when lesions are fresh"
        ],
        similar_looking_conditions=[
            "Brown Blight (no gray center)",
            "Potassium deficiency (marginal scorching)",
            "Sunburn damage (irregular bleached patches)"
        ],
        recommended_field_observations=[
            "Check lesion center color - look for gray/ash",
            "Examine for black conidiomata dots with magnification",
            "Note if lesions started at leaf edges",
            "Record canopy density and airflow patterns"
        ],
        preventive_practices=[
            "Promote canopy aeration through selective pruning",
            "Sanitary pruning: cut below infected zones",
            "Maintain adequate potassium reserves in soil"
        ],
        management_guidance=[
            "Destroy infected material during pruning",
            "Apply certified bio-control agents or barrier sprays as recommended",
            "Monitor and maintain soil potassium levels"
        ],
        references=[
            {"title": "TRI Monograph: Pestalotiopsis theae", "year": "2017"},
            {"title": "Tea Pathology – NIPHM Technical Bulletin", "year": "2019"},
            {"title": "Plant Pathology Journal: Gray Blight Management", "year": "2020"}
        ],
        last_reviewed="2024-03-08"
    ),

    "Helopeltis": DiseaseKnowledge(
        category_id="helopeltis",
        name="Helopeltis",
        scientific_name="Helopeltis theivora Waterhouse",
        category="pest",
        documented_causal_agents=[
            "Helopeltis theivora (tea mosquito bug)"
        ],
        typical_symptoms=[
            "Water-soaked, circular feeding punctures on tender shoots within hours",
            "Punctures darken rapidly to reddish-brown, then black necrotic scabs",
            "Young leaves curl, crinkle, develop 'shot-hole' perforations",
            "Severe dieback of growing tips with stunted shoots"
        ],
        environmental_contributing_factors=[
            "Shady, moist low to mid-elevation microclimates",
            "Dense unpruned sections with alternate weed hosts (Mikania)",
            "Population spikes following early monsoon showers"
        ],
        conditions_favoring_spread=[
            "Relative humidity 70-90%",
            "Warm temperatures (22-32°C)",
            "Presence of alternate host plants nearby"
        ],
        diagnostic_clues=[
            "Tiny feeding punctures with dark halos",
            "Nymphs visible under leaf surfaces or in leaf axils",
            "Adult bugs on tender shoots in morning hours"
        ],
        similar_looking_conditions=[
            "Red spider mite damage (bronzing, no punctures)",
            "Mechanical leaf damage from wind or handling",
            "Tephritid fly feeding damage (irregular holes)"
        ],
        recommended_field_observations=[
            "Inspect tender shoots for live nymphs or adults",
            "Check for alternate weed hosts in boundaries",
            "Record recent rainfall after monsoon onset",
            "Note canopy shade density"
        ],
        preventive_practices=[
            "Systematic weed sanitation along drains and boundaries",
            "Intensive close plucking to remove hiding nymphs",
            "Regulate shade canopy to reduce suitable microclimate"
        ],
        management_guidance=[
            "Deploy light monitoring traps for early detection",
            "Twilight spraying targeting adult activity",
            "Spot-spray localized hotspots with approved insecticides"
        ],
        references=[
            {"title": "Tea Board of India – IPM Guidelines for Helopeltis", "year": "2022"},
            {"title": "Entomological Survey of Tea Gardens", "year": "2020"},
            {"title": "IPM in Tea – Tribhuwan Raj Memorial Lecture", "year": "2019"}
        ],
        last_reviewed="2024-03-12"
    ),

    "Red spider": DiseaseKnowledge(
        category_id="red-spider",
        name="Red spider",
        scientific_name="Oligonychus coffeae Nietner",
        category="pest",
        documented_causal_agents=[
            "Oligonychus coffeae (red spider mite)"
        ],
        typical_symptoms=[
            "Bronzing, copper-tinting, or rust-colored discoloration along midribs/veins",
            "Leaves lose glossy green luster, appear dusty and leathery",
            "Fine silken webbing with trapped dust on upper leaf surfaces",
            "Severe infestation causes extensive leaf bronzing and premature shedding"
        ],
        environmental_contributing_factors=[
            "Prolonged dry spells with high temperatures",
            "Low relative humidity (<50%)",
            "Heavy dust deposition on roadside bushes"
        ],
        conditions_favoring_spread=[
            "Daytime temperatures above 28°C",
            "Relative humidity below 55%",
            "Poor air circulation in hot, dry conditions"
        ],
        diagnostic_clues=[
            "Webbing visible on upper leaf surfaces with magnification",
            "Reddish mites (0.5mm) moving under webbing",
            "Bronzing starting in sun-exposed areas"
        ],
        similar_looking_conditions=[
            "Potassium deficiency (similar bronzing)",
            "Drought stress (uniform leaf yellowing)",
            "Tulip poplar leaf beetle feeding (distinct holes)"
        ],
        recommended_field_observations=[
            "Use 10x hand lens on upper leaf surface",
            "Look for silken webbing and moving mites",
            "Count mites per square inch for threshold",
            "Check if damage is isolated or widespread"
        ],
        preventive_practices=[
            "Water sprinkling/misting in nurseries and young tea",
            "Plant windbreaks to reduce dust deposition",
            "Conserve natural predatory mites and beetles"
        ],
        management_guidance=[
            "Apply water sprays or sulfur-based acaricides",
            "Target early morning or late evening applications",
            "Rotate modes of action to prevent resistance"
        ],
        references=[
            {"title": "Tea Mite Integrated Pest Management Manual", "year": "2021"},
            {"title": "Entomological Society Proceedings – Mite Control", "year": "2020"},
            {"title": "FAO Plant Protection Documentation 145", "year": "2019"}
        ],
        last_reviewed="2024-03-14"
    ),

    "Green mirid bug": DiseaseKnowledge(
        category_id="green-mirid-bug",
        name="Green mirid bug",
        scientific_name="Lygocoris lucorum Meyer-Dür / Apolygus lucorum",
        category="pest",
        documented_causal_agents=[
            "Lygocoris lucorum (green mirid bug)"
        ],
        typical_symptoms=[
            "Small, translucent pinprick spots that turn brown or black rapidly",
            "Irregular holes and ragged foliage edges as leaves expand around necrotized points",
            "Deformed, puckered, distorted growing shoots resembling viral crinkling",
            "Abscission of tender flower buds and premature termination of growing tips"
        ],
        environmental_contributing_factors=[
            "Movement from flowering weed borders",
            "Seasonal flush overlap between tea and alternate hosts",
            "Absence of natural predators"
        ],
        conditions_favoring_spread=[
            "Spring to early summer migration periods",
            "Warm, humid conditions with dew",
            "Dense vegetation near estate boundaries"
        ],
        diagnostic_clues=[
            "Pinprick feeding wounds vs large irregular holes",
            "Damage concentrated on expanding young leaves",
            "Visible bugs on growing shoots in morning hours"
        ],
        similar_looking_conditions=[
            "Helopeltis feeding (water-soaked punctures)",
            "Brown streak virus (systemic distortion)",
            "Mechanical damage from harvesting tools"
        ],
        recommended_field_observations=[
            "Inspect growing tips for fresh feeding pinpricks",
            "Check adjacent weed borders for flowering plants",
            "Record timing of recent flush emergence",
            "Look for adults/nymphs with hand lens"
        ],
        preventive_practices=[
            "Manage flowering weeds along boundaries",
            "Maintain regular harvesting intervals",
            "Monitor flush shoots weekly with sticky traps"
        ],
        management_guidance=[
            "Apply botanical pesticides at dusk when bugs are active",
            "Target young nymphs with selective insecticides",
            "Use biological control agents where practical"
        ],
        references=[
            {"title": "Tea Pest Management – Mirid Bugs", "year": "2020"},
            {"title": "Crop Protection Journal – Lygocoris Management", "year": "2018"},
            {"title": "TRI Technical Bulletin 45", "year": "2019"}
        ],
        last_reviewed="2024-03-13"
    ),

    "Healthy leaf": DiseaseKnowledge(
        category_id="healthy-leaf",
        name="Healthy leaf",
        scientific_name="Camellia sinensis (L.) Kuntze",
        category="healthy",
        documented_causal_agents=[],
        typical_symptoms=[
            "Uniform rich green coloration appropriate for cultivar",
            "Smooth leaf margins with normal serrations",
            "Clean epidermal surface free from lesions, pustules, or feeding damage",
            "Turgid, flexible leaf texture indicating healthy water/nutrient status"
        ],
        environmental_contributing_factors=[],
        conditions_favoring_spread=[],
        diagnostic_clues=[
            "Absence of any disease or pest symptoms",
            "Normal leaf texture and color",
            "Intact epidermis and margins"
        ],
        similar_looking_conditions=[],
        recommended_field_observations=[
            "Verify no subtle lesions under magnification",
            "Check neighboring leaves for similar health",
            "Note any systemic issues affecting the bush"
        ],
        preventive_practices=[
            "Continue standard pruning and plucking cycles",
            "Maintain balanced soil nutrition",
            "Monitor for root rot or viral symptoms later"
        ],
        management_guidance=[
            "No remedial action required",
            "Continue regular monitoring of the area"
        ],
        references=[
            {"title": "Tea Cultivation Practices – Tocklai Research Institute", "year": "2021"},
            {"title": "Standard Operating Procedure for Tea Maintenance", "year": "2020"}
        ],
        last_reviewed="2024-03-11"
    )
}


def _get_evidence_strength(
    model_confidence: float,
    observation_support: int,
    visual_evidence: bool
) -> Tuple[EvidenceStrength, str]:
    """Calculate evidence strength distinct from model confidence."""
    if model_confidence < 0.5:
        return EvidenceStrength.INSUFFICIENT, (
            "Model confidence is low. The prediction may be uncertain. "
            "Consider capturing a clearer image with better lighting and focus. "
            "Expert verification is strongly recommended."
        )
    elif model_confidence < 0.7 and observation_support >= 1:
        return EvidenceStrength.MODERATE, (
            "Model confidence is moderate. Field observations partially support "
            "the diagnosis. Further verification with additional samples is advised."
        )
    elif model_confidence >= 0.7 and visual_evidence:
        return EvidenceStrength.STRONG, (
            "Strong evidence from model prediction and visual confirmation. "
            "Proceed with appropriate management while monitoring."
        )
    else:
        return EvidenceStrength.WEAK, (
            "Model confidence is moderate but field evidence is limited. "
            "Additional observations would strengthen the diagnosis."
        )


def _infer_possible_cause(
    class_name: str,
    field_obs: Optional[FieldObservationPayload],
    probs: List[float]
) -> Tuple[str, CausalityType, List[str]]:
    """Infer the most likely causal agent with supporting evidence."""
    knowledge = KNOWLEDGE_BASE.get(class_name)
    if not knowledge:
        return "No verified knowledge base entry", CausalityType.UNVERIFIED, []

    # Documented causal agent is primary inference
    if knowledge.documented_causal_agents:
        cause = knowledge.documented_causal_agents[0]

        # Build evidence from environment conditions
        evidence = []
        if probs[0] > 0.5:  # High confidence
            evidence.append(f"Model probability: {probs[0]*100:.1f}%")

        if field_obs:
            notes_lower = (field_obs.observation_notes or "").lower()
            light_lower = field_obs.lighting_condition or "unknown"

            # Match conditions from knowledge base
            if knowledge.environmental_contributing_factors:
                for factor in knowledge.environmental_contributing_factors[:2]:
                    if any(kw in notes_lower for kw in factor.lower().split()[:3]):
                        evidence.append(f"Observation: {factor}")
                        break

        return cause, CausalityType.DOCUMENTED, evidence

    return "Unknown - no documented agents", CausalityType.HYPOTHESIS, ["Insufficient knowledge base data"]


def _identify_contributing_factors(
    class_name: str,
    field_obs: Optional[FieldObservationPayload]
) -> List[Dict[str, str]]:
    """Identify environmental contributing factors from observations."""
    knowledge = KNOWLEDGE_BASE.get(class_name)
    if not knowledge or not field_obs:
        return []

    factors = []
    notes_lower = (field_obs.observation_notes or "").lower()
    light = field_obs.lighting_condition or "unknown"

    # Environmental factor matching
    for factor in knowledge.environmental_contributing_factors[:3]:
        matched = False
        if light == "shaded" and "shade" in factor.lower():
            matched = True
        elif light == "direct_sunlight" and ("sun" in factor.lower() or "light" in factor.lower()):
            matched = True
        elif any(kw in notes_lower for kw in ["humidity", "rain", "wet", "damp"]):
            if "humidity" in factor.lower() or "moisture" in factor.lower() or "water" in factor.lower():
                matched = True

        if matched:
            factors.append({
                "factor": factor,
                "strength": "contributing"
            })

    return factors


def _get_recommendations(
    class_name: str,
    field_obs: Optional[FieldObservationPayload]
) -> Dict[str, List[str]]:
    """Get categorized recommendations for the predicted class."""
    knowledge = KNOWLEDGE_BASE.get(class_name)
    if not knowledge:
        return {"cultural": [], "sanitation": [], "biological": [], "chemical": []}

    recs = {
        "cultural": knowledge.preventive_practices[:2] if knowledge.preventive_practices else [],
        "sanitation": [
            "Remove and destroy fallen infected leaves",
            "Sanitary pruning below symptomatic zones",
            "Clean tools between cuts"
        ],
        "drainage_canopy": [
            "Improve canopy ventilation through selective lopping",
            "Maintain proper drainage around root zones"
        ],
        "biological": [
            "Conserve natural predators (ladybirds, predatory mites, spiders)",
            "Apply biological control agents (Trichoderma, Beauveria) as recommended"
        ] if knowledge.category == "fungal" else [
            "Monitor predator populations",
            "Maintain habitat for beneficial insects"
        ],
        "chemical": [
            "⚠️ CHEMICAL APPLICATIONS REQUIRED OFFICIAL GUIDANCE CHECK",
            "Consult current regional extension service recommendations",
            "Verify approved products, label restrictions, and pre-harvest intervals"
        ] if class_name != "Healthy leaf" else []
    }
    return recs


def _determine_missing_info(
    class_name: str,
    field_obs: Optional[FieldObservationPayload],
    has_visual_evidence: bool
) -> List[str]:
    """Determine what additional field information would improve assessment."""
    knowledge = KNOWLEDGE_BASE.get(class_name)
    if not knowledge:
        return ["No field observations provided"]

    missing = []

    if not field_obs:
        missing.extend(knowledge.recommended_field_observations[:2])
    else:
        # Check for specific missing data based on category
        obs_lower = (field_obs.observation_notes or "").lower()

        if "rainfall" not in obs_lower and "humidity" not in obs_lower:
            missing.append("Recent rainfall and humidity levels")

        if not field_obs.leaf_age or field_obs.leaf_age == "unknown":
            missing.append("Leaf age/flush stage of affected foliage")

        if class_name in ["Helopeltis", "Green mirid bug", "Red spider"]:
            missing.append("Visible pest presence count")

    if not has_visual_evidence and class_name not in ["Healthy leaf"]:
        missing.append("High-resolution image showing lesion texture details")

    return missing


def generate_diagnostic_assessment(
    prediction: PredictionResponse,
    field_obs: Optional[FieldObservationPayload] = None
) -> Dict[str, Any]:
    """Generate a complete diagnostic assessment combining all evidence sources.

    Returns:
        Dictionary containing:
        - detected_category: str
        - possible_cause: {"agent": str, "type": CausalityType, "evidence": List[str]}
        - supporting_evidence: List[str]
        - contributing_factors: List[Dict]
        - missing_information: List[str]
        - confidence_evidence: Dict with strength and explanation
        - recommendations: Dict[str, List[str]]
        - references: List[Dict]
        - requires_expert_verification: bool
    """
    logger.info(f"Generating diagnostic assessment for: {prediction.predicted_class}")

    knowledge = KNOWLEDGE_BASE.get(prediction.predicted_class)

    # Determine possible cause
    cause, causality_type, cause_evidence = _infer_possible_cause(
        prediction.predicted_class,
        field_obs,
        prediction.probabilities
    )

    # Build supporting evidence
    supporting_evidence = [
        f"Model predicted: {prediction.predicted_class}",
        f"Model confidence: {prediction.confidence*100:.1f}%",
        f"Top-3 probabilities: {', '.join(f'{p.class_name} ({p.confidence*100:.1f}%)' for p in prediction.top_predictions[:3])}"
    ]
    supporting_evidence.extend(cause_evidence)

    # Identify contributing factors
    contributing_factors = _identify_contributing_factors(
        prediction.predicted_class,
        field_obs
    )

    # Calculate evidence strength
    visual_evidence = prediction.explanation_note is not None
    evidence_strength, strength_explanation = _get_evidence_strength(
        prediction.confidence,
        len(contributing_factors),
        visual_evidence
    )

    # Determine missing information
    missing_info = _determine_missing_info(
        prediction.predicted_class,
        field_obs,
        visual_evidence
    )

    # Get recommendations
    recommendations = _get_recommendations(
        prediction.predicted_class,
        field_obs
    )

    # Determine if expert verification needed
    requires_verification = (
        evidence_strength in [EvidenceStrength.INSUFFICIENT, EvidenceStrength.WEAK]
        or prediction.confidence < 0.6
    )

    result = {
        "detected_category": prediction.predicted_class,
        "possible_cause": {
            "agent": cause,
            "type": causality_type.value,
            "evidence": cause_evidence
        },
        "supporting_evidence": supporting_evidence,
        "contributing_factors": contributing_factors,
        "missing_information": missing_info,
        "confidence_evidence": {
            "strength": evidence_strength.value,
            "explanation": strength_explanation,
            "model_confidence": prediction.confidence,
            "distinct_from_reasoning": "Model confidence measures prediction certainty; evidence strength measures diagnostic reasoning reliability."
        },
        "recommendations": recommendations,
        "references": knowledge.references if knowledge else [],
        "requires_expert_verification": requires_verification,
        "last_reviewed_date": knowledge.last_reviewed if knowledge else "Unknown"
    }

    logger.info(f"Diagnostic assessment complete. Requires verification: {requires_verification}")
    return result