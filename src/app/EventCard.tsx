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
      <div className="bg-[#201c1c] rounded-xl shadow-md hover:shadow-xl border border-[#333333] transition-shadow duration-300 overflow-hidden h-[450px] flex flex-col">
        {imageUrl && (
          <div className="relative h-48 w-full overflow-hidden border-b border-[#333333]">
            <img
              src={imageUrl}
              alt={title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-xl font-semibold mb-2 text-[#fea900] group-hover:text-white transition-colors line-clamp-2 min-h-[3.5rem]">
            {title}
          </h3>
          
          <p className="text-[#e0e0e0] mb-4 line-clamp-2 flex-grow">
            {description}
          </p>
          
          <div className="space-y-2 mt-auto">
            <div className="flex items-center text-[#e0e0e0]">
              <CalendarIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{date}</span>
            </div>
            
            <div className="flex items-center text-[#e0e0e0]">
              <ClockIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{time}</span>
            </div>
            
            <div className="flex items-center text-[#e0e0e0]">
              <MapPinIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="line-clamp-1">{address}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}