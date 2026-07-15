// ============================================================================
// ProductEditModal.tsx — Modal pour modifier les champs d'un produit
// ============================================================================

import { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Product } from '@/types';
import { useIsRTL } from '@/lib/i18n';

interface ProductEditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: Product) => Promise<void>;
}

export default function ProductEditModal({ 
  product, 
  isOpen, 
  onClose, 
  onSave 
}: ProductEditModalProps) {
  const isRTL = useIsRTL();
  const [formData, setFormData] = useState<Product | null>(product);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !product) return null;

  const handleChange = (field: keyof Product, value: any) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await onSave(formData);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError((err as Error).message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return null;

  return (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 ${isOpen ? '' : 'hidden'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Modifier le produit
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
              ✅ Produit modifié avec succès!
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Field Groups */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Nom du produit *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* DCI */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                DCI (Composant actif)
              </label>
              <input
                type="text"
                value={formData.dci}
                onChange={(e) => handleChange('dci', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Laboratory */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Laboratoire
              </label>
              <input
                type="text"
                value={formData.laboratory}
                onChange={(e) => handleChange('laboratory', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Form */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Forme galénique
              </label>
              <input
                type="text"
                value={formData.form}
                onChange={(e) => handleChange('form', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Dosage */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Dosage
              </label>
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => handleChange('dosage', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* PPM (Prix) */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                PPM (Prix en MAD)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.ppm}
                onChange={(e) => handleChange('ppm', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Therapeutic Class */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Classe thérapeutique
              </label>
              <input
                type="text"
                value={formData.therapeuticClass}
                onChange={(e) => handleChange('therapeuticClass', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Indications */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Indications
              </label>
              <textarea
                value={formData.indications}
                onChange={(e) => handleChange('indications', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Posology */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Posologie
              </label>
              <textarea
                value={formData.posology}
                onChange={(e) => handleChange('posology', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Contraindications */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Contre-indications
              </label>
              <textarea
                value={formData.contraindications}
                onChange={(e) => handleChange('contraindications', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Side Effects */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Effets secondaires
              </label>
              <textarea
                value={formData.sideEffects}
                onChange={(e) => handleChange('sideEffects', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Conservation */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Conservation
              </label>
              <textarea
                value={formData.conservation}
                onChange={(e) => handleChange('conservation', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Prescription Required */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Ordonnance requise
              </label>
              <select
                value={formData.isPrescriptionRequired ? 'true' : 'false'}
                onChange={(e) => handleChange('isPrescriptionRequired', e.target.value === 'true')}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Catégories (virgule-séparées)
              </label>
              <input
                type="text"
                value={formData.categories.join(', ')}
                onChange={(e) => handleChange('categories', e.target.value.split(',').map(c => c.trim()))}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {loading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
