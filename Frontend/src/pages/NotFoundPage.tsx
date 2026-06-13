import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
        <Calendar className="w-8 h-8 text-indigo-600" />
      </div>
      <h1 className="text-5xl font-bold text-gray-900 mb-2">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-3">Page not found</h2>
      <p className="text-gray-500 max-w-sm mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/event-types">
        <Button>Go to Event Types</Button>
      </Link>
    </div>
  );
}
