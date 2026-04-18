export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  city: 'Agra' | 'Noida' | 'Greater Noida';
  beds: number;
  baths: number;
  sqft: number;
  type: 'Apartment' | 'Villa' | 'Plot' | 'Commercial';
  image: string[];
  isFeatured?: boolean;
  expresswayProximity?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  image: string;
  rating: number;
  listingsCount: number;
  specialization: string;
}
