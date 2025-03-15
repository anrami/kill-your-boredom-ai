/**
 * Seattle Events Scraper
 * 
 * This module provides functionality to scrape events from multiple sources:
 * - events12.com/seattle
 * - lu.ma (Seattle events)
 * 
 * Events are enhanced with the Tavily API for additional context.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

class SeattleEventsScraper {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.events12Url = 'https://www.events12.com/seattle/';
    this.lumaUrl = 'https://lu.ma/seattle';
  }

  /**
   * Get all events from events12.com/seattle
   */
  async getEvents12Events() {
    try {
      console.log('Fetching events from events12.com/seattle...');
      
      // Fetch the page
      const response = await axios.get(this.events12Url);
      const $ = cheerio.load(response.data);
      
      // Extract events
      const events = [];
      
      // events12.com typically lists events with links
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
          
          // Get current month and year for the date
          const now = new Date();
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          
          events.push({
            title,
            date: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
            isFree,
            url: eventUrl
          });
        }
      });
      
      return events;
    } catch (error) {
      console.error('Error fetching events:', error.message);
      return [];
    }
  }

  /**
   * Get events from lu.ma for Seattle
   */
  async getLumaEvents() {
    try {
      console.log('Fetching events from lu.ma for Seattle...');
      
      // Since lu.ma might be using client-side rendering or have anti-scraping measures,
      // we'll use Tavily API to get events from lu.ma instead of direct scraping
      console.log('Using Tavily API to search for lu.ma Seattle events...');
      
      const tavilyResponse = await axios.post(
        'https://api.tavily.com/search',
        {
          query: 'Seattle events lu.ma',
          search_depth: "advanced",
          include_domains: ['lu.ma'],
          max_results: 20
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      // Process Tavily results
      const tavilyResults = tavilyResponse.data.results || [];
      console.log(`Found ${tavilyResults.length} lu.ma events via Tavily`);
      
      // Extract events from Tavily results
      const events = tavilyResults.map(result => {
        // Extract date if available in the content
        let eventDate = '';
        const dateMatch = result.content && result.content.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(st|nd|rd|th)?(,? \d{4})?/i);
        
        if (dateMatch) {
          eventDate = dateMatch[0];
        } else {
          // If no specific date found, use current month/year
          const now = new Date();
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          eventDate = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        }
        
        // Extract location if available
        let location = 'Seattle';
        const locationMatch = result.content && result.content.match(/(?:at|in|location:)\s+([^,.]+(?:,\s*[^,.]+)?)/i);
        if (locationMatch) {
          location = locationMatch[1].trim();
        }
        
        // Check if event is free
        const isFree = (result.title + ' ' + result.content).toLowerCase().includes('free');
        
        return {
          title: result.title,
          date: eventDate,
          description: result.content ? result.content.substring(0, 200) + '...' : '',
          isFree,
          location,
          url: result.url,
          source: 'lu.ma'
        };
      });
      
      return events;
    } catch (error) {
      console.error('Error fetching lu.ma events:', error.message);
      return [];
    }
  }
  
  /**
   * Get all events from all sources
   */
  async getAllEvents() {
    try {
      // Get events from both sources
      const [events12Events, lumaEvents] = await Promise.all([
        this.getEvents12Events(),
        this.getLumaEvents()
      ]);
      
      // Add source information to events12 events
      const events12WithSource = events12Events.map(event => ({
        ...event,
        source: 'events12.com'
      }));
      
      // Combine all events
      return [...events12WithSource, ...lumaEvents];
    } catch (error) {
      console.error('Error fetching all events:', error.message);
      return [];
    }
  }

  /**
   * Search for events on a specific date using Tavily API
   * @param {string} dateString - Date in YYYY-MM-DD format
   */
  async getEventsForDate(dateString) {
    try {
      // First get all events from all sources
      const allEvents = await this.getAllEvents();
      
      // Format the date for searching
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      console.log(`Searching for Seattle events on ${formattedDate}...`);
      
      // Use Tavily API to search for events on the specific date
      // Note: We're using axios directly with the Tavily API instead of the SDK
      const tavilyResponse = await axios.post(
        'https://api.tavily.com/search',
        {
          query: `Seattle events on ${formattedDate}`,
          search_depth: "advanced",
          include_domains: ['events12.com', 'lu.ma'],
          max_results: 15
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      // Process Tavily results
      const tavilyResults = tavilyResponse.data.results || [];
      
      // Enhance our events with Tavily's search results
      const enhancedEvents = allEvents.map(event => {
        // Try to find a matching event in Tavily results
        const matchingResult = tavilyResults.find(result => 
          result.title.includes(event.title) || 
          event.title.includes(result.title) ||
          (result.content && result.content.includes(event.title))
        );
        
        if (matchingResult) {
          // Extract location if available
          const locationMatch = matchingResult.content && matchingResult.content.match(/at\s+([^,.]+)/i);
          const location = locationMatch ? locationMatch[1].trim() : undefined;
          
          return {
            ...event,
            description: matchingResult.content ? matchingResult.content.substring(0, 200) + '...' : undefined,
            location,
            url: matchingResult.url || event.url,
            relevantDate: formattedDate
          };
        }
        
        return event;
      });
      
      // Filter events that are likely to be on the requested date
      // based on Tavily search results
      const dateEvents = enhancedEvents.filter(event => 
        event.relevantDate || 
        event.description?.toLowerCase().includes(formattedDate.toLowerCase())
      );
      
      return {
        date: formattedDate,
        events: dateEvents.length > 0 ? dateEvents : enhancedEvents.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting events for date:', error.message);
      if (error.response) {
        console.error('Tavily API error:', error.response.data);
      }
      return { date: dateString, events: [] };
    }
  }
}

module.exports = SeattleEventsScraper;

// For testing directly
if (require.main === module) {
  // Read API key from .env.local
  let apiKey;
  try {
    const envPath = path.resolve(__dirname, '../../../.env.local');
    console.log('Looking for .env.local at:', envPath);
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/TAVILY_API_KEY=([^\s]+)/);
    apiKey = match ? match[1] : null;
  } catch (error) {
    console.error('Error reading .env.local file:', error.message);
    process.exit(1);
  }

  if (!apiKey) {
    console.error('TAVILY_API_KEY not found in .env.local file');
    process.exit(1);
  }

  // Create scraper instance
  const scraper = new SeattleEventsScraper(apiKey);
  
  // Test getting all events first
  scraper.getAllEvents()
    .then(events => {
      console.log(`Found ${events.length} total events from all sources:`);
      console.log(`- events12.com: ${events.filter(e => e.source === 'events12.com').length} events`);
      console.log(`- lu.ma: ${events.filter(e => e.source === 'lu.ma').length} events`);
      console.log('\nSample events:');
      console.log(JSON.stringify(events.slice(0, 5), null, 2));
      
      // Now test with tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      
      return scraper.getEventsForDate(dateString);
    })
    .then(result => {
      console.log(`\nFound ${result.events.length} events for ${result.date}:`);
      console.log(JSON.stringify(result.events.slice(0, 5), null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
