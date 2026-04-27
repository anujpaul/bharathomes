import { Property, Agent } from './types';

export const PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Luxury 4BHK Penthouse',
    price: 45000000,
    location: 'Sector 150, Noida Expressway',
    city: 'Noida',
    beds: 4,
    agentId: [""],
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
    phone: "",
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    rating: 4.9,
    listingsCount: 45,
    specialization: 'Luxury Apartments, Noida',
  }
];
