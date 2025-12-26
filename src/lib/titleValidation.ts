// Common descriptive nouns for photography titles
const DESCRIPTIVE_NOUNS = new Set([
  // Nature
  'sunset', 'sunrise', 'mountain', 'beach', 'ocean', 'sea', 'lake', 'river', 'forest', 'tree',
  'flower', 'garden', 'sky', 'cloud', 'rain', 'snow', 'storm', 'lightning', 'rainbow', 'moon',
  'star', 'sun', 'landscape', 'field', 'meadow', 'valley', 'hill', 'waterfall', 'desert', 'island',
  'coast', 'cliff', 'cave', 'wave', 'fog', 'mist', 'aurora', 'horizon', 'nature', 'wildlife',
  
  // Urban
  'street', 'city', 'building', 'bridge', 'tower', 'skyline', 'alley', 'road', 'highway', 'path',
  'market', 'cafe', 'restaurant', 'shop', 'store', 'station', 'train', 'metro', 'bus', 'car',
  'architecture', 'window', 'door', 'wall', 'graffiti', 'neon', 'light', 'shadow', 'reflection',
  'urban', 'downtown', 'neighborhood', 'plaza', 'square', 'park', 'fountain', 'statue', 'monument',
  
  // People
  'portrait', 'face', 'smile', 'eyes', 'hands', 'silhouette', 'dancer', 'musician', 'artist',
  'child', 'family', 'couple', 'crowd', 'people', 'street-photography', 'candid', 'emotion',
  'expression', 'gesture', 'pose', 'movement', 'action', 'sport', 'athlete', 'performance',
  
  // Events
  'festival', 'celebration', 'wedding', 'party', 'concert', 'parade', 'ceremony', 'ritual',
  'tradition', 'culture', 'dance', 'music', 'art', 'event', 'gathering', 'market', 'fair',
  
  // Objects
  'flower', 'plant', 'animal', 'bird', 'dog', 'cat', 'horse', 'butterfly', 'insect', 'fish',
  'food', 'drink', 'coffee', 'tea', 'fruit', 'vegetable', 'meal', 'dish', 'cuisine',
  'texture', 'pattern', 'color', 'detail', 'macro', 'abstract', 'minimal', 'still-life',
  
  // Time/Mood
  'morning', 'evening', 'night', 'dawn', 'dusk', 'twilight', 'golden-hour', 'blue-hour',
  'summer', 'winter', 'spring', 'autumn', 'fall', 'season', 'weather', 'moment', 'memory',
  
  // Photography terms
  'photo', 'photograph', 'shot', 'capture', 'frame', 'scene', 'view', 'perspective', 'angle',
  'composition', 'exposure', 'bokeh', 'blur', 'focus', 'depth', 'contrast', 'light', 'shadow'
]);

// Common stop words to exclude from word count
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'it', 'its', 'my', 'your', 'our', 'their', 'this', 'that', 'these', 'those',
  'i', 'me', 'you', 'he', 'she', 'we', 'they', 'him', 'her', 'us', 'them'
]);

export interface TitleValidationResult {
  isValid: boolean;
  meaningfulWordCount: number;
  hasDescriptiveNoun: boolean;
  foundNouns: string[];
  errors: string[];
  qualityScore: 'low' | 'medium' | 'high';
}

/**
 * Validates a photo title according to SEO and quality guidelines
 * - Minimum 5 meaningful words (excluding stop words)
 * - At least 1 descriptive noun
 */
export function validateTitle(title: string): TitleValidationResult {
  const errors: string[] = [];
  const foundNouns: string[] = [];
  
  // Normalize and split title into words
  const normalizedTitle = title.toLowerCase().trim();
  const words = normalizedTitle.split(/[\s\-_.,!?:;'"]+/).filter(w => w.length > 0);
  
  // Count meaningful words (excluding stop words)
  const meaningfulWords = words.filter(word => !STOP_WORDS.has(word) && word.length > 1);
  const meaningfulWordCount = meaningfulWords.length;
  
  // Check for descriptive nouns
  for (const word of meaningfulWords) {
    if (DESCRIPTIVE_NOUNS.has(word)) {
      foundNouns.push(word);
    }
    // Also check partial matches for compound words
    for (const noun of DESCRIPTIVE_NOUNS) {
      if (word.includes(noun) && !foundNouns.includes(noun)) {
        foundNouns.push(noun);
      }
    }
  }
  
  const hasDescriptiveNoun = foundNouns.length > 0;
  
  // Validation rules
  if (meaningfulWordCount < 3) {
    errors.push(`Title needs at least 3 meaningful words (currently ${meaningfulWordCount})`);
  }
  
  if (!hasDescriptiveNoun) {
    errors.push('Title should include at least 1 descriptive noun (e.g., street, portrait, sunset, festival)');
  }
  
  // Calculate quality score
  let qualityScore: 'low' | 'medium' | 'high' = 'low';
  if (meaningfulWordCount >= 3 && hasDescriptiveNoun) {
    qualityScore = meaningfulWordCount >= 5 && foundNouns.length >= 2 ? 'high' : 'medium';
  } else if (meaningfulWordCount >= 2 || hasDescriptiveNoun) {
    qualityScore = 'low';
  }
  
  return {
    isValid: errors.length === 0,
    meaningfulWordCount,
    hasDescriptiveNoun,
    foundNouns,
    errors,
    qualityScore
  };
}

/**
 * Checks if a title barely passes validation (for admin flagging)
 */
export function isTitleBarelyPassing(title: string): boolean {
  const result = validateTitle(title);
  return result.isValid && result.qualityScore === 'medium' && result.foundNouns.length === 1;
}

/**
 * Generate a slug from a title
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
