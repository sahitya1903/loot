declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  subscription_id: string
  name: string
  description?: string
  handler: (response: RazorpayResponse) => void
  modal?: {
    ondismiss?: () => void
  }
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: {
    color?: string
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_subscription_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open: () => void
  close: () => void
}

let scriptLoaded = false

function loadRazorpayScript(): Promise<void> {
  if (scriptLoaded && window.Razorpay) return Promise.resolve()

  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      scriptLoaded = true
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => {
      scriptLoaded = true
      resolve()
    }
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'))
    document.body.appendChild(script)
  })
}

interface OpenCheckoutParams {
  subscriptionId: string
  razorpayKeyId: string
  description?: string
  userName?: string
  userEmail?: string
  userPhone?: string
  onSuccess: (response: RazorpayResponse) => void
  onFailure: () => void
}

export async function openCheckout({
  subscriptionId,
  razorpayKeyId,
  description,
  userName,
  userEmail,
  userPhone,
  onSuccess,
  onFailure,
}: OpenCheckoutParams): Promise<void> {
  await loadRazorpayScript()

  const rzp = new window.Razorpay({
    key: razorpayKeyId,
    subscription_id: subscriptionId,
    name: 'Momento',
    description: description ?? 'Storage Subscription',
    handler: onSuccess,
    modal: {
      ondismiss: onFailure,
    },
    prefill: {
      name: userName,
      email: userEmail,
      contact: userPhone,
    },
    theme: {
      color: '#6366f1',
    },
  })

  rzp.open()
}
