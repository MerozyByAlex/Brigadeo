import { useState } from 'react';
import ProfileTab from '../../components/account/ProfileTab';
import SubscriptionTab from '../../components/account/SubscriptionTab';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'profile' | 'subscription';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mon compte</h1>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('profile')}
              className={`
                w-1/4 py-4 px-1 text-center border-b-2 text-sm font-medium transition-all duration-200
                ${activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'}
              `}
            >
              Profil
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`
                w-1/4 py-4 px-1 text-center border-b-2 text-sm font-medium transition-all duration-200
                ${activeTab === 'subscription'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'}
              `}
            >
              Abonnement
            </button>
          </nav>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'subscription' && <SubscriptionTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}