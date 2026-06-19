// Character-level vocabulary — physical, wardrobe, voice, archetype.
// Used by the character-inspector chip selectors and the prompt builder.

import type { VocabularyOption } from "./vocabulary";

export type HairColor = "black" | "brown" | "blond" | "auburn" | "red" | "grey" | "white" | "dyed";
export const HAIR_COLORS: VocabularyOption<HairColor>[] = [
  { value: "black", label: "Black", prompt: "black hair" },
  { value: "brown", label: "Brown", prompt: "brown hair" },
  { value: "blond", label: "Blond", prompt: "blond hair" },
  { value: "auburn", label: "Auburn", prompt: "auburn hair" },
  { value: "red", label: "Red", prompt: "red hair" },
  { value: "grey", label: "Grey", prompt: "grey hair" },
  { value: "white", label: "White", prompt: "white hair" },
  { value: "dyed", label: "Dyed bright", prompt: "vivid dyed hair, unnatural color" }
];

export type HairStyle =
  | "short"
  | "buzz"
  | "shoulder"
  | "long"
  | "curly"
  | "wavy"
  | "braided"
  | "bun"
  | "ponytail"
  | "shaved"
  | "messy";
export const HAIR_STYLES: VocabularyOption<HairStyle>[] = [
  { value: "short", label: "Short", prompt: "short hair" },
  { value: "buzz", label: "Buzz cut", prompt: "buzz cut" },
  { value: "shoulder", label: "Shoulder length", prompt: "shoulder-length hair" },
  { value: "long", label: "Long", prompt: "long hair" },
  { value: "curly", label: "Curly", prompt: "curly hair" },
  { value: "wavy", label: "Wavy", prompt: "wavy hair" },
  { value: "braided", label: "Braided", prompt: "braided hair" },
  { value: "bun", label: "Bun", prompt: "hair tied up in a bun" },
  { value: "ponytail", label: "Ponytail", prompt: "ponytail" },
  { value: "shaved", label: "Shaved", prompt: "shaved head" },
  { value: "messy", label: "Tousled", prompt: "tousled, lived-in hair" }
];

export type EyeColor = "brown" | "hazel" | "amber" | "green" | "blue" | "grey" | "violet";
export const EYE_COLORS: VocabularyOption<EyeColor>[] = [
  { value: "brown", label: "Brown", prompt: "warm brown eyes" },
  { value: "hazel", label: "Hazel", prompt: "hazel eyes" },
  { value: "amber", label: "Amber", prompt: "amber eyes" },
  { value: "green", label: "Green", prompt: "green eyes" },
  { value: "blue", label: "Blue", prompt: "blue eyes" },
  { value: "grey", label: "Grey", prompt: "grey eyes" },
  { value: "violet", label: "Violet", prompt: "rare violet eyes" }
];

export type AgeBracket = "child" | "teen" | "young_adult" | "thirties" | "forties" | "fifties" | "sixties" | "elder";
export const AGES: VocabularyOption<AgeBracket>[] = [
  { value: "child", label: "Child", prompt: "child, around 8-12 years old" },
  { value: "teen", label: "Teen", prompt: "teenager, around 14-18" },
  { value: "young_adult", label: "Young adult", prompt: "young adult, early twenties" },
  { value: "thirties", label: "Thirties", prompt: "in their thirties" },
  { value: "forties", label: "Forties", prompt: "in their forties" },
  { value: "fifties", label: "Fifties", prompt: "in their fifties" },
  { value: "sixties", label: "Sixties", prompt: "in their sixties" },
  { value: "elder", label: "Elder", prompt: "elderly, seventy or older" }
];

export type Build = "slight" | "lean" | "athletic" | "average" | "stocky" | "muscular" | "heavy";
export const BUILDS: VocabularyOption<Build>[] = [
  { value: "slight", label: "Slight", prompt: "slight, slender build" },
  { value: "lean", label: "Lean", prompt: "lean build" },
  { value: "athletic", label: "Athletic", prompt: "athletic build" },
  { value: "average", label: "Average", prompt: "average build" },
  { value: "stocky", label: "Stocky", prompt: "stocky, compact build" },
  { value: "muscular", label: "Muscular", prompt: "muscular, broad-shouldered build" },
  { value: "heavy", label: "Heavy", prompt: "heavyset build" }
];

export type WardrobeStyle =
  | "casual"
  | "formal"
  | "business"
  | "streetwear"
  | "vintage"
  | "punk"
  | "goth"
  | "bohemian"
  | "military"
  | "scifi"
  | "fantasy"
  | "period"
  | "athleisure"
  | "minimalist"
  | "rags"
  | "uniform";
export const WARDROBES: VocabularyOption<WardrobeStyle>[] = [
  { value: "casual", label: "Casual", prompt: "casual everyday clothing" },
  { value: "formal", label: "Formal", prompt: "formal attire, tailored" },
  { value: "business", label: "Business", prompt: "business attire, suit" },
  { value: "streetwear", label: "Streetwear", prompt: "streetwear, urban modern" },
  { value: "vintage", label: "Vintage", prompt: "vintage clothing, mid-century aesthetic" },
  { value: "punk", label: "Punk", prompt: "punk styling, leather, studs, attitude" },
  { value: "goth", label: "Goth", prompt: "gothic styling, dark fabrics, lace" },
  { value: "bohemian", label: "Bohemian", prompt: "bohemian, flowing fabrics, layered" },
  { value: "military", label: "Military", prompt: "military or tactical gear" },
  { value: "scifi", label: "Sci-fi", prompt: "futuristic sci-fi wardrobe, technical fabrics" },
  { value: "fantasy", label: "Fantasy", prompt: "fantasy attire, robes or armor" },
  { value: "period", label: "Period", prompt: "period costume, historically anchored" },
  { value: "athleisure", label: "Athleisure", prompt: "athleisure, modern sportswear" },
  { value: "minimalist", label: "Minimalist", prompt: "minimalist clothing, neutral palette" },
  { value: "rags", label: "Rags", prompt: "worn, patched, ragged clothing" },
  { value: "uniform", label: "Uniform", prompt: "occupational uniform" }
];

export type VoiceQuality =
  | "warm"
  | "raspy"
  | "smooth"
  | "gravelly"
  | "soft"
  | "commanding"
  | "nasal"
  | "breathy"
  | "high"
  | "low"
  | "monotone"
  | "lyrical";
export const VOICE_QUALITIES: VocabularyOption<VoiceQuality>[] = [
  { value: "warm", label: "Warm", prompt: "warm vocal timbre" },
  { value: "raspy", label: "Raspy", prompt: "raspy voice" },
  { value: "smooth", label: "Smooth", prompt: "smooth, polished voice" },
  { value: "gravelly", label: "Gravelly", prompt: "gravelly voice" },
  { value: "soft", label: "Soft", prompt: "soft, hushed voice" },
  { value: "commanding", label: "Commanding", prompt: "commanding, authoritative voice" },
  { value: "nasal", label: "Nasal", prompt: "nasal voice" },
  { value: "breathy", label: "Breathy", prompt: "breathy voice" },
  { value: "high", label: "High pitch", prompt: "high-pitched voice" },
  { value: "low", label: "Low pitch", prompt: "deep, low-pitched voice" },
  { value: "monotone", label: "Monotone", prompt: "monotone delivery" },
  { value: "lyrical", label: "Lyrical", prompt: "lyrical, sing-song cadence" }
];

export type Archetype =
  | "hero"
  | "antihero"
  | "mentor"
  | "trickster"
  | "shadow"
  | "ally"
  | "ingenue"
  | "warrior"
  | "scholar"
  | "outlaw"
  | "ruler"
  | "everyman"
  | "explorer"
  | "lover"
  | "caregiver"
  | "creator";
export const ARCHETYPES: VocabularyOption<Archetype>[] = [
  { value: "hero", label: "Hero", prompt: "heroic protagonist" },
  { value: "antihero", label: "Anti-hero", prompt: "morally complex anti-hero" },
  { value: "mentor", label: "Mentor", prompt: "wise mentor figure" },
  { value: "trickster", label: "Trickster", prompt: "trickster, mercurial" },
  { value: "shadow", label: "Shadow", prompt: "shadow antagonist" },
  { value: "ally", label: "Ally", prompt: "loyal ally" },
  { value: "ingenue", label: "Ingenue", prompt: "ingenue, innocent and untested" },
  { value: "warrior", label: "Warrior", prompt: "warrior, physically capable" },
  { value: "scholar", label: "Scholar", prompt: "scholar, cerebral" },
  { value: "outlaw", label: "Outlaw", prompt: "outlaw, lives by their own rules" },
  { value: "ruler", label: "Ruler", prompt: "ruler, command of others" },
  { value: "everyman", label: "Everyman", prompt: "everyman, ordinary person in extraordinary circumstance" },
  { value: "explorer", label: "Explorer", prompt: "explorer, seeker of the new" },
  { value: "lover", label: "Lover", prompt: "lover, emotionally driven" },
  { value: "caregiver", label: "Caregiver", prompt: "caregiver, nurtures others" },
  { value: "creator", label: "Creator", prompt: "creator, driven by making" }
];

// Skin tone — kept generic and respectful; the model expands within these brackets.
export type SkinTone = "very_fair" | "fair" | "olive" | "medium" | "tan" | "brown" | "deep" | "ebony";
export const SKIN_TONES: VocabularyOption<SkinTone>[] = [
  { value: "very_fair", label: "Very fair", prompt: "very fair skin" },
  { value: "fair", label: "Fair", prompt: "fair skin" },
  { value: "olive", label: "Olive", prompt: "olive skin" },
  { value: "medium", label: "Medium", prompt: "medium skin tone" },
  { value: "tan", label: "Tan", prompt: "tan skin" },
  { value: "brown", label: "Brown", prompt: "brown skin" },
  { value: "deep", label: "Deep", prompt: "deep skin tone" },
  { value: "ebony", label: "Ebony", prompt: "ebony skin" }
];

// Identifying marks — open vocabulary suggestions
export const IDENTIFYING_MARKS: string[] = [
  "scar across the cheek",
  "small mole near the lip",
  "freckles across the nose",
  "tattoo on the forearm",
  "tattoo on the neck",
  "pierced ears",
  "septum piercing",
  "wire-frame glasses",
  "round glasses",
  "eye patch",
  "missing front tooth",
  "gold tooth",
  "burn scar on the hand",
  "birthmark on the temple",
  "fresh black eye"
];

// Wardrobe accent — small details that read fast in a frame
export const WARDROBE_ACCENTS: string[] = [
  "battered leather jacket",
  "long black coat",
  "white linen shirt",
  "denim jacket",
  "knit beanie",
  "fedora",
  "round wire glasses",
  "silver chain necklace",
  "signet ring",
  "fingerless gloves",
  "scuffed combat boots",
  "white sneakers",
  "satchel bag",
  "pocket watch on a chain",
  "patterned scarf"
];
