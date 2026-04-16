export interface CarbonCoefficient {
  id: string;
  category: 'Digital' | 'Physical' | 'Logistics' | 'Human' | 'Infrastructure' | 'Energy' | 'Materials';
  label: string;
  value: number; // kg CO2e
  unit: string;
  description: string;
  source?: string;
}

export const carbonLibrary: CarbonCoefficient[] = [
  // Digital & IT (Based on Shift Project & Green Web Foundation)
  { id: 'c_dig_1', category: 'Digital', label: 'Standard Email', value: 0.004, unit: 'per email', description: 'Average carbon footprint of sending one standard email without attachments.', source: 'Berners-Lee, 2010' },
  { id: 'c_dig_1a', category: 'Digital', label: 'Email with Attachment (1MB)', value: 0.050, unit: 'per email', description: 'Average carbon footprint of sending an email with a 1MB attachment.', source: 'Berners-Lee, 2010' },
  { id: 'c_dig_2', category: 'Digital', label: 'Web Page View', value: 0.0005, unit: 'per view', description: 'Estimated energy used by servers and network for a single page load (approx 2MB).', source: 'Green Web Foundation' },
  { id: 'c_dig_3', category: 'Digital', label: 'Video Stream (HD)', value: 0.055, unit: 'per hour', description: 'Carbon impact of streaming 1 hour of high-definition video.', source: 'Carbon Trust, 2021' },
  { id: 'c_dig_4', category: 'Digital', label: 'Cloud Storage (1GB)', value: 0.002, unit: 'per month', description: 'Monthly carbon cost of storing 1GB of data in a modern data center.', source: 'IEA, 2022' },
  { id: 'c_dig_5', category: 'Digital', label: 'Video Conference (1 hour)', value: 0.157, unit: 'per participant', description: 'Carbon footprint of a 1-hour video call per participant.', source: 'Purdue University, 2021' },
  { id: 'c_dig_6', category: 'Digital', label: 'AI Query (LLM)', value: 0.004, unit: 'per query', description: 'Estimated carbon cost of a single large language model inference.', source: 'Google Research, 2023' },
  { id: 'c_dig_7', category: 'Digital', label: 'PDF Download (5MB)', value: 0.008, unit: 'per download', description: 'Energy for transfer and storage of a 5MB PDF document.', source: 'GreenIT' },
  { id: 'c_dig_8', category: 'Digital', label: 'SMS Message', value: 0.000014, unit: 'per SMS', description: 'Extremely low impact of a standard text message.', source: 'Berners-Lee' },
  { id: 'c_dig_9', category: 'Digital', label: 'Data Transfer (1GB)', value: 0.06, unit: 'per GB', description: 'Average network energy for 1GB of data transfer.', source: 'Cloud Carbon Footprint' },
  
  // Physical & Print
  { id: 'c_phy_1', category: 'Physical', label: 'Paper Letter (Standard)', value: 0.029, unit: 'per letter', description: 'Production, printing, and delivery of a standard paper letter.', source: 'UK DEFRA' },
  { id: 'c_phy_2', category: 'Physical', label: 'Plastic Packaging (Small)', value: 0.050, unit: 'per item', description: 'Manufacturing cost of a small plastic mailer (LDPE).', source: 'Ecoinvent' },
  { id: 'c_phy_3', category: 'Physical', label: 'Cardboard Box (Medium)', value: 0.150, unit: 'per box', description: 'Production of a medium-sized recycled cardboard box.', source: 'Ecoinvent' },
  { id: 'c_phy_4', category: 'Physical', label: 'A4 Paper (1 Sheet)', value: 0.004, unit: 'per sheet', description: 'Production of one sheet of standard A4 printer paper.', source: 'UK DEFRA' },
  { id: 'c_phy_5', category: 'Physical', label: 'Glossy Brochure (16pg)', value: 0.180, unit: 'per brochure', description: 'High-quality printing and paper for a marketing brochure.', source: 'UK DEFRA' },
  { id: 'c_phy_6', category: 'Physical', label: 'Bubble Wrap (1m)', value: 0.080, unit: 'per meter', description: 'Production of 1 meter of standard plastic bubble wrap.', source: 'Ecoinvent' },
  
  // Logistics & Transport (Based on UK DEFRA / EPA standards)
  { id: 'c_log_1', category: 'Logistics', label: 'Last-Mile Delivery (EV)', value: 0.047, unit: 'per km', description: 'Delivery via electric vehicle (average grid mix).', source: 'UK DEFRA, 2023' },
  { id: 'c_log_2', category: 'Logistics', label: 'Last-Mile Delivery (Diesel Van)', value: 0.246, unit: 'per km', description: 'Delivery via standard diesel van.', source: 'UK DEFRA, 2023' },
  { id: 'c_log_3', category: 'Logistics', label: 'Air Freight (Short Haul)', value: 1.13, unit: 'per ton-km', description: 'High-impact transport via air freight.', source: 'UK DEFRA, 2023' },
  { id: 'c_log_4', category: 'Logistics', label: 'HGV Freight (Articulated)', value: 0.08, unit: 'per ton-km', description: 'Heavy goods vehicle transport.', source: 'UK DEFRA, 2023' },
  { id: 'c_log_5', category: 'Logistics', label: 'Customer Return (Average)', value: 1.2, unit: 'per return', description: 'Estimated impact of a standard e-commerce return (shipping + processing).', source: 'Optoro' },
  { id: 'c_log_6', category: 'Logistics', label: 'Passenger Flight (Short)', value: 150, unit: 'per flight', description: 'Average short-haul flight (approx 500km) per passenger.', source: 'ICAO' },
  
  // Human & Office
  { id: 'c_hum_1', category: 'Human', label: 'Office Desk Space', value: 1.2, unit: 'per day', description: 'Energy, heating, and lighting for one employee in a standard office.', source: 'CIBSE' },
  { id: 'c_hum_2', category: 'Human', label: 'Commute (Average Car)', value: 2.8, unit: 'per day', description: 'Average daily commute impact (approx 15km round trip in average car).', source: 'EPA' },
  { id: 'c_hum_3', category: 'Human', label: 'Commute (Public Transit)', value: 0.8, unit: 'per day', description: 'Average daily commute impact using bus or train.', source: 'EPA' },
  { id: 'c_hum_4', category: 'Human', label: 'Phone Call (Mobile)', value: 0.0002, unit: 'per minute', description: 'Energy used by phone and network for a mobile call.', source: 'Berners-Lee' },
  { id: 'c_hum_5', category: 'Human', label: 'Store Visit (Physical)', value: 0.45, unit: 'per visit', description: 'Estimated energy for lighting/HVAC per customer visit.', source: 'MIT' },
  
  // Infrastructure & Energy
  { id: 'c_inf_1', category: 'Infrastructure', label: 'Server Instance (Small)', value: 0.015, unit: 'per hour', description: 'Running a small cloud server instance (average grid).', source: 'Teads Engineering' },
  { id: 'c_inf_2', category: 'Energy', label: 'Electricity (Global Average)', value: 0.436, unit: 'per kWh', description: 'Global average carbon intensity of electricity generation.', source: 'IEA, 2022' },
  { id: 'c_inf_3', category: 'Energy', label: 'Electricity (Renewable)', value: 0.015, unit: 'per kWh', description: 'Lifecycle emissions of wind/solar generation.', source: 'IPCC' },
  { id: 'c_inf_4', category: 'Energy', label: 'Natural Gas Heating', value: 0.18, unit: 'per kWh', description: 'Combustion of natural gas for space heating.', source: 'UK DEFRA' }
];
