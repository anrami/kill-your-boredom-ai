'use client';

import { useState } from 'react';
import EventCard from './EventCard';

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

// Sample events data
const sampleEvents = [
  {
    title: "Jazz Night at The Triple Door",
    description: "Join us for an evening of smooth jazz featuring local artists and special guests. Enjoy craft cocktails and a full dinner menu while experiencing Seattle's vibrant jazz scene.",
    address: "216 Union St, Seattle, WA 98101",
    eventUrl: "https://example.com/jazz-night",
    date: "March 20, 2025",
    time: "8:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819"
  },
  {
    title: "Spring Food Festival",
    description: "Experience the best of Pacific Northwest cuisine with over 30 local vendors, cooking demonstrations, and wine tasting sessions.",
    address: "305 Harrison St, Seattle, WA 98109",
    eventUrl: "https://example.com/food-festival",
    date: "March 23, 2025",
    time: "11:00 AM - 7:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1"
  },
  {
    title: "Art Walk & Gallery Opening",
    description: "First Thursday Art Walk featuring new exhibitions from local and international artists. Free admission to participating galleries.",
    address: "Pioneer Square, Seattle, WA",
    eventUrl: "https://example.com/art-walk",
    date: "April 4, 2025",
    time: "5:00 PM - 9:00 PM",
    imageUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b"
  }
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('Seattle');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [events, setEvents] = useState(sampleEvents);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({
      searchQuery,
      selectedCategory,
      selectedCity,
      startDate,
      endDate,
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            Kill Your Boredom
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Discover amazing events happening around you
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-12">
          <form onSubmit={handleSearch} className="space-y-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-4 pl-5 pr-16 text-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Search
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <EventCard
              key={index}
              title={event.title}
              description={event.description}
              address={event.address}
              eventUrl={event.eventUrl}
              date={event.date}
              time={event.time}
              imageUrl={event.imageUrl}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
