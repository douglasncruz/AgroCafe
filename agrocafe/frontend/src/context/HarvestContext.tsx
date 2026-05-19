"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';

interface Harvest {
  id: string;
  name: string;
  year: number;
  is_active: boolean;
  status: string; // 'Aberta' | 'Encerrada' | 'Arquivada'
  start_date: string;
  end_date: string | null;
  notes: string | null;
}

interface HarvestContextType {
  harvests: Harvest[];
  selectedHarvest: Harvest | null;
  activeOpenHarvest: Harvest | null; // A safra que está com status "Aberta"
  loading: boolean;
  hasOpenHarvest: boolean;
  selectHarvest: (harvestId: string) => void;
  refreshHarvests: () => Promise<void>;
}

const HarvestContext = createContext<HarvestContextType | undefined>(undefined);

export function HarvestProvider({ children }: { children: React.ReactNode }) {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [selectedHarvest, setSelectedHarvest] = useState<Harvest | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHarvests = async () => {
    try {
      const token = localStorage.getItem("@AgroCafe:token");
      if (!token) {
        setLoading(false);
        return;
      }
      
      // Buscamos a fazenda do usuário
      const farms = await api.get('/farms', token);
      if (farms && farms.length > 0) {
        const farmId = farms[0].id;
        const data = await api.get(`/harvests/farm/${farmId}`, token);
        setHarvests(data);
        
        // Se houver uma safra ativa, seleciona ela por padrão
        const active = data.find((h: Harvest) => h.is_active);
        if (active) {
          setSelectedHarvest(active);
        } else if (data.length > 0) {
          setSelectedHarvest(data[0]);
        } else {
          setSelectedHarvest(null);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar safras:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHarvests();
  }, []);

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
      harvests,
      selectedHarvest,
      activeOpenHarvest,
      loading,
      hasOpenHarvest,
      selectHarvest,
      refreshHarvests: fetchHarvests,
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
