import axios from 'axios';
import { log } from '../vite';

const BIBLE_API_KEY = process.env.BIBLE_API_KEY || '';
const ESV_API_URL = 'https://api.esv.org/v3/passage/text/';
const BIBLE_API_URL = 'https://api.scripture.api.bible/v1';

// Default Bible ID for ESV translation
const ESV_BIBLE_ID = '06125adad2d5898a-01';

/**
 * Get a random verse from a curated list of inspirational Bible verses
 */
export async function getRandomInspirationalVerse(): Promise<{ reference: string; text: string }> {
  // List of inspirational Bible verses
  const inspirationalVerses = [
    'John 3:16', 'Philippians 4:13', 'Jeremiah 29:11', 'Romans 8:28', 
    'Psalm 23:1', 'Proverbs 3:5-6', 'Isaiah 41:10', 'Matthew 11:28',
    'Joshua 1:9', '2 Corinthians 5:17', 'Romans 12:2', 'Philippians 4:6-7',
    'Psalm 46:1', 'John 14:27', 'Romans 5:8', '1 Corinthians 13:4-7',
    'Matthew 28:19-20', 'Psalm 27:1', 'Hebrews 11:1', '1 Peter 5:7'
  ];
  
  // Pick a random verse from the list
  const randomIndex = Math.floor(Math.random() * inspirationalVerses.length);
  const reference = inspirationalVerses[randomIndex];
  
  try {
    // Fetch the verse text using the ESV API
    const verseText = await getVerseFromESV(reference);
    return { reference, text: verseText };
  } catch (error) {
    log(`Error fetching random verse: ${error.message}`);
    // Fallback verses in case the API is not available
    const fallbackVerses: Record<string, string> = {
      'John 3:16': 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
      'Philippians 4:13': 'I can do all things through him who strengthens me.',
      'Jeremiah 29:11': 'For I know the plans I have for you, declares the LORD, plans for welfare and not for evil, to give you a future and a hope.',
      'Isaiah 41:10': 'Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.'
    };
    
    return { 
      reference, 
      text: fallbackVerses[reference] || 'Scripture verse temporarily unavailable. Please check back later.'
    };
  }
}

/**
 * Get verse of the day (either from API or curated list)
 */
export async function getVerseOfTheDay(): Promise<{ reference: string; text: string }> {
  // If we have a Bible API key, we could use a specific verse-of-the-day API
  // For now, use the random inspirational verse function
  return getRandomInspirationalVerse();
}

/**
 * Get verse text from ESV API
 */
async function getVerseFromESV(reference: string): Promise<string> {
  // Only attempt to call the API if we have an API key
  if (!BIBLE_API_KEY) {
    throw new Error('Bible API key not configured');
  }

  try {
    const response = await axios.get(ESV_API_URL, {
      params: {
        q: reference,
        'include-headings': false,
        'include-footnotes': false,
        'include-verse-numbers': false,
        'include-short-copyright': false,
        'include-passage-references': false
      },
      headers: {
        'Authorization': `Token ${BIBLE_API_KEY}`
      }
    });
    
    if (response.data && response.data.passages && response.data.passages.length > 0) {
      return response.data.passages[0].trim();
    } else {
      throw new Error('No passage found for the given reference');
    }
  } catch (error) {
    log(`Error fetching verse from ESV API: ${error.message}`);
    throw error;
  }
}

/**
 * Get a devotional for the current day
 * This is a simplified implementation - in a real-world scenario, 
 * you might want to integrate with a devotional content provider or database
 */
export async function getDailyDevotional(): Promise<{ title: string; verse: { reference: string; text: string }; content: string }> {
  try {
    // Get a verse for the devotional
    const verse = await getVerseOfTheDay();
    
    // Generate a title based on the verse reference
    const title = `Daily Reflection: ${verse.reference}`;
    
    // For a real implementation, you would fetch actual devotional content
    // For now, we'll use a placeholder
    const content = "Today, take a moment to reflect on God's word and how it applies to your life. " +
      "Allow the Holy Spirit to speak to your heart and guide your steps throughout this day. " +
      "Remember that you are loved, valued, and empowered by the Creator of the universe.";
    
    return { title, verse, content };
  } catch (error) {
    log(`Error generating daily devotional: ${error.message}`);
    
    // Fallback devotional
    return {
      title: "Daily Reflection",
      verse: {
        reference: "Psalm 118:24",
        text: "This is the day that the LORD has made; let us rejoice and be glad in it."
      },
      content: "Today is a gift from God. Whatever challenges or blessings come your way, " +
        "remember that the Lord is with you and that this day is an opportunity to serve Him and others."
    };
  }
}

/**
 * Get verses related to a specific topic
 */
export async function getVersesOnTopic(topic: string, count: number = 3): Promise<Array<{ reference: string; text: string }>> {
  // Topic-based verses mapping (simplified for prototype)
  const topicVerses: Record<string, string[]> = {
    'faith': ['Hebrews 11:1', 'James 2:17', 'Romans 10:17', 'Mark 11:22-24', '2 Corinthians 5:7'],
    'hope': ['Romans 15:13', 'Jeremiah 29:11', 'Romans 5:3-5', 'Hebrews 6:19', 'Psalm 39:7'],
    'love': ['1 Corinthians 13:4-7', 'John 3:16', '1 John 4:19', 'Romans 5:8', 'John 15:13'],
    'peace': ['John 14:27', 'Philippians 4:6-7', 'Isaiah 26:3', 'Colossians 3:15', 'Psalm 29:11'],
    'joy': ['James 1:2-3', 'Philippians 4:4', 'Psalm 16:11', 'Romans 15:13', 'Galatians 5:22-23'],
    'strength': ['Philippians 4:13', 'Isaiah 40:31', 'Joshua 1:9', 'Psalm 46:1-3', 'Ephesians 6:10'],
    'comfort': ['2 Corinthians 1:3-4', 'Psalm 23', 'Matthew 5:4', 'John 14:16-18', 'Psalm 119:50'],
    'wisdom': ['James 1:5', 'Proverbs 1:7', 'Colossians 3:16', 'Proverbs 9:10', 'Ecclesiastes 7:12']
  };
  
  // Default to 'faith' if the topic doesn't exist in our mapping
  const searchTopic = topic.toLowerCase();
  const matchedTopic = Object.keys(topicVerses).find(t => t === searchTopic) || 'faith';
  
  // Get verses for the topic
  const references = topicVerses[matchedTopic].slice(0, count);
  
  // Fetch each verse
  const verses = [];
  for (const reference of references) {
    try {
      const text = await getVerseFromESV(reference);
      verses.push({ reference, text });
    } catch (error) {
      log(`Error fetching verse for topic: ${error.message}`);
      // Continue with other verses
    }
  }
  
  // If we couldn't fetch any verses, provide a fallback
  if (verses.length === 0) {
    verses.push({
      reference: 'Proverbs 3:5-6',
      text: 'Trust in the LORD with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.'
    });
  }
  
  return verses;
}

export default {
  getRandomInspirationalVerse,
  getVerseOfTheDay,
  getDailyDevotional,
  getVersesOnTopic
};