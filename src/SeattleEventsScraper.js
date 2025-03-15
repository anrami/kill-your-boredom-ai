require('dotenv').config({ path: '/Users/aksharawari/Documents/Personal Projects/kill-your-boredom-ai/.env.local' });
const axios = require('axios');
const readline = require('readline');

const apiKey = process.env.TAVILY_API_KEY;

if (!apiKey) {
  console.error('TAVILY_API_KEY is missing. Please check your .env or .env.local file.');
  process.exit(1);
}

const DEFAULT_CATEGORIES = [
  "All Categories",
  "Arts & Theater",
  "Music & Concerts",
  "Food & Drink",
  "Sports & Fitness",
  "Gaming & Esports",
  "Business & Networking",
  "Tech & Innovation",
  "Community & Culture",
  "Education & Workshops",
  "Science & Space",
  "Family & Kids",
  "Outdoor & Adventure",
  "Comedy & Open Mic",
  "Movies & Film"
];

class SeattleEventsScraper {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.tavilyUrl = 'https://api.tavily.com/search';
  }

  async getEventsFromTavily(query, city, category, startDate, endDate, maxResults = 50) {
    try {
      console.log(`Fetching events for query: "${query}", city: "${city}", category: "${category}", start: "${startDate}", end: "${endDate}"...`);

      const response = await axios.post(
        this.tavilyUrl,
        {
          query,
          city,
          category: category === "All Categories" ? null : category,
          start_date: startDate,
          end_date: endDate,
          search_depth: 'advanced',
          max_results: maxResults,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      const events = response.data.results.map((result) => ({
        title: result.title || "No title available",
        url: result.url || "No URL available",
        description: result.content ? result.content.substring(0, 200) + '...' : 'No description available.',
        source: new URL(result.url).hostname,
      }));

      return events;
    } catch (error) {
      console.error('Error fetching events from Tavily:', error.response?.data || error.message);
      return [];
    }
  }

  async getAllEvents(query, city, category, startDate, endDate) {
    const events = await this.getEventsFromTavily(query || 'events', city, category, startDate, endDate);
    return Array.from(new Map(events.map(event => [event.url, event])).values()); // Remove duplicates
  }
}

// Setup input
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function promptUser(query) {
  return new Promise(resolve => {
    rl.question(`${query}: `, answer => resolve(answer.trim() || null));
  });
}

async function getUserChoices() {
  const choice = await promptUser('Do you want to (1) enter a query, (2) use filters, (3) both, or (4) skip? (Enter number)');

  let query = null, city = null, category = null, startDate = null, endDate = null;

  if (choice === '1' || choice === '3') {
    query = await promptUser('Enter search query');
  }

  if (choice === '2' || choice === '3') {
    city = await promptUser('Enter city');

    console.log('Choose an event category:');
    DEFAULT_CATEGORIES.forEach((cat, i) => console.log(`${i + 1}. ${cat}`));

    const categoryIndex = await promptUser('Enter the category number (default is All Categories)');
    category = DEFAULT_CATEGORIES[parseInt(categoryIndex, 10) - 1] || "All Categories";

    startDate = await promptUser('Enter start date (YYYY-MM-DD)');
    endDate = await promptUser('Enter end date (YYYY-MM-DD)');
  }

  return { query, city, category, startDate, endDate };
}

if (require.main === module) {
  (async () => {
    const { query, city, category, startDate, endDate } = await getUserChoices();
    const scraper = new SeattleEventsScraper(apiKey);
    const events = await scraper.getAllEvents(query || 'events', city, category, startDate, endDate);
    
    console.log(`\n🎉 Found ${events.length} events:\n`);
    events.slice(0, 10).forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   🌐 URL: ${event.url}`);
      console.log(`   📝 Description: ${event.description}`);
      console.log(`   🔗 Source: ${event.source}`);
      console.log('----------------------------------');
    });

    rl.close();
  })().catch(error => console.error('Error:', error));
}

module.exports = SeattleEventsScraper;
