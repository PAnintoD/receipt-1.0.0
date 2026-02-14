import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppConfig } from '../types';
import { saveConfigToFirestore, subscribeToConfig } from '../services/firestore';

interface ConfigState extends AppConfig {
    setShopName: (name: string) => Promise<void>;
    setShopAddress: (address: string) => Promise<void>;
    setTaxId: (taxId: string) => Promise<void>;
    setFooterText: (text: string) => Promise<void>;
    setLogo: (logo: string) => Promise<void>;
    initializeFirestore: () => (() => void);
}

/** Extract only the plain data fields from the store state (no functions). */
function getConfigData(state: ConfigState): AppConfig {
    return {
        shopName: state.shopName,
        shopAddress: state.shopAddress,
        taxId: state.taxId,
        logo: state.logo,
        footerText: state.footerText,
    };
}

export const useConfigStore = create<ConfigState>()(
    persist(
        (set, get) => ({
            shopName: 'Stationery Plus',
            shopAddress: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
            taxId: '0-1234-56789-01-2',
            footerText: 'ขอบคุณที่ใช้บริการ',
            logo: '',

            setShopName: async (name) => {
                set({ shopName: name });
                await saveConfigToFirestore(getConfigData(get()));
            },

            setShopAddress: async (address) => {
                set({ shopAddress: address });
                await saveConfigToFirestore(getConfigData(get()));
            },

            setTaxId: async (taxId) => {
                set({ taxId });
                await saveConfigToFirestore(getConfigData(get()));
            },

            setFooterText: async (text) => {
                set({ footerText: text });
                await saveConfigToFirestore(getConfigData(get()));
            },

            setLogo: async (logo) => {
                // Logo is stored locally only (via Zustand persist / localStorage).
                // NOT saved to Firestore because base64 strings are too large.
                set({ logo });
            },

            initializeFirestore: () => {
                // Subscribe to Firestore changes
                const unsubscribe = subscribeToConfig((config) => {
                    if (config) {
                        // Don't overwrite local logo with Firestore data (which has no logo)
                        const currentLogo = get().logo;
                        set({ ...config, logo: currentLogo || config.logo || '' });
                    }
                });

                return unsubscribe;
            },
        }),
        {
            name: 'config-storage',
        }
    )
);
