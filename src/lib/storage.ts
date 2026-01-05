import type { CTeData } from './pdfExtractor';

const DB_NAME = 'CTeStorage';
const DB_VERSION = 1;
const STORE_NAME = 'cteData';

interface MonthKey {
  year: number;
  month: number;
}

// Inicializar IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'monthYear' });
        objectStore.createIndex('monthYear', 'monthYear', { unique: true });
      }
    };
  });
};

// Obter chave do mês atual baseado na data de emissão do CT-e
const getMonthKey = (dataEmissao: string): MonthKey | null => {
  if (!dataEmissao) return null;
  
  // Formato esperado: DD/MM/YYYY
  const parts = dataEmissao.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  return { year, month };
};

// Obter chave do mês atual (data atual)
const getCurrentMonthKey = (): MonthKey => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
};

// Criar string de chave para o mês
const createMonthKeyString = (key: MonthKey): string => {
  return `${key.year}-${key.month.toString().padStart(2, '0')}`;
};

// Adicionar CT-e ao armazenamento
export const addCTeToStorage = async (data: CTeData): Promise<void> => {
  const monthKey = getMonthKey(data.dataEmissao) || getCurrentMonthKey();
  const monthKeyString = createMonthKeyString(monthKey);
  
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('monthYear');
    
    // Buscar dados existentes do mês
    const request = index.get(monthKeyString);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const existingData = request.result;
        let cteList: CTeData[] = [];
        
        if (existingData && existingData.cteList) {
          cteList = existingData.cteList;
        }
        
        // Adicionar novo CT-e
        cteList.push(data);
        
        // Salvar ou atualizar
        const saveRequest = store.put({ monthYear: monthKeyString, cteList });
        
        saveRequest.onsuccess = () => resolve();
        saveRequest.onerror = () => reject(saveRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erro ao adicionar CT-e ao armazenamento:', error);
    throw error;
  }
};

// Recuperar todos os CT-es do mês atual
export const getCTesFromCurrentMonth = async (): Promise<CTeData[]> => {
  const monthKey = getCurrentMonthKey();
  const monthKeyString = createMonthKeyString(monthKey);
  
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('monthYear');
    
    const request = index.get(monthKeyString);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result && result.cteList ? result.cteList : []);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erro ao recuperar CT-es do mês atual:', error);
    return [];
  }
};

// Recuperar CT-es de um mês específico
export const getCTesByMonth = async (year: number, month: number): Promise<CTeData[]> => {
  const monthKeyString = createMonthKeyString({ year, month });
  
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('monthYear');
    
    const request = index.get(monthKeyString);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result && result.cteList ? result.cteList : []);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erro ao recuperar CT-es do mês:', error);
    return [];
  }
};

// Limpar dados de um mês específico
export const clearMonthData = async (year: number, month: number): Promise<void> => {
  const monthKeyString = createMonthKeyString({ year, month });
  
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('monthYear');
    
    const request = index.get(monthKeyString);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          const deleteRequest = store.delete(monthKeyString);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Erro ao limpar dados do mês:', error);
    throw error;
  }
};

// Obter contagem de CT-es do mês atual
export const getCurrentMonthCount = async (): Promise<number> => {
  const ctes = await getCTesFromCurrentMonth();
  return ctes.length;
};

