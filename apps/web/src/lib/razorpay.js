let scriptLoaded = false

function loadRazorpayScript() {
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

export async function openCheckout({
  subscriptionId,
  razorpayKeyId,
  description,
  userName,
  userEmail,
  userPhone,
  onSuccess,
  onFailure,
}) {
  await loadRazorpayScript()

  const rzp = new window.Razorpay({
    key: razorpayKeyId,
    subscription_id: subscriptionId,
    name: 'Loot',
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
