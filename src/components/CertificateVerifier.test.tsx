import { render, screen } from '@testing-library/react'
import axios from 'axios'
import { expect, test, vi } from 'vitest'
import CertificateVerifier from './CertificateVerifier'

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
        isAxiosError: vi.fn(() => false),
    },
}))

test('shows every field returned for a verified certificate', async () => {
    window.history.replaceState({}, '', '/?key=valid-token')
    vi.mocked(axios.post).mockResolvedValue({
        data: {
            valid: true,
            data: {
                recipient: 'Aye Aye',
                membership_level: 'Gold',
                active: true,
                expires_on: null,
                verification_details: { branch: 'Yangon', reference: 42 },
            },
        },
    })

    render(<CertificateVerifier />)

    expect(await screen.findByText('Certificate Verified')).toBeInTheDocument()
    expect(screen.getByText('Recipient')).toBeInTheDocument()
    expect(screen.getByText('Aye Aye')).toBeInTheDocument()
    expect(screen.getByText('Membership Level')).toBeInTheDocument()
    expect(screen.getByText('Gold')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('true')).toBeInTheDocument()
    expect(screen.getByText('Expires On')).toBeInTheDocument()
    expect(screen.getByText('Not provided')).toBeInTheDocument()
    expect(screen.getByText('Verification Details')).toBeInTheDocument()
    expect(screen.getByText('{"branch":"Yangon","reference":42}')).toBeInTheDocument()
})