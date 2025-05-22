import { formatDate } from '../../utils/date';
import { Pencil } from 'lucide-react';
export type RestaurantCardProps = {
  name: string;
  created_at: string;
  onClick?: () => void;
  onEdit?: () => void;
};

export default function RestaurantCard({ name, created_at, onClick, onEdit }: RestaurantCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative
        bg-white p-6 rounded-lg shadow
        transition-all duration-200
        hover:shadow-md hover:translate-y-[-2px]
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        {name}
      </h2>
      <p className="text-sm text-gray-500">
        Créé le {formatDate(created_at)}
      </p>
    </div>
  );
}