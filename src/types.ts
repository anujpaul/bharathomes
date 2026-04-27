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
  agentId: string [];
  isFeatured?: boolean;
  expresswayProximity?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  phone: string;
  image: string;
  rating: number;
  listingsCount: number;
  specialization: string;
}

export interface UserClaim {
  typ: string;
  val: string;
}

export interface AuthResponse {
  access_token: string;
  expires_on: string;
  id_token?: string; // Optional, as you might not always have this
  provider_name?: string;
  user_claims: UserClaim[];
  user_id: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photo: string;
  phone?: string;
  provider: 'google' | 'local' | 'microsoft';
  createdAt: string;
  savedPropertyIds: string[];
  savedCount: number;
  enquiriesCount: number;
}