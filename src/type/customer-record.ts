export interface PersistedCustomer {
  customer_id: string;
  name: string;
  phone: number;
  email?: string;
  address?: string;

  createdAt?: string;
  updatedAt?: string;
}

export type CreateCustomerInput = {
  name: string;
  phone: number;
  email?: string;
  address?: string;
};

