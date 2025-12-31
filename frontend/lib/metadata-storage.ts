// Service Metadata Storage (localStorage + IPFS)

export interface ServiceMetadata {
  name: string;
  description: string;
  image: string;
  brand: string;
  category?: string;
  tokenId?: number;
  ipfsCid?: string;
  ipfsUrl?: string;
}

const STORAGE_KEY = 'servicefi_metadata';

export const saveServiceMetadata = (tokenId: number, metadata: ServiceMetadata) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data[tokenId] = { ...metadata, tokenId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving metadata:', error);
  }
};

export const getServiceMetadata = (tokenId: number): ServiceMetadata | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    return data[tokenId] || null;
  } catch (error) {
    console.error('Error getting metadata:', error);
    return null;
  }
};

export const getAllServiceMetadata = (): Record<number, ServiceMetadata> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error getting all metadata:', error);
    return {};
  }
};

export const uploadMetadataToIPFS = async (metadata: Omit<ServiceMetadata, 'ipfsCid' | 'ipfsUrl'>): Promise<ServiceMetadata> => {
  try {
    const response = await fetch('/api/upload-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error('Failed to upload metadata to IPFS');
    }

    const result = await response.json();

    return {
      ...metadata,
      ipfsCid: result.cid,
      ipfsUrl: result.ipfsUrl,
    };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
};
