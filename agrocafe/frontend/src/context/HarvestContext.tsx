"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';

export interface Farm {
  id: string;
  name: string;
  total_area_hectares: number;
  city?: string;
  state?: string;
}

export interface Harvest {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  status: string;
  notes?: string;
  farm?: Farm;
}

interface HarvestContextType {
  farms: Farm[];
  selectedFarm: Farm | null;
  harvests: Harvest[];
  selectedHarvest: Harvest | null;
  activeOpenHarvest: Harvest | null; // A safra que está com status "Aberta"
  loading: boolean;
  hasOpenHarvest: boolean;
  selectFarm: (farmId: string) => void;
  selectHarvest: (harvestId: string) => void;
  refreshHarvests: () => Promise<void>;
}

const HarvestContext = createContext<HarvestContextType | undefined>(undefined);

export function HarvestProvider({ children }: { children: React.ReactNode }) {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [selectedHarvest, setSelectedHarvest] = useState<Harvest | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHarvestsForFarm = async (farmId: string) => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      if (!token) return;
      const data = await api.get(`/harvests/farm/${farmId}`, token);
      setHarvests(data);
      
      const active = data.find((h: Harvest) => h.is_active);
      if (active) {
        setSelectedHarvest(active);
      } else if (data.length > 0) {
        setSelectedHarvest(data[0]);
      } else {
        setSelectedHarvest(null);
      }
    } catch (err) {
      console.error("Erro ao buscar safras da fazenda:", err);
    }
  };

  const loadFarmsAndHarvests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("@AgroCafe:token");
      if (!token) {
        setLoading(false);
        return;
      }
      
      const farmData = await api.get('/farms', token);
      setFarms(farmData);
      
      if (farmData && farmData.length > 0) {
        const savedFarmId = localStorage.getItem("@AgroCafe:selectedFarmId");
        const farm = farmData.find((f: Farm) => f.id === savedFarmId) || farmData[0];
        setSelectedFarm(farm);
        localStorage.setItem("@AgroCafe:selectedFarmId", farm.id);
        
        await fetchHarvestsForFarm(farm.id);
      } else {
        setSelectedFarm(null);
        setHarvests([]);
        setSelectedHarvest(null);
      }
    } catch (err) {
      console.error("Erro ao carregar safras e fazendas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarmsAndHarvests();
  }, []);

  const selectFarm = async (farmId: string) => {
    const farm = farms.find(f => f.id === farmId);
    if (farm) {
      setSelectedFarm(farm);
      localStorage.setItem("@AgroCafe:selectedFarmId", farm.id);
      setLoading(true);
      await fetchHarvestsForFarm(farm.id);
      setLoading(false);
    }
  };

  const selectHarvest = (harvestId: string) => {
    const harvest = harvests.find(h => h.id === harvestId);
    if (harvest) {
      setSelectedHarvest(harvest);
    }
  };

  // A safra com status "Aberta" (pode lançar novos registros)
  const activeOpenHarvest = harvests.find(h => h.status === 'Aberta') || null;
  const hasOpenHarvest = !!activeOpenHarvest;

  return (
    <HarvestContext.Provider value={{
      farms,
      selectedFarm,
      harvests,
      selectedHarvest,
      activeOpenHarvest,
      loading,
      hasOpenHarvest,
      selectFarm,
      selectHarvest,
      refreshHarvests: loadFarmsAndHarvests,
    }}>
      {children}
    </HarvestContext.Provider>
  );
}

export function useHarvest() {
  const context = useContext(HarvestContext);
  if (context === undefined) {
    throw new Error('useHarvest must be used within a HarvestProvider');
  }
  return context;
}
