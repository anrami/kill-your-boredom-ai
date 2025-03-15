import Link from 'next/link';
import { CalendarIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';

interface EventCardProps {
  title: string;
  description: string;
  address: string;
  eventUrl: string;
  date: string;
  time: string;
  imageUrl?: string;
}

export default function EventCard({
  title,
  description,
  address,
  eventUrl,
  date,
  time,
  imageUrl,
}: EventCardProps) {
  return (
    <Link
      href={eventUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
        {imageUrl && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {description}
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <CalendarIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{date}</span>
            </div>
            
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <ClockIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{time}</span>
            </div>
            
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <MapPinIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="line-clamp-1">{address}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}