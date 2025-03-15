/**
 * Express server for Seattle Events API
 * 
 * This server provides endpoints to query events from multiple sources:
 * - events12.com
 * - lu.ma
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const SeattleEventsScraper = require('./services/SeattleEventsScraper');

// Read API key from .env.local
let apiKey;
try {
  const envPath = path.resolve(__dirname, './.env.local');
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

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Cache for events data (to avoid hitting API limits)
let eventsCache = {
  allEvents: null,
  dateEvents: {},
  lastUpdated: null
};

// Clear cache every 30 minutes
setInterval(() => {
  eventsCache = {
    allEvents: null,
    dateEvents: {},
    lastUpdated: null
  };
  console.log('Cache cleared');
}, 30 * 60 * 1000);

/**
 * GET /api/events
 * Returns all events from all sources
 */
app.get('/api/events', async (req, res) => {
  try {
    // Check if we have cached data less than 10 minutes old
    const now = new Date();
    if (eventsCache.allEvents && eventsCache.lastUpdated && 
        (now - eventsCache.lastUpdated) < 10 * 60 * 1000) {
      console.log('Returning cached events data');
      return res.json(eventsCache.allEvents);
    }

    // Fetch fresh data
    console.log('Fetching fresh events data');
    const events = await scraper.getAllEvents();
    
    // Update cache
    eventsCache.allEvents = { events };
    eventsCache.lastUpdated = now;
    
    res.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/date/:date
 * Returns events for a specific date (YYYY-MM-DD format)
 */
app.get('/api/events/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Check if we have cached data for this date
    if (eventsCache.dateEvents[date]) {
      console.log(`Returning cached events for date: ${date}`);
      return res.json(eventsCache.dateEvents[date]);
    }
    
    // Fetch fresh data for the date
    console.log(`Fetching events for date: ${date}`);
    const result = await scraper.getEventsForDate(date);
    
    // Update cache
    eventsCache.dateEvents[date] = result;
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching events for date:', error);
    res.status(500).json({ error: 'Failed to fetch events for the specified date' });
  }
});

/**
 * GET /api/events/search
 * Search events with query parameters
 * Query params:
 * - q: Search query
 * - category: Category filter
 * - city: City filter
 * - date: Date filter (YYYY-MM-DD)
 */
app.get('/api/events/search', async (req, res) => {
  try {
    const { q, category, city, date } = req.query;
    
    // Get all events (from cache if available)
    let allEvents;
    const now = new Date();
    
    if (eventsCache.allEvents && eventsCache.lastUpdated && 
        (now - eventsCache.lastUpdated) < 10 * 60 * 1000) {
      allEvents = eventsCache.allEvents.events;
    } else {
      allEvents = await scraper.getAllEvents();
      eventsCache.allEvents = { events: allEvents };
      eventsCache.lastUpdated = now;
    }
    
    // Apply filters
    let filteredEvents = [...allEvents];
    
    // Text search filter
    if (q && q.trim() !== '') {
      const searchTerms = q.toLowerCase().trim().split(/\s+/);
      filteredEvents = filteredEvents.filter(event => {
        const eventText = `${event.title} ${event.description || ''} ${event.location || ''}`.toLowerCase();
        return searchTerms.some(term => eventText.includes(term));
      });
    }
    
    // Category filter
    if (category && category !== 'All') {
      filteredEvents = filteredEvents.filter(event => {
        const eventText = `${event.title} ${event.description || ''}`.toLowerCase();
        return eventText.includes(category.toLowerCase());
      });
    }
    
    // City filter
    if (city) {
      filteredEvents = filteredEvents.filter(event => {
        const location = (event.location || '').toLowerCase();
        return location.includes(city.toLowerCase());
      });
    }
    
    // Date filter
    if (date) {
      // Get events for the specific date
      const dateResult = await scraper.getEventsForDate(date);
      
      // If we have date-specific events, use them
      if (dateResult.events && dateResult.events.length > 0) {
        // Combine with our text/category/city filters
        filteredEvents = filteredEvents.filter(event => {
          return dateResult.events.some(dateEvent => 
            dateEvent.title === event.title && dateEvent.source === event.source
          );
        });
      }
    }
    
    res.json({ events: filteredEvents });
  } catch (error) {
    console.error('Error searching events:', error);
    res.status(500).json({ error: 'Failed to search events' });
  }
});

/**
 * GET /api/events/sources
 * Returns list of available event sources
 */
app.get('/api/events/sources', (req, res) => {
  res.json({
    sources: [
      { id: 'events12', name: 'Events12.com', url: 'https://www.events12.com/seattle/' },
      { id: 'luma', name: 'Lu.ma', url: 'https://lu.ma/seattle' }
    ]
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /api/events - Get all events');
  console.log('- GET /api/events/date/:date - Get events for a specific date (YYYY-MM-DD)');
  console.log('- GET /api/events/sources - Get list of event sources');
});
