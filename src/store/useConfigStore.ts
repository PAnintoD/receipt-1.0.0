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
                await saveConfigToFirestore(get());
            },

            setShopAddress: async (address) => {
                set({ shopAddress: address });
                await saveConfigToFirestore(get());
            },

            setTaxId: async (taxId) => {
                set({ taxId });
                await saveConfigToFirestore(get());
            },

            setFooterText: async (text) => {
                set({ footerText: text });
                await saveConfigToFirestore(get());
            },

            setLogo: async (logo) => {
                set({ logo });
                await saveConfigToFirestore(get());
            },

            initializeFirestore: () => {
                // Subscribe to Firestore changes
                const unsubscribe = subscribeToConfig((config) => {
                    if (config) {
                        set(config);
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
