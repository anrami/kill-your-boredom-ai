'use client';

import { useState, useEffect } from 'react';
import EventCard from './EventCard';
import Loader from './Loader';

const categories = [
  'All',
  'Music',
  'Arts',
  'Sports',
  'Food & Drink',
  'Outdoors',
  'Nightlife',
  'Family',
];

const cities = [
  'Seattle',
  'Bellevue',
  'Redmond',
  'Kirkland',
];

// Define Event interface to match our backend API
interface Event {
  title: string;
  date: string;
  description?: string;
  isFree: boolean;
  location?: string;
  url: string;
  source: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('Seattle');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [dateEvents, setDateEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateLoading, setDateLoading] = useState(false);
  const [error, setError] = useState('');

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // Get tomorrow's date
  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  };
  
  // Fetch all events on initial load
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:3001/api/events');
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data.events || []);
        setError('');
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, []);
  
  // Fetch events for a specific date
  const fetchEventsByDate = async (date: string) => {
    try {
      setDateLoading(true);
      const response = await fetch(`http://localhost:3001/api/events/date/${date}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch events for this date');
      }
      
      const data = await response.json();
      setDateEvents(data.events || []);
      setError('');
    } catch (err) {
      console.error('Error fetching events by date:', err);
      setError('Failed to load events for this date. Please try again.');
      setDateEvents([]);
    } finally {
      setDateLoading(false);
    }
  };
  
  // Search events with text query and filters
  const searchEvents = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedCity) params.append('city', selectedCity);
      if (startDate) params.append('date', startDate);
      
      // Use our new backend search endpoint
      const response = await fetch(`http://localhost:3001/api/events/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to search events');
      }
      
      const data = await response.json();
      setEvents(data.events || []);
      setError('');
    } catch (err) {
      console.error('Error searching events:', err);
      setError('Failed to search events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use the unified search endpoint for all searches
    searchEvents();
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold uppercase text-[#fea900] mb-4">
            Kill Your Boredom AI
          </h1>
          <p className="text-lg text-[#e0e0e0]">
            Discover amazing events happening around you.
          </p>
        </div>
        
        <div className="bg-[#201c1c] rounded-2xl shadow-xl p-6 sm:p-8 mb-12 border border-[#333333]">
          <form onSubmit={handleSearch} className="space-y-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-4 pl-5 pr-16 text-lg rounded-xl border border-[#333333] bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#fea900] text-[#201c1c] rounded-lg hover:opacity-90 transition-opacity"
              >
                Search
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#fea900]">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[#333333] dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#fea900]">
                  City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[#333333]  dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#fea900]">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[#333333] dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#fea900]">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[#333333] dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </form>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {startDate && dateEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-[#fea900]">
              Events for {new Date(startDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </h2>
            
            {dateLoading ? (
              <Loader />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dateEvents.map((event, index) => (
                  <EventCard key={`${event.title}-${index}`} event={event} />
                ))}
              </div>
            )}
          </div>
        )}
        
        <h2 className="text-2xl font-semibold mb-4 text-[#fea900]">
          All Upcoming Events
        </h2>
        
        {isLoading ? (
          <Loader />
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <EventCard key={`${event.title}-${index}`} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-[#e0e0e0]">
            No events found. Please try again later.
          </p>
        )}
      </div>
    </main>
  );
}
