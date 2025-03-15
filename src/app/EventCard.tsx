import Link from 'next/link';
import { CalendarIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Event {
  title: string;
  date: string;
  description?: string;
  isFree: boolean;
  location?: string;
  url: string;
  source: string;
}

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Link
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="bg-[#201c1c] rounded-xl shadow-md hover:shadow-xl border border-[#333333] transition-shadow duration-300 overflow-hidden h-[450px] flex flex-col">
        <div className="relative h-48 w-full overflow-hidden border-b border-[#333333] bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="absolute top-0 right-0 bg-[#201c1c] text-[#fea900] px-3 py-1 m-2 rounded-full text-xs font-medium border border-[#333333]">
            {event.source}
          </div>
          {event.isFree && (
            <div className="absolute bottom-0 left-0 bg-green-600 text-white px-3 py-1 m-2 rounded-full text-xs font-medium">
              FREE
            </div>
          )}
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-semibold mb-2 text-[#fea900] group-hover:text-white transition-colors line-clamp-2 min-h-[3.5rem]">
            {event.title}
          </h3>
          
          <p className="text-[#e0e0e0] mb-4 line-clamp-2 flex-grow">
            {event.description || 'No description available'}
          </p>
          
          <div className="space-y-2 mt-auto">
            <div className="flex items-center text-[#e0e0e0]">
              <CalendarIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>
                {(() => {
                  try {
                    // Try to parse and format the date
                    const date = new Date(event.date);
                    if (isNaN(date.getTime())) {
                      // If parsing fails, return the original date string
                      return event.date;
                    }
                    return date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    });
                  } catch {
                    // If any error occurs, return the original date string
                    return event.date;
                  }
                })()} 
              </span>
            </div>
            
            {event.location && (
              <div className="flex items-center text-[#e0e0e0]">
                <MapPinIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}