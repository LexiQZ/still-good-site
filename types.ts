
export interface StrategyOption {
  id: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  risk: 'Low' | 'Medium' | 'High';
  speed: 'Fast' | 'Moderate' | 'Slow';
  margin: 'High' | 'Medium' | 'Low';
}

export interface Phase {
  number: number;
  title: string;
  items: string[];
  duration: string;
}

export interface InventoryStat {
  category: string;
  count: number;
  color: string;
}
