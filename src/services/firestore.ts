import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Receipt, AppConfig } from '../types';

// Collection references
const RECEIPTS_COLLECTION = 'receipts';
const CONFIG_COLLECTION = 'config';
const CONFIG_DOC_ID = 'settings';

// ==================== Receipts ====================

export const saveReceiptToFirestore = async (receipt: Receipt): Promise<void> => {
    try {
        await setDoc(doc(db, RECEIPTS_COLLECTION, receipt.id), {
            ...receipt,
            date: Timestamp.fromDate(new Date(receipt.date))
        });
    } catch (error) {
        console.error('Error saving receipt to Firestore:', error);
        throw error;
    }
};

export const getReceiptsFromFirestore = async (): Promise<Receipt[]> => {
    try {
        const q = query(collection(db, RECEIPTS_COLLECTION), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                date: data.date.toDate().toISOString()
            } as Receipt;
        });
    } catch (error) {
        console.error('Error getting receipts from Firestore:', error);
        return [];
    }
};

export const deleteReceiptFromFirestore = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, RECEIPTS_COLLECTION, id));
    } catch (error) {
        console.error('Error deleting receipt from Firestore:', error);
        throw error;
    }
};

export const subscribeToReceipts = (callback: (receipts: Receipt[]) => void) => {
    const q = query(collection(db, RECEIPTS_COLLECTION), orderBy('date', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const receipts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                date: data.date.toDate().toISOString()
            } as Receipt;
        });
        callback(receipts);
    }, (error) => {
        console.error('Error in receipts subscription:', error);
    });
};

// ==================== Config ====================

export const saveConfigToFirestore = async (config: AppConfig): Promise<void> => {
    try {
        // Exclude logo from Firestore — base64 strings are too large for Firestore docs.
        // Logo is stored locally via Zustand persist (localStorage).
        const { logo, ...configWithoutLogo } = config as AppConfig & { logo?: string };
        void logo; // suppress unused variable warning
        await setDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID), configWithoutLogo);
    } catch (error) {
        console.error('Error saving config to Firestore:', error);
        throw error;
    }
};

export const getConfigFromFirestore = async (): Promise<AppConfig | null> => {
    try {
        const docSnap = await getDoc(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID));

        if (docSnap.exists()) {
            return docSnap.data() as AppConfig;
        }
        return null;
    } catch (error) {
        console.error('Error getting config from Firestore:', error);
        return null;
    }
};

export const subscribeToConfig = (callback: (config: AppConfig | null) => void) => {
    return onSnapshot(doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID), (doc) => {
        if (doc.exists()) {
            callback(doc.data() as AppConfig);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error('Error in config subscription:', error);
    });
};

// ==================== Migration ====================

export const migrateLocalStorageToFirestore = async () => {
    try {
        // Migrate receipts
        const receiptsData = localStorage.getItem('receipt-storage');
        if (receiptsData) {
            const parsed = JSON.parse(receiptsData);
            const history = parsed.state?.history || [];

            for (const receipt of history) {
                await saveReceiptToFirestore(receipt);
            }

            console.log(`Migrated ${history.length} receipts to Firestore`);
        }

        // Migrate config
        const configData = localStorage.getItem('config-storage');
        if (configData) {
            const parsed = JSON.parse(configData);
            const config = parsed.state;

            if (config) {
                await saveConfigToFirestore(config);
                console.log('Migrated config to Firestore');
            }
        }

        return true;
    } catch (error) {
        console.error('Error migrating data to Firestore:', error);
        return false;
    }
};
