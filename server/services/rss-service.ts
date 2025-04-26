import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { log } from '../vite';

// Get RSS feed URLs from environment variables
const RSS_FEED_URLS = process.env.RSS_FEED_URLS ? 
  process.env.RSS_FEED_URLS.split(',') : 
  [
    'https://www.christianitytoday.com/ct/rss/ctweekly.xml',  // Christianity Today
    'https://www.relevantmagazine.com/feed/',                  // Relevant Magazine
    'https://www.crosswalk.com/feed/christianity.xml'          // Crosswalk
  ];

// News item structure
interface NewsItem {
  title: string;
  description: string;
  link: string;
  pubDate?: string;
  topics?: string[];
}

/**
 * Fetch and parse an RSS feed
 */
async function fetchRSSFeed(url: string): Promise<NewsItem[]> {
  try {
    const response = await axios.get(url, {
      responseType: 'text',
      headers: {
        'User-Agent': 'Christian Radio Station/1.0'
      }
    });
    
    const parsed = await parseStringPromise(response.data, {
      explicitArray: false,
      normalize: true,
      normalizeTags: true
    });
    
    if (!parsed.rss || !parsed.rss.channel || !parsed.rss.channel.item) {
      return [];
    }
    
    // Handle both array and single item responses
    const items = Array.isArray(parsed.rss.channel.item) ? 
      parsed.rss.channel.item : 
      [parsed.rss.channel.item];
    
    return items.map(item => ({
      title: item.title || 'Untitled',
      description: item.description ? 
        // Remove HTML tags from description
        item.description.replace(/<\/?[^>]+(>|$)/g, "") : 
        '',
      link: item.link || '',
      pubDate: item.pubdate || item.pubDate || '',
      // Extract topics from categories if available
      topics: item.category ? 
        (Array.isArray(item.category) ? item.category : [item.category]) : 
        []
    })).slice(0, 10); // Limit to top 10 items
  } catch (error) {
    log(`Error fetching RSS feed from ${url}: ${error.message}`);
    return [];
  }
}

/**
 * Get the latest news from all configured RSS feeds
 */
export async function getLatestNews(limit: number = 10): Promise<NewsItem[]> {
  try {
    const feedPromises = RSS_FEED_URLS.map(url => fetchRSSFeed(url));
    const feedResults = await Promise.all(feedPromises);
    
    // Flatten all feed results into a single array
    const allItems = feedResults.flat();
    
    // Sort by publication date (if available)
    const sortedItems = allItems.sort((a, b) => {
      if (!a.pubDate) return 1;
      if (!b.pubDate) return -1;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });
    
    // Return the top items based on limit
    return sortedItems.slice(0, limit);
  } catch (error) {
    log(`Error getting latest news: ${error.message}`);
    return [];
  }
}

/**
 * Extract trending topics from recent news items
 */
export async function getTrendingTopics(count: number = 5): Promise<string[]> {
  try {
    // Get the latest news items
    const newsItems = await getLatestNews(20);
    
    // Extract topics from all items
    const allTopics: string[] = [];
    newsItems.forEach(item => {
      // Add explicit topics from RSS categories
      if (item.topics && item.topics.length > 0) {
        allTopics.push(...item.topics);
      }
      
      // Extract keywords from title
      if (item.title) {
        // Split title into words, filter out common words
        const titleWords = item.title.split(' ')
          .map(word => word.toLowerCase().replace(/[^\w\s]|_/g, ""))
          .filter(word => word.length > 3)
          .filter(word => !['with', 'that', 'this', 'from', 'they', 'will', 'have', 'been', 'what', 'when', 'where', 'news', 'about', 'their', 'there', 'were', 'says'].includes(word));
        
        allTopics.push(...titleWords);
      }
    });
    
    // Count occurrences of each topic
    const topicCounts: Record<string, number> = {};
    allTopics.forEach(topic => {
      if (!topic) return;
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
    
    // Sort by count and return top topics
    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, count);
  } catch (error) {
    log(`Error getting trending topics: ${error.message}`);
    return [
      'faith', 'prayer', 'hope', 'love', 'encouragement'
    ];
  }
}

/**
 * Get news items related to a specific topic
 */
export async function getNewsOnTopic(topic: string, limit: number = 3): Promise<NewsItem[]> {
  try {
    const allNews = await getLatestNews(20);
    
    // Filter news items related to the topic
    const filteredNews = allNews.filter(item => {
      const lowerTopic = topic.toLowerCase();
      
      // Check if topic is in the explicit topics list
      if (item.topics && item.topics.some(t => t.toLowerCase().includes(lowerTopic))) {
        return true;
      }
      
      // Check if topic is in title or description
      if (item.title.toLowerCase().includes(lowerTopic) || 
          item.description.toLowerCase().includes(lowerTopic)) {
        return true;
      }
      
      return false;
    });
    
    return filteredNews.slice(0, limit);
  } catch (error) {
    log(`Error getting news on topic ${topic}: ${error.message}`);
    return [];
  }
}

export default {
  getLatestNews,
  getTrendingTopics,
  getNewsOnTopic
};