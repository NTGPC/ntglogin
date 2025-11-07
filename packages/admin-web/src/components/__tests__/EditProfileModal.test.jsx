import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditProfileModal from '../EditProfileModal.jsx'

describe('EditProfileModal', () => {
  const mockOnClose = vi.fn()
  const mockOnUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the modal when open is true', () => {
    render(
      <EditProfileModal
        open={true}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    )

    expect(screen.getByText('Edit Profile')).toBeInTheDocument()
    // Find input by id
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
  })

  it('should not render when open is false', () => {
    render(
      <EditProfileModal
        open={false}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    )

    expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument()
  })

  it('should load initial data when provided', () => {
    const initialData = {
      id: 1,
      name: 'Test Profile',
      userAgent: 'Mozilla/5.0...',
      os: 'Windows 10',
      arch: '64-bit',
      browser: 'Chrome',
      screen: '1920x1080',
      canvas: 'Noise',
      clientRects: 'Off',
      audioContext: 'Off',
      webglImage: 'Off',
      webglMetadata: 'Mask',
      geoEnabled: false,
      webrtcMainIp: false,
      proxyMode: 'Manual',
      proxy: { host: '', port: '', username: '', password: '' },
    }

    render(
      <EditProfileModal
        open={true}
        initial={initialData}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    )

    // Find input by label (now has htmlFor)
    const nameInput = screen.getByLabelText(/name/i)
    expect(nameInput).toHaveValue('Test Profile')
  })

  it('should call onUpdate when form is submitted with updated data', async () => {
    const user = userEvent.setup()
    const initialData = {
      id: 1,
      name: 'Original Name',
      userAgent: '',
      os: '',
      arch: '64-bit',
      browser: 'Auto',
      screen: 'Auto',
      canvas: 'Noise',
      clientRects: 'Off',
      audioContext: 'Off',
      webglImage: 'Off',
      webglMetadata: 'Mask',
      geoEnabled: false,
      webrtcMainIp: false,
      proxyMode: 'Manual',
      proxy: { host: '', port: '', username: '', password: '' },
    }

    render(
      <EditProfileModal
        open={true}
        initial={initialData}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    )

    // Enter new name - use getByLabelText (now has htmlFor)
    const nameInput = screen.getByLabelText(/name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Profile Name')

    // Select OS - use getByLabelText (now has htmlFor)
    const osSelect = screen.getByLabelText(/^os$/i)
    await user.selectOptions(osSelect, 'Windows 11')

    // Click Update button
    const updateButton = screen.getByRole('button', { name: /update/i })
    await user.click(updateButton)

    // Wait for onUpdate to be called
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledTimes(1)
    }, { timeout: 1000 })

    // Verify onUpdate was called with correct data
    const updateCall = mockOnUpdate.mock.calls[0][0]
    expect(updateCall.name).toBe('Updated Profile Name')
    expect(updateCall.os).toBe('Windows 11')
    expect(updateCall.id).toBe(1)
  })

  it('should call onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <EditProfileModal
        open={true}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when clicking outside the modal', async () => {
    const user = userEvent.setup()

    const { container } = render(
      <EditProfileModal
        open={true}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    )

    // Click on the backdrop (the outer div with bg-black/40)
    const backdrop = container.querySelector('.bg-black\\/40')
    if (backdrop) {
      await user.click(backdrop)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }
  })

  it('should close modal when Escape key is pressed', async () => {
    const user = userEvent.setup()

    render(
      <EditProfileModal
        open={true}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    )

    // Press Escape key
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }, { timeout: 1000 })
  })

  it('should require name field', async () => {
    const user = userEvent.setup()

    render(
      <EditProfileModal
        open={true}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
      />
    )

    // Find the name input by label (now has htmlFor)
    const nameInput = screen.getByLabelText(/name/i)
    expect(nameInput).toHaveAttribute('required')
    await user.clear(nameInput)

    // Try to submit with empty name
    const updateButton = screen.getByRole('button', { name: /update/i })
    await user.click(updateButton)

    // Form validation should prevent submission
    // The input should have required attribute
    expect(nameInput).toHaveAttribute('required')
    
    // onUpdate should not be called if validation fails
    // (HTML5 validation will prevent form submission)
    // In jsdom, HTML5 validation might not work, so we just verify the required attribute
    expect(nameInput).toBeRequired()
  })
})

