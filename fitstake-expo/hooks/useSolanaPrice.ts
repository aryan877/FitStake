import { useCallback, useEffect, useState } from 'react';

interface SolanaPriceData {
  price: number;
  confidence: number;
  status: string;
  lastUpdated: string;
  loading: boolean;
  error: string | null;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let cachedPrice: SolanaPriceData | null = null;
let lastFetchTime = 0;

export function useSolanaPrice() {
  const [priceData, setPriceData] = useState<SolanaPriceData>({
    price: 0,
    confidence: 0,
    status: '',
    lastUpdated: '',
    loading: true,
    error: null,
  });

  const fetchSolanaPrice = useCallback(async (forceRefresh = false) => {
    // Return cached price if valid and not forcing refresh
    const now = Date.now();
    if (!forceRefresh && cachedPrice && now - lastFetchTime < CACHE_DURATION) {
      setPriceData(cachedPrice);
      return cachedPrice;
    }

    setPriceData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Dynamic import to avoid issues with React Native environment
      const { HermesClient } = await import('@pythnetwork/hermes-client');

      // Create a Hermes client with the Pyth Network's public endpoint
      const hermesClient = new HermesClient('https://hermes.pyth.network', {});

      // Get SOL price feeds
      const solPriceFeeds = await hermesClient.getPriceFeeds({
        query: 'sol',
        assetType: 'crypto',
      });

      if (solPriceFeeds.length === 0) {
        throw new Error('Could not find SOL price feed');
      }

      // Find the SOL/USD feed
      const solUsd = solPriceFeeds.find(
        (feed) => feed.attributes.display_symbol === 'SOL/USD'
      );

      if (!solUsd) {
        throw new Error('Could not find SOL/USD price feed');
      }

      // Get latest price update using the SOL/USD ID
      const priceIds = [solUsd.id];
      const priceUpdates = await hermesClient.getLatestPriceUpdates(priceIds, {
        parsed: true,
      });

      if (
        priceUpdates &&
        priceUpdates.parsed &&
        priceUpdates.parsed.length > 0
      ) {
        // Extract SOL price data from the parsed field
        const solData = priceUpdates.parsed[0];
        const priceValue =
          Number(solData.price.price) *
          Math.pow(10, Number(solData.price.expo));
        const confidenceValue =
          Number(solData.price.conf) * Math.pow(10, Number(solData.price.expo));
        const timestamp = new Date(
          Number(solData.price.publish_time) * 1000
        ).toISOString();

        const newPriceData: SolanaPriceData = {
          price: priceValue,
          confidence: confidenceValue,
          status: solData.price.status?.toString() || 'Trading',
          lastUpdated: timestamp,
          loading: false,
          error: null,
        };

        // Update the cached price and timestamp
        cachedPrice = newPriceData;
        lastFetchTime = now;

        setPriceData(newPriceData);
        return newPriceData;
      } else {
        throw new Error('SOL price data not available');
      }
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      setPriceData((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return null;
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchSolanaPrice();
  }, [fetchSolanaPrice]);

  return {
    ...priceData,
    refresh: () => fetchSolanaPrice(true),
    formatUSD: (solAmount: number) => {
      if (priceData.price && solAmount) {
        return (solAmount * priceData.price).toFixed(2);
      }
      return '0.00';
    },
  };
}
