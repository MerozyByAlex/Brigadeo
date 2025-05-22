import { useState, useEffect } from 'react';
import { Pencil, Check, X, KeyRound, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import type { Profile } from '../../types/profile';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

type EditableField = 'first_name' | 'last_name' | null;

export default function ProfileTab() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [editValue, setEditValue] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile({ ...data, email: user.email });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: EditableField, value: string) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleSave = async () => {
    if (!profile || !editingField) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [editingField]: editValue })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, [editingField]: editValue });
      setEditingField(null);
      setEditValue('');

      showToast({
        text: 'Profil mis à jour avec succès',
        color: 'success',
        icon: <Check className="h-4 w-4" />
      });
    } catch (err) {
      console.error(err);
      showToast({
        text: "Une erreur s'est produite",
        color: 'error',
        icon: <X className="h-4 w-4" />
      });
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      showToast({
        text: 'Les mots de passe ne correspondent pas',
        color: 'error',
        icon: <X className="h-4 w-4" />
      });
      return;
    }

    setChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      showToast({
        text: 'Mot de passe mis à jour avec succès',
        color: 'success',
        icon: <Check className="h-4 w-4" />
      });
    } catch (err) {
      console.error(err);
      showToast({
        text: "Une erreur s'est produite",
        color: 'error',
        icon: <X className="h-4 w-4" />
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!profile) {
    return <div>Erreur lors du chargement du profil</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="mt-1 text-sm text-gray-900">{profile.email}</p>
          </div>
          <User className="h-5 w-5 text-gray-400" />
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">Prénom</p>
            {editingField === 'first_name' ? (
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="max-w-xs"
                />
                <button
                  onClick={handleSave}
                  className="p-1 text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm text-gray-900">{profile.first_name || '—'}</p>
                <button
                  onClick={() => handleEdit('first_name', profile.first_name || '')}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">Nom</p>
            {editingField === 'last_name' ? (
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="max-w-xs"
                />
                <button
                  onClick={handleSave}
                  className="p-1 text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm text-gray-900">{profile.last_name || '—'}</p>
                <button
                  onClick={() => handleEdit('last_name', profile.last_name || '')}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-6">
        <Button
          variant="outline"
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          icon={<KeyRound className="h-4 w-4" />}
        >
          Modifier le mot de passe
        </Button>

        <AnimatePresence>
          {showPasswordForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            <Input
              type="password"
              label="Mot de passe actuel"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type="password"
              label="Nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              label="Confirmer le nouveau mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              onClick={handlePasswordChange}
              loading={changingPassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              Valider le changement
            </Button>
          </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}