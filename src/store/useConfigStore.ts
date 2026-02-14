import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppConfig } from '../types';

interface ConfigState extends AppConfig {
    updateConfig: (config: Partial<AppConfig>) => void;
    resetConfig: () => void;
}

const defaultConfig: AppConfig = {
    shopName: 'My Great Shop',
    address: '123 Market Street, Bangkok',
    taxId: '',
    logo: null,
    footerMessage: 'Thank you for your purchase!',
    themeColor: '#2563eb',
};

export const useConfigStore = create<ConfigState>()(
    persist(
        (set) => ({
            ...defaultConfig,
            updateConfig: (newConfig) => set((state) => ({ ...state, ...newConfig })),
            resetConfig: () => set(defaultConfig),
        }),
        {
            name: 'app-config-storage',
        }
    )
);
