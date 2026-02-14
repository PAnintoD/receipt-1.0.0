import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

const LOGO_PATH = 'logos/shop-logo';

/**
 * Upload a logo file to Firebase Storage and return the download URL.
 * Replaces any existing logo at the same path.
 */
export const uploadLogo = async (file: File): Promise<string> => {
    try {
        const storageRef = ref(storage, LOGO_PATH);
        const snapshot = await uploadBytes(storageRef, file, {
            contentType: file.type,
        });
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading logo:', error);
        throw error;
    }
};

/**
 * Delete the current logo from Firebase Storage.
 */
export const deleteLogo = async (): Promise<void> => {
    try {
        const storageRef = ref(storage, LOGO_PATH);
        await deleteObject(storageRef);
    } catch (error: any) {
        // Ignore "object-not-found" errors (logo was already deleted or never existed)
        if (error?.code === 'storage/object-not-found') {
            return;
        }
        console.error('Error deleting logo:', error);
        throw error;
    }
};
