document.addEventListener('DOMContentLoaded', () => {
    const btnRequestCode = document.getElementById('btn-request-code');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const loading = document.getElementById('loading');
    const errorMsg = document.getElementById('error-message');
    const qrContainer = document.getElementById('qr-container');
    const qrImage = document.getElementById('qr-image');

    let pollInterval;

    btnRequestCode.addEventListener('click', async () => {
        // Show loading state
        btnRequestCode.classList.add('hidden');
        errorMsg.classList.add('hidden');

        try {
            const response = await fetch('/api/pair', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error("Failed to start QR session");
            }

            // Switch steps
            step1.classList.remove('active');
            step1.classList.add('hidden');
            step2.classList.remove('hidden');
            step2.classList.add('active');
            loading.classList.remove('hidden');

            // Start polling for QR and connection status
            startPolling();

        } catch (err) {
            showError(err.message);
            btnRequestCode.classList.remove('hidden');
        }
    });

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }

    function startPolling() {
        pollInterval = setInterval(async () => {
            try {
                const res = await fetch('/api/status');
                const data = await res.json();
                
                if (data.status === 'connected') {
                    clearInterval(pollInterval);
                    step2.classList.remove('active');
                    step2.classList.add('hidden');
                    step3.classList.remove('hidden');
                    step3.classList.add('active');
                } else if (data.qr) {
                    loading.classList.add('hidden');
                    qrContainer.classList.remove('hidden');
                    if (qrImage.src !== data.qr) {
                        qrImage.src = data.qr;
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 1500);
    }
});
