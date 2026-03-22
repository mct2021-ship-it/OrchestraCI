export interface CarbonCoefficient {
  id: string;
  category: 'Digital' | 'Physical' | 'Logistics' | 'Human' | 'Infrastructure';
  label: string;
  value: number; // kg CO2e
  unit: string;
  description: string;
}

export const carbonLibrary: CarbonCoefficient[] = [
  // Digital
  { id: 'c_dig_1', category: 'Digital', label: 'Email Sent', value: 0.004, unit: 'per email', description: 'Average carbon footprint of sending one email.' },
  { id: 'c_dig_2', category: 'Digital', label: 'Web Page View', value: 0.0005, unit: 'per view', description: 'Estimated energy used by servers and network for a single page load.' },
  { id: 'c_dig_3', category: 'Digital', label: 'Video Stream (HD)', value: 0.1, unit: 'per hour', description: 'Carbon impact of streaming 1 hour of high-definition video.' },
  { id: 'c_dig_4', category: 'Digital', label: 'Cloud Storage (1GB)', value: 0.01, unit: 'per month', description: 'Monthly carbon cost of storing 1GB of data in a green data center.' },
  
  // Physical
  { id: 'c_phy_1', category: 'Physical', label: 'Paper Letter', value: 0.02, unit: 'per letter', description: 'Production and delivery of a standard paper letter.' },
  { id: 'c_phy_2', category: 'Physical', label: 'Plastic Packaging (Small)', value: 0.05, unit: 'per item', description: 'Manufacturing cost of a small plastic mailer.' },
  { id: 'c_phy_3', category: 'Physical', label: 'Cardboard Box (Medium)', value: 0.15, unit: 'per box', description: 'Production of a medium-sized recycled cardboard box.' },
  
  // Logistics
  { id: 'c_log_1', category: 'Logistics', label: 'Last-Mile Delivery (EV)', value: 0.05, unit: 'per km', description: 'Delivery via electric vehicle.' },
  { id: 'c_log_2', category: 'Logistics', label: 'Last-Mile Delivery (Van)', value: 0.25, unit: 'per km', description: 'Delivery via standard diesel/petrol van.' },
  { id: 'c_log_3', category: 'Logistics', label: 'Air Freight (Short Haul)', value: 1.2, unit: 'per ton-km', description: 'High-impact transport via air.' },
  
  // Human / Office
  { id: 'c_hum_1', category: 'Human', label: 'Office Desk Space', value: 0.5, unit: 'per day', description: 'Energy, heating, and lighting for one employee in a standard office.' },
  { id: 'c_hum_2', category: 'Human', label: 'Commute (Average)', value: 2.5, unit: 'per day', description: 'Average daily commute impact across various transport modes.' },
  
  // Infrastructure
  { id: 'c_inf_1', category: 'Infrastructure', label: 'Server Instance (Small)', value: 0.02, unit: 'per hour', description: 'Running a small cloud server instance.' },
  { id: 'c_inf_2', category: 'Infrastructure', label: 'Data Center Cooling', value: 0.005, unit: 'per kWh', description: 'Overhead for cooling and power distribution.' }
];
