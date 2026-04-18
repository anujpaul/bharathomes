import { Property, Agent } from './types';

export const PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Luxury 4BHK Penthouse',
    price: 45000000,
    location: 'Sector 150, Noida Expressway',
    city: 'Noida',
    beds: 4,
    baths: 4,
    sqft: 3200,
    type: 'Apartment',
    image: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'],
    isFeatured: true,
    expresswayProximity: true,
  },
];

export const AGENTS: Agent[] = [
  {
    id: 'a1',
    name: 'Amit Paul',
    role: 'Senior Property Consultant',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    rating: 4.9,
    listingsCount: 45,
    specialization: 'Luxury Apartments, Noida',
  },
  {
    id: 'a2',
    name: 'Anuj Paul',
    role: 'Real Estate Advisor',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    rating: 4.8,
    listingsCount: 32,
    specialization: 'Villas & Plots, Agra',
  },
  {
    id: 'a3',
    name: 'Priya Verma',
    role: 'Commercial Specialist',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    rating: 4.7,
    listingsCount: 28,
    specialization: 'Greater Noida Express Highway',
  },
];
