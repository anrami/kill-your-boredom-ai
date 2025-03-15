import axios from 'axios';
import * as cheerio from 'cheerio';
import { tavily } from '@tavily/core';

export interface Event {
  title: string;
  date: string;
  description?: string;
  location?: string;
  isFree: boolean;
  url?: string;
}

export class Events12Scraper {
  private tavilyClient;
  private baseUrl = 'https://www.events12.com/seattle/';

  constructor(apiKey: string) {
    this.tavilyClient = tavily({ apiKey });
  }

  /**
   * Get events for a specific month/year
   * @param month - Month number (1-12)
   * @param year - Year (e.g., 2025)
   */
  async getMonthlyEvents(month: number, year: number): Promise<Event[]> {
    try {
      // Format the date for the URL (events12.com uses month names)
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      
      const monthName = monthNames[month - 1];
      const url = `${this.baseUrl}${monthName}-${year}/`;
      
      // Fetch the page content
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      const events: Event[] = [];
      
      // Parse events from the page
      // events12.com typically lists events with links and sometimes FREE indicators
      $('a').each((_, element) => {
        const linkText = $(element).text().trim();
        
        // Skip empty links or navigation links
        if (!linkText || linkText.length < 5) return;
        
        // Check if it's an event (contains descriptive text)
        if (linkText.includes('+') || linkText.length > 10) {
          const isFree = linkText.toLowerCase().includes('free');
          const eventUrl = $(element).attr('href');
          
          // Clean up the title
          let title = linkText.replace(/\s+FREE\s*$/i, '').trim();
          
          events.push({
            title,
            date: `${monthName} ${year}`, // We only have month-level precision from the listing
            isFree,
            url: eventUrl
          });
        }
      });
      
      return events;
    } catch (error) {
      console.error('Error fetching events from events12.com:', error);
      return [];
    }
  }

  /**
   * Get events for a specific date using Tavily for enhanced data
   * @param dateString - Date in YYYY-MM-DD format
   */
  async getEventsForDate(dateString: string): Promise<Event[]> {
    try {
      const date = new Date(dateString);
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      const year = date.getFullYear();
      
      // First, get the basic event list from the website
      const monthlyEvents = await this.getMonthlyEvents(month, year);
      
      // Use Tavily to get more specific date information
      const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      const searchResponse = await this.tavilyClient.search(
        `Seattle events on ${formattedDate} events12.com`,
        {
          search_depth: "advanced",
          include_domains: ['events12.com'],
          max_results: 10
        }
      );
      
      // Enhance our events with Tavily's search results
      const enhancedEvents = monthlyEvents.map(event => {
        // Try to find a matching event in Tavily results
        const matchingResult = searchResponse.results.find(result => 
          result.title.includes(event.title) || 
          event.title.includes(result.title) ||
          result.content.includes(event.title)
        );
        
        if (matchingResult) {
          // Extract location if available
          const locationMatch = matchingResult.content.match(/at\s+([^,.]+)/i);
          const location = locationMatch ? locationMatch[1].trim() : undefined;
          
          return {
            ...event,
            description: matchingResult.content.substring(0, 200) + '...',
            location,
            url: matchingResult.url || event.url
          };
        }
        
        return event;
      });
      
      return enhancedEvents;
    } catch (error) {
      console.error('Error getting events for date:', error);
      return [];
    }
  }
}

// Test the scraper if run directly
if (typeof window === 'undefined' && process.argv[1] === __filename) {
  // Load environment variables for testing
  require('dotenv').config();
  
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.error('Please set TAVILY_API_KEY environment variable');
    process.exit(1);
  }

  const scraper = new Events12Scraper(apiKey);
  
  // Test with tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateString = tomorrow.toISOString().split('T')[0];

  console.log(`Searching for Seattle events on ${dateString}...`);
  scraper.getEventsForDate(dateString)
    .then(events => {
      console.log(`Found ${events.length} events:`);
      console.log(JSON.stringify(events, null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
