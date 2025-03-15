import { tavily } from '@tavily/core';

// For testing only
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

if (process.env.NODE_ENV !== 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  dotenv.config({ path: resolve(__dirname, '../../../.env.local') });
}

interface EventData {
  title: string;
  date: Date;
  location: string;
}

export class SeattleEventsScraper {
  private client: ReturnType<typeof tavily>;

  constructor(apiKey: string) {
    this.client = tavily({ apiKey });
  }

  async getSeattleEventsForDate(dateString: string): Promise<EventData[]> {
    const targetDate = new Date(dateString);
    
    // Format the date for the search query
    const formattedDate = targetDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    // Search for events using Tavily's search API
    const searchResponse = await this.client.search(
      `Seattle events on ${formattedDate}`,
      {
      search_depth: "advanced",
      include_domains: [
        'eventbrite.com',
        'seattleevents.com',
        'visitseattle.org',
        'stranger.com'
      ]
    });

    // Process and filter the results
    const events = searchResponse.results
      .filter((result: { title: string; url: string; content: string }) => {
        // Filter for event-related content
        return result.title.toLowerCase().includes('event') || 
               result.url.includes('events') ||
               result.content.toLowerCase().includes('seattle');
      })
      .map((result: { title: string; url: string }) => ({
        title: result.title,
        date: targetDate, // Using the target date since we searched specifically for it
        location: 'Seattle', // Default to Seattle since we're specifically searching for Seattle events
        url: result.url
      }));

    return events;
  }
}

// Test the scraper
// Run test if this file is executed directly
if (import.meta.url.endsWith(process.argv[1])) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.error('Please set TAVILY_API_KEY environment variable');
    process.exit(1);
  }

  const scraper = new SeattleEventsScraper(apiKey);
  
  // Search for events tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateString = tomorrow.toISOString().split('T')[0];

  console.log(`Searching for Seattle events on ${dateString}...`);
  scraper.getSeattleEventsForDate(dateString)
    .then(events => {
      console.log('Found events:', JSON.stringify(events, null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
