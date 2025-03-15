/**
 * Seattle Events Scraper
 * 
 * This module provides functionality to scrape events from events12.com/seattle
 * and enhance them with the Tavily API.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

class SeattleEventsScraper {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://www.events12.com/seattle/';
  }

  /**
   * Get all events from events12.com/seattle
   */
  async getAllEvents() {
    try {
      console.log('Fetching events from events12.com/seattle...');
      
      // Fetch the page
      const response = await axios.get(this.baseUrl);
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
   * Search for events on a specific date using Tavily API
   * @param {string} dateString - Date in YYYY-MM-DD format
   */
  async getEventsForDate(dateString) {
    try {
      // First get all events from events12.com
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
          query: `Seattle events on ${formattedDate} events12.com`,
          search_depth: "advanced",
          include_domains: ['events12.com'],
          max_results: 10
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
  
  // Test with tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateString = tomorrow.toISOString().split('T')[0];

  // Run the scraper
  scraper.getEventsForDate(dateString)
    .then(result => {
      console.log(`Found ${result.events.length} events for ${result.date}:`);
      console.log(JSON.stringify(result.events, null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
    });
}
