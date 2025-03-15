// Simple debug script for events12.com scraper
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Read the API key directly from .env.local file
let apiKey;
try {
  const envPath = path.resolve(__dirname, './src/.env.local');
  console.log('Looking for .env.local at:', envPath);
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/TAVILY_API_KEY=([^\s]+)/);
  apiKey = match ? match[1] : null;
} catch (error) {
  console.error('Error reading .env.local file:', error.message);
}

if (!apiKey) {
  console.error('TAVILY_API_KEY not found in .env.local file');
  process.exit(1);
}
console.log('Using Tavily API Key:', apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 4));

// Simple function to scrape events12.com
async function scrapeEvents12() {
  try {
    console.log('Fetching events from events12.com/seattle...');
    
    // Use the main Seattle events page
    const url = 'https://www.events12.com/seattle/';
    console.log(`URL: ${url}`);
    
    // Fetch the page
    const response = await axios.get(url);
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
    
    // Print results
    console.log(`Found ${events.length} events`);
    console.log('Sample events:');
    console.log(JSON.stringify(events.slice(0, 10), null, 2));
    
    // Now use Tavily to get more specific information about tomorrow's events
    // First, install the @tavily/core package
    console.log('\nInstalling @tavily/core package...');
    const { execSync } = require('child_process');
    try {
      execSync('npm list @tavily/core || npm install @tavily/core', { stdio: 'inherit' });
      
      // Now import and use Tavily
      const { tavily } = require('@tavily/core');
      const tavilyClient = tavily({ apiKey });
      
      // Format tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const formattedDate = tomorrow.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      // Continue with Tavily search
      await searchWithTavily(tavilyClient, formattedDate);
    } catch (error) {
      console.error('Error with Tavily setup:', error.message);
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

async function searchWithTavily(tavilyClient, formattedDate) {
    
    // Use the formattedDate parameter that was passed in
  console.log(`\nSearching Tavily for Seattle events on ${formattedDate}...`);
  
  try {
    const searchResponse = await tavilyClient.search(
      `Seattle events on ${formattedDate} events12.com`,
      {
        search_depth: "advanced",
        include_domains: ['events12.com'],
        max_results: 5
      }
    );
    
    console.log('Tavily search results:');
    console.log(JSON.stringify(searchResponse.results, null, 2));
  } catch (error) {
    console.error('Error with Tavily search:', error.message);
  }
}

// Run the scraper
scrapeEvents12();
