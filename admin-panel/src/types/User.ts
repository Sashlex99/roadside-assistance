export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  phoneVerified: boolean;
  userType: 'client' | 'driver';
  createdAt: Date;
  companyInfo?: {
    name: string;
    bulstat: string;
  };
  documents?: {
    roadsideAssistanceCert: string;
    iaalaLicense: string;
    driverPhoto: string;
  };
  documentsStatus?: {
    roadsideAssistanceCert: 'pending' | 'approved' | 'rejected';
    iaalaLicense: 'pending' | 'approved' | 'rejected';
    driverPhoto: 'pending' | 'approved' | 'rejected';
  };
  documentsVerifiedAt?: {
    roadsideAssistanceCert?: Date;
    iaalaLicense?: Date;
    driverPhoto?: Date;
  };
  documentsRejectionReasons?: {
    roadsideAssistanceCert?: string;
    iaalaLicense?: string;
    driverPhoto?: string;
  };
  status?: 'pending' | 'approved' | 'rejected';
  isActive?: boolean;
}

export interface UserTableRow {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  phoneVerified: boolean;
  userType: 'client' | 'driver';
  createdAt: string;
  status?: string;
  isActive?: boolean;
  companyName?: string;
  bulstat?: string;
} 