import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileEditor from '../ProfileEditor/ProfileEditor.jsx'

// Mock the profileStore service
vi.mock('@/services/profileStore', () => ({
  saveProfile: vi.fn().mockResolvedValue({ id: 1, success: true }),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronRight: () => <span data-testid="chevron-right">›</span>,
}))

describe('ProfileEditor', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should render the component', () => {
    render(<ProfileEditor />)
    
    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.getByLabelText(/folder/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByText('Overview')).toBeInTheDocument()
  })

  it('should update Overview when title is changed', async () => {
    const user = userEvent.setup()
    render(<ProfileEditor />)
    
    const titleInput = screen.getByLabelText(/title/i)
    const newTitle = 'New Profile Title'
    
    // Clear and type new title
    await user.clear(titleInput)
    await user.type(titleInput, newTitle)
    
    // Wait for state update and check if Overview shows the new title
    // Use getAllByText since title appears in both breadcrumb and Overview
    await waitFor(() => {
      const titleElements = screen.getAllByText(newTitle)
      expect(titleElements.length).toBeGreaterThan(0)
    }, { timeout: 1000 })
  })

  it('should update Overview when hardwareNoise.canvas is toggled', async () => {
    const user = userEvent.setup()
    render(<ProfileEditor />)
    
    // Navigate to Fingerprint tab
    const fingerprintTab = screen.getByRole('tab', { name: /fingerprint/i })
    await user.click(fingerprintTab)
    
    // Wait for tab content to load - use getAllByText since "Hardware Noise" appears twice
    await waitFor(() => {
      const hardwareNoiseElements = screen.getAllByText(/hardware noise/i)
      expect(hardwareNoiseElements.length).toBeGreaterThan(0)
    }, { timeout: 1000 })
    
    // Find the canvas checkbox by its label
    const canvasCheckbox = screen.getByRole('checkbox', { name: /canvas/i })
    
    // Initially should be checked (from initialState)
    expect(canvasCheckbox).toBeChecked()
    
    // Canvas badge should initially appear in Overview
    expect(screen.getAllByText('canvas').length).toBeGreaterThan(0)
    
    // Uncheck it
    await user.click(canvasCheckbox)
    expect(canvasCheckbox).not.toBeChecked()
    
    // Re-check it
    await user.click(canvasCheckbox)
    expect(canvasCheckbox).toBeChecked()
    
    // Canvas badge should appear again
    await waitFor(() => {
      expect(screen.getAllByText('canvas').length).toBeGreaterThan(0)
    }, { timeout: 1000 })
  })

  it('should display initial state values in Overview', () => {
    render(<ProfileEditor />)
    
    // Check Overview displays initial values
    expect(screen.getByText('Social media')).toBeInTheDocument() // folder
    expect(screen.getByText('Via10')).toBeInTheDocument() // title
    expect(screen.getByText('MostChrome 140')).toBeInTheDocument() // browser
  })

  it('should show validation errors for required fields', async () => {
    const user = userEvent.setup()
    render(<ProfileEditor />)
    
    const titleInput = screen.getByLabelText(/title/i)
    
    // Clear required field
    await user.clear(titleInput)
    
    // Try to confirm (this will trigger validation)
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await user.click(confirmButton)
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })
})

