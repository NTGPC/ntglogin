import type { ProfileState } from '@/types/profile'

/**
 * Mock profile storage service
 * This is a mock implementation for future automation
 * Does not interact with real backend
 */

// Mock storage (in-memory, could be replaced with localStorage or API later)
const mockStorage = new Map<number, ProfileState>()

/**
 * Load a profile by ID
 * @param {number} id - Profile ID
 * @returns {Promise<ProfileState | null>} Profile data or null if not found
 */
export async function loadProfile(id: number): Promise<ProfileState | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100))
  
  const profile = mockStorage.get(id)
  return profile || null
}

/**
 * Save a profile
 * @param {ProfileState} profile - Profile data to save
 * @param {number} [id] - Optional profile ID (if not provided, generates new ID)
 * @returns {Promise<{ id: number; success: boolean }>} Save result with profile ID
 */
export async function saveProfile(
  profile: ProfileState,
  id?: number
): Promise<{ id: number; success: boolean }> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))
  
  // Generate ID if not provided
  const profileId = id || Date.now()
  
  // Validate required fields
  if (!profile.folder || !profile.title) {
    throw new Error('Folder and title are required')
  }
  
  // Save to mock storage
  mockStorage.set(profileId, { ...profile })
  
  console.log('[profileStore] Saved profile:', {
    id: profileId,
    title: profile.title,
    folder: profile.folder,
  })
  
  return {
    id: profileId,
    success: true,
  }
}

/**
 * Delete a profile by ID
 * @param {number} id - Profile ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteProfile(id: number): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  
  const deleted = mockStorage.delete(id)
  console.log('[profileStore] Deleted profile:', id)
  
  return deleted
}

/**
 * List all profiles
 * @returns {Promise<Array<{ id: number; profile: ProfileState }>>} List of profiles
 */
export async function listProfiles(): Promise<Array<{ id: number; profile: ProfileState }>> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  
  return Array.from(mockStorage.entries()).map(([id, profile]) => ({
    id,
    profile,
  }))
}

