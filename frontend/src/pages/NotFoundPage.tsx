import { Link } from 'react-router-dom';
import { Leaf, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-forest-100 mb-6">
          <AlertCircle className="w-8 h-8 text-forest-700" />
        </div>

        <h1 className="font-display text-3xl font-bold text-tv-primary mb-3">
          Page Not Found
        </h1>

        <p className="text-tv-secondary mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link to="/" className="btn-primary">
          <Leaf className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
