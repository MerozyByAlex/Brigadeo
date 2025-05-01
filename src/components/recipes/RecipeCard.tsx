import { Pencil } from 'lucide-react';

type RecipeCardProps = {
  id: string;
  name: string;
  restaurantName: string;
  onEdit: () => void;
  onClick: () => void;
};

export default function RecipeCard({ id, name, restaurantName, onEdit, onClick }: RecipeCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative bg-white p-6 rounded-lg shadow transition-all duration-200 hover:shadow-md hover:translate-y-[-2px] cursor-pointer"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        {name}
      </h2>
      
      <p className="text-sm text-gray-500">
        Restaurant : {restaurantName}
      </p>
    </div>
  );
}