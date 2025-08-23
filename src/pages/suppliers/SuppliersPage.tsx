import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentProfile } from '../../utils/auth';
import { formatDate } from '../../utils/date';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import SupplierForm from '../../components/suppliers/SupplierForm';

type Supplier = {
  id: string;
  name: string;
  siret: string | null;
  vat_number: string | null;
  created_at: string;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSuppliers = async () => {
    try {
      const profile = await getCurrentProfile();

      if (!profile.organization_id) {
        throw new Error("Aucune organisation trouvée");
      }

      const { data, error: fetchError } = await supabase
        .from('supplier')
        .select('id, name, siret, vat_number, created_at')
        .eq('organization_id', profile.organization_id)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setSuppliers(data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur s'est produite lors du chargement des fournisseurs"
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSuccess = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
    fetchSuppliers();
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="text-center">Chargement...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Fournisseurs</h1>
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={handleCreate}
        >
          Nouveau fournisseur
        </Button>
      </div>

      {suppliers.length > 0 && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Rechercher un fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSupplier(null);
        }}
        title={selectedSupplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}
      >
        <SupplierForm
          supplier={selectedSupplier || undefined}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSupplier(null);
          }}
          onSaved={handleSuccess}
        />
      </Modal>

      {suppliers.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          Aucun fournisseur pour le moment.
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          Aucun fournisseur ne correspond à votre recherche.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SIRET
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° TVA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      {supplier.name}
                      {supplier.vat_number && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          UE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {supplier.siret || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {supplier.vat_number || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(supplier.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      title="Modifier le fournisseur"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}