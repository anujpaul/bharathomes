export interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  city?: string;         // free text, e.g. "Noida"
  state?: string;        // e.g. "Uttar Pradesh"
  pincode?: string;
  beds: number;
  baths: number;
  listedSince?: string;
  sqft: number;
  type: 'Apartment' | 'Villa' | 'Plot' | 'Commercial';
  images: string[];
  listerId: string;        
  agentId: string [];
  amenities: string[];
  builtYear?: number;
  // Single value matching the backend column. Backfilled rows default to
  // 'sell'. ('buy' is a route name in the navbar; the stored value is 'sell'.)
  listingIntent?: 'sell' | 'rent';
  isFeatured?: boolean;
  expresswayProximity?: boolean;
  agents?: Agent[];
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  phone: string;
  userPhoto: string;
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

// export type UserType     = 'buyer' | 'seller' | 'agent' | 'hybrid';
export type KycStatus  = 'pending' | 'submitted' | 'verified' | 'rejected';
export type UserRole = 
  | 'buyer'       // only browses, never lists
  | 'owner'       // lists their own property
  | 'agent'       // licensed broker, RERA required
  | 'builder'     // construction company, RERA + GST required
  | 'developer'   // real estate developer, RERA + GST required
  | 'hybrid';     // both buyer and seller

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photo: string;
  phone?: string;
  userRole?: UserRole;
  propertiesListed: number;
  kycStatus: KycStatus;
  userPhoto?: string;
  isPaid: boolean;
  subscriptionExpiry?: string | null;
  subscriptionStartedAt?: string | null;
  currentPlanCode?: string | null;          // e.g. 'pro_yearly'
  currentPlanTier?: 'basic' | 'pro' | null;
  provider: 'google' | 'local' | 'microsoft' | 'hybrid';
  createdAt: string;
  savedPropertyIds: string[];
  savedCount: number;
  enquiriesCount: number;
  rating: number;
  listingsCount: number;
}

export type VastuOrientation =
  | 'North'
  | 'South'
  | 'East'
  | 'West'
  | 'NorthEast'
  | 'NorthWest'
  | 'SouthEast'
  | 'SouthWest';