import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import {
    AlertTriangle,
    BadgeCheck,
    CheckCircle2,
    FileWarning,
    Info,
    Loader2,
    Lock,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    ShieldQuestion,
} from 'lucide-react'

const API_URL =
    import.meta.env.VITE_API_BASE_URL ?? 'https://gi3oqjepp0.execute-api.eu-north-1.amazonaws.com/decrypt'

type Status = 'loading' | 'verified' | 'invalid' | 'revoked' | 'missing' | 'error'

type CertificateData = Record<string, unknown>

type VerifyResponse = {
    valid: boolean
    reason?: string
    status?: string
    data?: CertificateData
}

function formatFieldLabel(key: string) {
    return key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatFieldValue(value: unknown) {
    if (value === null || value === undefined) return 'Not provided'
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value)
    }

    try {
        return JSON.stringify(value)
    } catch {
        return String(value)
    }
}

function isRevoked(payload: VerifyResponse | undefined) {
    const flag = `${payload?.reason ?? ''} ${payload?.status ?? ''}`.toUpperCase()
    return flag.includes('REVOKED')
}

export default function CertificateVerifier() {
    const [status, setStatus] = useState<Status>('loading')
    const [certificate, setCertificate] = useState<CertificateData | null>(null)
    const [message, setMessage] = useState<string>('')

    const verify = useCallback(async () => {
        const params = new URLSearchParams(window.location.search)
        const key = params.get('key')?.trim()

        if (!key) {
            setStatus('missing')
            setMessage('No verification token was supplied in the link.')
            return
        }

        setStatus('loading')
        setCertificate(null)
        setMessage('')

        try {
            const { data } = await axios.post<VerifyResponse>(
                API_URL,
                { token: key },
                { headers: { 'Content-Type': 'application/json' }, timeout: 15000 },
            )

            if (data?.valid && data.data) {
                setCertificate(data.data)
                setStatus('verified')
                return
            }

            setStatus(isRevoked(data) ? 'revoked' : 'invalid')
            setMessage(data?.reason ?? '')
        } catch (err) {
            const payload = axios.isAxiosError<VerifyResponse>(err)
                ? err.response?.data
                : undefined

            if (payload && payload.valid === false) {
                setStatus(isRevoked(payload) ? 'revoked' : 'invalid')
                setMessage(payload.reason ?? '')
                return
            }

            setStatus('error')
            setMessage(
                'We could not reach the verification service. Please check your connection and try again.',
            )
        }
    }, [])

    useEffect(() => {
        void verify()
    }, [verify])

    return (
        <div className="kbz-page min-h-dvh px-4 py-5 sm:px-6 sm:py-10">
            <div className="mx-auto w-full max-w-md">
                <Branding />

            <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-[0_18px_48px_rgba(17,63,163,0.13)] ring-1 ring-[#dfe7fa]">
                    {status === 'loading' && <LoadingState />}
                    {status === 'verified' && certificate && (
                        <VerifiedState certificate={certificate} />
                    )}
                    {status === 'invalid' && (
                        <InvalidState message={message} onRetry={verify} />
                    )}
                    {status === 'revoked' && <RevokedState message={message} />}
                    {(status === 'missing' || status === 'error') && (
                        <NeutralState
                            title={
                                status === 'missing'
                                    ? 'No Verification Token'
                                    : 'Verification Unavailable'
                            }
                            message={message}
                            onRetry={verify}
                        />
                    )}
                </div>

                <Footer />
            </div>
        </div>
    )
}

function Branding() {
    return (
        <header className="flex items-center gap-3">
            <span className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-[#1152b7] text-center text-[13px] font-bold leading-3 tracking-normal text-white shadow-sm">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
                <h1 className="mt-0.5 text-base font-bold tracking-normal text-[#123f93] sm:text-lg">
                    Certificate verification
                </h1>
                <p className="text-xs text-slate-500">
                    Official document authentication service
                </p>
            </div>
        </header>
    )
}

function LoadingState() {
    return (
        <section className="flex flex-col items-center px-6 py-14 text-center">
            <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-[#2f73ef]/15" />
                <Loader2
                    className="h-10 w-10 animate-spin text-[#1152b7]"
                    aria-hidden="true"
                />
            </div>
            <p className="mt-6 text-sm font-semibold text-slate-800">
                Verifying Certificate Authenticity...
            </p>
            <p className="mt-1 text-xs text-slate-500">
                Checking the digital signature against KBZ Bank records.
            </p>

            <div className="mt-8 w-full space-y-3">
                {[0, 1, 2].map((row) => (
                    <div
                        key={row}
                        className="h-10 animate-pulse rounded-xl bg-slate-100"
                    />
                ))}
            </div>
        </section>
    )
}

function VerifiedState({ certificate }: { certificate: CertificateData }) {
    return (
        <section>
            <div className="border-b-4 border-[#008000] bg-[#f5f8ff] px-6 py-8 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1a5dcc] text-white shadow-sm ring-4 ring-[#dce8ff]">
                    <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
                </span>
                <p className="mt-4 text-[10px] font-bold tracking-[0.14em] text-[#1a5dcc] uppercase">
                    Verification complete
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-normal text-[#123f93]">
                    Certificate Verified
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                    This certificate is authentic and has not been altered.
                </p>
            </div>

            <div className="px-6 py-6">
                <div className="flex items-center justify-center gap-2 rounded-full bg-[#eef4ff] px-4 py-2.5 text-xs font-semibold text-[#174fae] ring-1 ring-[#d7e5ff]">
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    Officially Verified by KBZ Bank
                </div>

                <dl className="mt-6 divide-y divide-slate-100 rounded-xl bg-slate-50 ring-1 ring-slate-200/70">
                    {Object.entries(certificate).map(([key, value]) => (
                        <DetailRow
                            key={key}
                            label={formatFieldLabel(key)}
                            value={formatFieldValue(value)}
                            highlight={key === 'recipient'}
                            mono={key === 'cert_id'}
                        />
                    ))}
                </dl>

                <div className="mt-5 flex gap-3 rounded-xl border-l-4 border-[#f6c719] bg-[#fffdf5] p-4 ring-1 ring-[#f4e8b4]">
                    <Info
                        className="h-5 w-5 shrink-0 text-[#d89d00]"
                        aria-hidden="true"
                    />
                    <p className="text-xs leading-relaxed text-slate-700">
                        <span className="font-semibold">Cross-reference required. </span>
                        Please confirm that the recipient name, certificate ID and issue
                        date shown above exactly match the printed document in your hand.
                        If any detail differs, the physical copy should not be trusted.
                    </p>
                </div>
            </div>
        </section>
    )
}

function InvalidState({
    message,
    onRetry,
}: {
    message: string
    onRetry: () => void
}) {
    return (
        <section>
            <div className="border-b-4 border-[#f6c719] bg-[#fff8f7] px-6 py-8 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-700 text-white shadow-sm ring-4 ring-rose-100">
                    <ShieldAlert className="h-9 w-9" aria-hidden="true" />
                </span>
                <p className="mt-4 text-[10px] font-bold tracking-[0.14em] text-rose-700 uppercase">
                    Verification failed
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-normal text-[#123f93]">
                    Certificate Verification Failed
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                    This certificate could not be authenticated.
                </p>
            </div>

            <div className="px-6 py-6">
                <div className="flex gap-3 rounded-xl bg-rose-50 p-4 ring-1 ring-rose-100">
                    <AlertTriangle
                        className="h-5 w-5 shrink-0 text-rose-600"
                        aria-hidden="true"
                    />
                    <p className="text-xs leading-relaxed text-rose-900">
                        The digital signature is invalid, corrupted, or the certificate
                        data has been tampered with. Do not accept this document as proof
                        issued by KBZ Bank.
                    </p>
                </div>

                {message && (
                    <p className="mt-3 text-center text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                        Reason: {message}
                    </p>
                )}

                <p className="mt-5 text-center text-xs text-slate-500">
                    If you believe this is a mistake, contact your nearest KBZ Bank
                    branch with the certificate in hand.
                </p>

                <RetryButton onRetry={onRetry} />
            </div>
        </section>
    )
}

function RevokedState({ message }: { message: string }) {
    return (
        <section>
            <div className="border-b-4 border-[#f6c719] bg-[#fffaf0] px-6 py-8 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-600 text-white shadow-sm ring-4 ring-amber-100">
                    <FileWarning className="h-9 w-9" aria-hidden="true" />
                </span>
                <p className="mt-4 text-[10px] font-bold tracking-[0.14em] text-amber-700 uppercase">
                    Status: revoked
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-normal text-[#123f93]">
                    Certificate Revoked
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                    This certificate is no longer valid.
                </p>
            </div>

            <div className="px-6 py-6">
                <div className="flex gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
                    <AlertTriangle
                        className="h-5 w-5 shrink-0 text-amber-600"
                        aria-hidden="true"
                    />
                    <p className="text-xs leading-relaxed text-amber-900">
                        This certificate was issued by KBZ Bank and was previously valid,
                        but it has since been revoked. It must no longer be used as proof
                        or presented for any official purpose.
                    </p>
                </div>

                {message && (
                    <p className="mt-3 text-center text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                        Reason: {message}
                    </p>
                )}
            </div>
        </section>
    )
}

function NeutralState({
    title,
    message,
    onRetry,
}: {
    title: string
    message: string
    onRetry: () => void
}) {
    return (
        <section className="px-6 py-10 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 ring-4 ring-slate-200">
                <ShieldQuestion className="h-9 w-9 text-slate-500" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold tracking-tight text-slate-800">
                {title}
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
                {message ||
                    'No valid verification token was supplied. Please rescan the QR code printed on your certificate.'}
            </p>
            <RetryButton onRetry={onRetry} />
        </section>
    )
}

function RetryButton({ onRetry }: { onRetry: () => void }) {
    return (
        <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1152b7] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d4298] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f73ef] focus-visible:ring-offset-2 active:scale-[0.99]"
        >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try Again
        </button>
    )
}

function DetailRow({
    label,
    value,
    highlight = false,
    mono = false,
}: {
    label: string
    value: string
    highlight?: boolean
    mono?: boolean
}) {
    return (
        <div className="flex items-start justify-between gap-4 px-4 py-3.5">
            <dt className="text-xs font-medium text-slate-500">{label}</dt>
            <dd
                className={[
                    'text-right text-sm break-words',
                    highlight
                        ? 'font-bold text-slate-900'
                        : 'font-medium text-slate-700',
                    mono ? 'font-mono tracking-tight' : '',
                ].join(' ')}
            >
                {value}
            </dd>
        </div>
    )
}

function Footer() {
    return (
        <footer className="mt-6 pt-2 text-center">
            <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500">
            <Lock className="h-3.5 w-3.5 text-[#1152b7]" aria-hidden="true" />
                Secured verification service
            </p>
            <p className="mt-1 text-[10px] text-slate-400">KBZ Bank &middot; Myanmar</p>
        </footer>
    )
}
