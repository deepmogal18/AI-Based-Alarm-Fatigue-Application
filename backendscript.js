document.addEventListener('DOMContentLoaded', () => {
  const apiUrlInput = document.getElementById('apiUrl');
  const connectBtn = document.getElementById('connectBtn');
  const statusDiv = document.getElementById('status');
  const vitalsPanel = document.getElementById('vitals-panel');
  const triggerBtn = document.getElementById('triggerBtn');
  const analysisCard = document.getElementById('analysis-card');
  const spinner = document.getElementById('analysis-spinner');
  const severityText = document.getElementById('severity-text');
  const accuracyText = document.getElementById('accuracy-text');
  const overviewText = document.getElementById('overview-text');

  let backendUrl = '';

  
  connectBtn.addEventListener('click', () => {
    const url = apiUrlInput.value.trim();
    if (url) {
      backendUrl = url;
      statusDiv.textContent = 'Status: Connected';
      statusDiv.classList.replace('text-red-600','text-green-600');
      vitalsPanel.classList.remove('opacity-50','pointer-events-none');
      triggerBtn.disabled = false;
    }
  });

  
  const sliders = ['heart_rate','systolic_bp','spo2','respiration_rate','temperature'];
  sliders.forEach(id => {
    const el = document.getElementById(id);
    const val = document.getElementById(id + '_value');
    el.addEventListener('input', () => {
      val.textContent = id==='temperature' ? parseFloat(el.value).toFixed(1) : el.value;
    });
  });

  triggerBtn.addEventListener('click', async () => {
    if (!backendUrl) return alert('Connect backend first');

    const data = {
      heart_rate: parseInt(document.getElementById('heart_rate').value),
      systolic_bp: parseInt(document.getElementById('systolic_bp').value),
      spo2: parseInt(document.getElementById('spo2').value),
      respiration_rate: parseInt(document.getElementById('respiration_rate').value),
      temperature: parseFloat(document.getElementById('temperature').value)
    };

   
    const message = `Patient vitals: 
    - Heart Rate: ${data.heart_rate} bpm
    - Systolic BP: ${data.systolic_bp} mmHg
    - SpO2: ${data.spo2} %
    - Respiration: ${data.respiration_rate} breaths/min
    - Temperature: ${data.temperature} °C
    Provide severity percentage, confidence, and overview.`;

    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/chat`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ message })
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Server error');

    
      const text = result.response;
      const severity = (text.match(/(\d+)% severity/)||[])[1] || 50;
      const accuracy = (text.match(/(\d+)% confidence/)||[])[1] || 70;

      severityText.textContent = severity+'%';
      accuracyText.textContent = accuracy+'%';
      overviewText.textContent = text;
    } catch (e) {
      overviewText.textContent = 'Error: '+e.message;
    } finally {
      setLoading(false);
    }
  });

  function setLoading(x){
    if(x){ spinner.classList.remove('hidden'); analysisCard.classList.add('loading'); }
    else{ spinner.classList.add('hidden'); analysisCard.classList.remove('loading'); }
  }
});