import { db } from '../lib/firebase';
import { collection, query, getDocs, writeBatch, doc, updateDoc, onSnapshot, orderBy, runTransaction, deleteDoc, setDoc } from 'firebase/firestore';
import { HomepageSection } from '../../types';

export const FeaturedSectionService = {
    subscribeToSections: (callback: (sections: HomepageSection[]) => void) => {
        const q = query(collection(db, 'homepage_sections'), orderBy('priority', 'asc'));
        return onSnapshot(q, (snapshot) => {
            const sections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HomepageSection));
            callback(sections);
        });
    },

    addSection: async (section: HomepageSection): Promise<void> => {
        const docRef = doc(db, 'homepage_sections', section.id);
        await setDoc(docRef, section);
    },

    updateSection: async (sectionId: string, updates: Partial<HomepageSection>): Promise<void> => {
        const docRef = doc(db, 'homepage_sections', sectionId);
        await updateDoc(docRef, updates);
    },

    deleteSection: async (sectionId: string): Promise<void> => {
        await deleteDoc(doc(db, 'homepage_sections', sectionId));
    },

    reorderSections: async (sections: HomepageSection[]): Promise<void> => {
        const batch = writeBatch(db);
        sections.forEach((section, index) => {
            const docRef = doc(db, 'homepage_sections', section.id);
            batch.update(docRef, { priority: index });
        });
        await batch.commit();
    },

    toggleSectionStatus: async (sectionId: string, isActive: boolean): Promise<void> => {
        const docRef = doc(db, 'homepage_sections', sectionId);
        await updateDoc(docRef, { isActive });
    }
};
