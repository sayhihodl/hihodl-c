// src/services/api/contacts.service.ts
// Contacts API service
import { apiClient } from '@/lib/apiClient';
import type {
  Contact,
  ContactsResponse,
  CreateContactRequest,
} from '@/types/api';

/**
 * List user contacts
 */
export async function listContacts(): Promise<Contact[]> {
  const response = await apiClient.get<ContactsResponse>('/contacts');
  return response.contacts;
}

/**
 * Add contact
 */
export async function createContact(params: CreateContactRequest): Promise<Contact> {
  return apiClient.post<Contact>('/contacts', params);
}

/**
 * Delete contact
 */
export async function deleteContact(contactId: string): Promise<{ deleted: boolean }> {
  return apiClient.delete<{ deleted: boolean }>(`/contacts/${contactId}`);
}

