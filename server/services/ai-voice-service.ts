import { promises as fs } from 'fs';
import path from 'path';
import { log } from '../vite';
import openaiService from './openai-service';
import bibleService from './bible-service';
import rssService from './rss-service';
import { db } from '../db.mysql';
import { shows, streams, schedules } from '@shared/schema.mysql';
import { eq } from 'drizzle-orm';

// Voice options for OpenAI
export type VoiceOption = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

// Types of announcements the AI can generate
export type AnnouncementType = 
  | 'show-intro' 
  | 'show-outro' 
  | 'verse' 
  | 'news' 
  | 'station-id' 
  | 'weather'
  | 'devotional'
  | 'custom';

interface AnnouncementOptions {
  voice?: VoiceOption;
  showId?: number;
  includeVerse?: boolean;
  includeTrending?: boolean;
  customPrompt?: string;
  scheduledTime?: Date;
}

interface AnnouncementResult {
  scriptText: string;
  audioPath: string;
  type: AnnouncementType;
  metadata: {
    voice: VoiceOption;
    duration?: number;
    showId?: number;
    showTitle?: string;
    verseReference?: string;
    createdAt: Date;
  };
}

/**
 * Generate a show introduction announcement
 */
export async function generateShowIntro(
  showId: number, 
  voice: VoiceOption = 'nova',
  includeVerse: boolean = false
): Promise<AnnouncementResult> {
  try {
    // Get show details from the database
    const [show] = await db.select().from(shows).where(eq(shows.id, showId));
    
    if (!show) {
      throw new Error(`Show with ID ${showId} not found`);
    }
    
    let introPrompt = `Create a brief, engaging introduction for the radio show "${show.title}" hosted by ${show.host}. The show is about: ${show.description}. Keep it warm, inviting, and concise (about 20-30 seconds when spoken).`;
    
    // Add a verse if requested
    let verseReference: string | undefined;
    if (includeVerse) {
      const verse = await bibleService.getRandomInspirationalVerse();
      introPrompt += ` Include this Bible verse in your introduction: "${verse.reference}: ${verse.text}"`;
      verseReference = verse.reference;
    }
    
    // Generate the announcement
    const result = await openaiService.generateVoiceAnnouncement(
      introPrompt,
      voice,
      {
        title: show.title,
        host: show.host,
        description: show.description
      },
      'intro'
    );
    
    return {
      scriptText: result.scriptText,
      audioPath: result.audioPath,
      type: 'show-intro',
      metadata: {
        voice,
        showId,
        showTitle: show.title,
        verseReference,
        createdAt: new Date()
      }
    };
  } catch (error) {
    log(`Error generating show intro: ${error.message}`);
    throw error;
  }
}

/**
 * Generate a show outro announcement
 */
export async function generateShowOutro(
  showId: number,
  voice: VoiceOption = 'nova'
): Promise<AnnouncementResult> {
  try {
    // Get show details from the database
    const [show] = await db.select().from(shows).where(eq(shows.id, showId));
    
    if (!show) {
      throw new Error(`Show with ID ${showId} not found`);
    }
    
    // Get next scheduled occurrence of this show
    const now = new Date();
    const [nextSchedule] = await db.select()
      .from(schedules)
      .where(eq(schedules.showId, showId))
      .where((schedule) => schedule.startTime > now);
    
    let outroPrompt = `Create a brief, warm closing for the radio show "${show.title}" hosted by ${show.host}. Thank the audience for listening`;
    
    // If we have schedule info, include when the show will return
    if (nextSchedule) {
      const nextDate = new Date(nextSchedule.startTime);
      const dayOfWeek = nextDate.toLocaleDateString('en-US', { weekday: 'long' });
      const timeOfDay = nextDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      
      outroPrompt += ` and let them know the show will return on ${dayOfWeek} at ${timeOfDay}.`;
    } else {
      outroPrompt += ` and invite them to join again for the next episode.`;
    }
    
    outroPrompt += ` Keep it concise (about 15-20 seconds when spoken).`;
    
    // Generate the announcement
    const result = await openaiService.generateVoiceAnnouncement(
      outroPrompt,
      voice,
      {
        title: show.title,
        host: show.host,
        description: show.description
      },
      'outro'
    );
    
    return {
      scriptText: result.scriptText,
      audioPath: result.audioPath,
      type: 'show-outro',
      metadata: {
        voice,
        showId,
        showTitle: show.title,
        createdAt: new Date()
      }
    };
  } catch (error) {
    log(`Error generating show outro: ${error.message}`);
    throw error;
  }
}

/**
 * Generate a verse announcement
 */
export async function generateVerseAnnouncement(
  voice: VoiceOption = 'nova'
): Promise<AnnouncementResult> {
  try {
    // Get a verse
    const verse = await bibleService.getVerseOfTheDay();
    
    const versePrompt = `Share this Bible verse with the listeners: "${verse.reference}: ${verse.text}". Create a brief, thoughtful introduction to the verse that emphasizes its spiritual meaning and relevance. Keep the entire announcement concise (about 30 seconds when spoken).`;
    
    // Generate the announcement
    const result = await openaiService.generateVoiceAnnouncement(
      versePrompt,
      voice,
      undefined,
      'verse'
    );
    
    return {
      scriptText: result.scriptText,
      audioPath: result.audioPath,
      type: 'verse',
      metadata: {
        voice,
        verseReference: verse.reference,
        createdAt: new Date()
      }
    };
  } catch (error) {
    log(`Error generating verse announcement: ${error.message}`);
    throw error;
  }
}

/**
 * Generate a news announcement based on trending topics
 */
export async function generateNewsAnnouncement(
  voice: VoiceOption = 'nova'
): Promise<AnnouncementResult> {
  try {
    // Get trending topics
    const trendingTopics = await rssService.getTrendingTopics(3);
    
    if (trendingTopics.length === 0) {
      throw new Error('No trending topics found');
    }
    
    // Get news on the first trending topic
    const mainTopic = trendingTopics[0];
    const newsItems = await rssService.getNewsOnTopic(mainTopic, 2);
    
    let newsPrompt = `Create a brief faith-focused news update for Christian radio listeners about "${mainTopic}".`;
    
    if (newsItems.length > 0) {
      newsPrompt += ` Include these headlines: 1) "${newsItems[0].title}"`;
      if (newsItems.length > 1) {
        newsPrompt += ` and 2) "${newsItems[1].title}".`;
      }
    } else {
      newsPrompt += ` Mention how this topic relates to faith and Christian values.`;
    }
    
    newsPrompt += ` Keep the update brief and spiritually relevant (about 30 seconds when spoken).`;
    
    // Generate the announcement
    const result = await openaiService.generateVoiceAnnouncement(
      newsPrompt,
      voice,
      undefined,
      'announcement'
    );
    
    return {
      scriptText: result.scriptText,
      audioPath: result.audioPath,
      type: 'news',
      metadata: {
        voice,
        createdAt: new Date()
      }
    };
  } catch (error) {
    log(`Error generating news announcement: ${error.message}`);
    throw error;
  }
}

/**
 * Generate a station ID announcement
 */
export async function generateStationId(
  voice: VoiceOption = 'nova'
): Promise<AnnouncementResult> {
  try {
    // Get current stream info
    const [activeStream] = await db.select()
      .from(streams)
      .where(eq(streams.isActive, true));
    
    if (!activeStream) {
      throw new Error('No active stream found');
    }
    
    const stationPrompt = `Create a brief station identification for "${activeStream.title}". Keep it very short and professional (about 10-15 seconds when spoken). Mention that we're broadcasting Christian music and inspirational content.`;
    
    // Generate the announcement
    const result = await openaiService.generateVoiceAnnouncement(
      stationPrompt,
      voice,
      undefined,
      'announcement'
    );
    
    return {
      scriptText: result.scriptText,
      audioPath: result.audioPath,
      type: 'station-id',
      metadata: {
        voice,
        createdAt: new Date()
      }
    };
  } catch (error) {
    log(`Error generating station ID: ${error.message}`);
    throw error;
  }
}

/**
 * Generate a devotional announcement
 */
export async function generateDevotional(
  voice: VoiceOption = 'nova'
): Promise<AnnouncementResult> {
  try {
    // Get daily devotional
    const devotional = await bibleService.getDailyDevotional();
    
    const devotionalPrompt = `Share this daily devotional with the listeners. Title: "${devotional.title}". Bible verse: "${devotional.verse.reference}: ${devotional.verse.text}". Content: ${devotional.content}. Create a warm, thoughtful delivery in the style of a radio devotional segment. Keep it concise (about 60 seconds when spoken).`;
    
    // Generate the announcement
    const result = await openaiService.generateVoiceAnnouncement(
      devotionalPrompt,
      voice,
      undefined,
      'custom'
    );
    
    return {
      scriptText: result.scriptText,
      audioPath: result.audioPath,
      type: 'devotional',
      metadata: {
        voice,
        verseReference: devotional.verse.reference,
        createdAt: new Date()
      }
    };
  } catch (error) {
    log(`Error generating devotional: ${error.message}`);
    throw error;
  }
}

/**
 * Generate a custom announcement
 */
export async function generateCustomAnnouncement(
  prompt: string,
  voice: VoiceOption = 'nova',
  options?: {
    includeVerse?: boolean;
    includeTrending?: boolean;
  }
): Promise<AnnouncementResult> {
  try {
    let fullPrompt = prompt;
    let verseReference: string | undefined;
    
    // Add a verse if requested
    if (options?.includeVerse) {
      const verse = await bibleService.getRandomInspirationalVerse();
      fullPrompt += `\n\nInclude this Bible verse: "${verse.reference}: ${verse.text}"`;
      verseReference = verse.reference;
    }
    
    // Add trending topic if requested
    if (options?.includeTrending) {
      const trendingTopics = await rssService.getTrendingTopics(1);
      if (trendingTopics.length > 0) {
        fullPrompt += `\n\nInclude a mention of this trending topic related to Christianity: "${trendingTopics[0]}"`;
      }
    }
    
    // Generate the announcement
    const result = await openaiService.generateVoiceAnnouncement(
      fullPrompt,
      voice,
      undefined,
      'custom'
    );
    
    return {
      scriptText: result.scriptText,
      audioPath: result.audioPath,
      type: 'custom',
      metadata: {
        voice,
        verseReference,
        createdAt: new Date()
      }
    };
  } catch (error) {
    log(`Error generating custom announcement: ${error.message}`);
    throw error;
  }
}

/**
 * Generate an announcement based on type and options
 */
export async function generateAnnouncement(
  type: AnnouncementType,
  options: AnnouncementOptions = {}
): Promise<AnnouncementResult> {
  const voice = options.voice || 'nova';
  
  switch (type) {
    case 'show-intro':
      if (!options.showId) {
        throw new Error('Show ID is required for show intro announcements');
      }
      return generateShowIntro(options.showId, voice, options.includeVerse);
      
    case 'show-outro':
      if (!options.showId) {
        throw new Error('Show ID is required for show outro announcements');
      }
      return generateShowOutro(options.showId, voice);
      
    case 'verse':
      return generateVerseAnnouncement(voice);
      
    case 'news':
      return generateNewsAnnouncement(voice);
      
    case 'station-id':
      return generateStationId(voice);
      
    case 'devotional':
      return generateDevotional(voice);
      
    case 'custom':
      if (!options.customPrompt) {
        throw new Error('Custom prompt is required for custom announcements');
      }
      return generateCustomAnnouncement(options.customPrompt, voice, {
        includeVerse: options.includeVerse,
        includeTrending: options.includeTrending
      });
      
    default:
      throw new Error(`Unsupported announcement type: ${type}`);
  }
}

export default {
  generateShowIntro,
  generateShowOutro,
  generateVerseAnnouncement,
  generateNewsAnnouncement,
  generateStationId,
  generateDevotional,
  generateCustomAnnouncement,
  generateAnnouncement
};