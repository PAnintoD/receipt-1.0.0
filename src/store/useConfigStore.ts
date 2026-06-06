import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppConfig, CustomerInfo } from '../types';
import { saveConfigToFirestore, subscribeToConfig } from '../services/firestore';

interface ConfigState extends AppConfig {
    setShopName: (name: string) => Promise<void>;
    setShopAddress: (address: string) => Promise<void>;
    setTaxId: (taxId: string) => Promise<void>;
    setFooterText: (text: string) => Promise<void>;
    setLogo: (logo: string) => Promise<void>;
    setDefaultWatermark: (text: string) => Promise<void>;
    setDefaultRemarks: (text: string) => Promise<void>;
    addCustomer: (customer: Omit<CustomerInfo, 'id'>) => Promise<void>;
    updateCustomer: (id: string, updates: Omit<CustomerInfo, 'id'>) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
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
        defaultWatermark: state.defaultWatermark,
        defaultRemarks: state.defaultRemarks,
        customers: state.customers || [],
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
            defaultWatermark: '',
            defaultRemarks: '- โปรดตรวจสอบรายละเอียดสินค้า จำนวน และเงื่อนไขก่อนยืนยันการสั่งซื้อ\n- ชำระผ่านบัญชีธนาคารตามที่ผู้เสนอราคาแจ้ง\n- ใบเสนอราคานี้มีอายุ 30 วันนับจากวันที่ออกเอกสาร',
            customers: [],

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

            setDefaultWatermark: async (text) => {
                set({ defaultWatermark: text });
                await saveConfigToFirestore(getConfigData(get()));
            },

            setDefaultRemarks: async (text) => {
                set({ defaultRemarks: text });
                await saveConfigToFirestore(getConfigData(get()));
            },

            setLogo: async (logo) => {
                // Logo is stored locally only (via Zustand persist / localStorage).
                // NOT saved to Firestore because base64 strings are too large.
                set({ logo });
            },

            addCustomer: async (customer) => {
                const trimmedName = customer.name.trim();
                const trimmedAddress = customer.address.trim();
                if (!trimmedName) return;

                const customers = get().customers || [];
                set({
                    customers: [
                        ...customers,
                        {
                            id: crypto.randomUUID(),
                            name: trimmedName,
                            address: trimmedAddress,
                        },
                    ],
                });
                await saveConfigToFirestore(getConfigData(get()));
            },

            updateCustomer: async (id, updates) => {
                const trimmedName = updates.name.trim();
                const trimmedAddress = updates.address.trim();
                if (!trimmedName) return;

                set((state) => ({
                    customers: (state.customers || []).map((customer) =>
                        customer.id === id
                            ? { ...customer, name: trimmedName, address: trimmedAddress }
                            : customer
                    ),
                }));
                await saveConfigToFirestore(getConfigData(get()));
            },

            deleteCustomer: async (id) => {
                set((state) => ({
                    customers: (state.customers || []).filter((customer) => customer.id !== id),
                }));
                await saveConfigToFirestore(getConfigData(get()));
            },

            initializeFirestore: () => {
                // Subscribe to Firestore changes
                const unsubscribe = subscribeToConfig((config) => {
                    if (config) {
                        // Don't overwrite local logo with Firestore data (which has no logo)
                        const currentLogo = get().logo;
                        set({ ...config, logo: currentLogo || config.logo || '', customers: config.customers || [] });
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
