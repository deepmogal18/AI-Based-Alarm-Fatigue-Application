 document.addEventListener('DOMContentLoaded', () => {
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page-content');
        const liveVitalsList = document.getElementById('live-vitals-list');
        const recentActivityList = document.getElementById('recent-activity-list');
        const activeAlarmsList = document.getElementById('active-alarms-list');
        const alarmHistoryList = document.getElementById('alarm-history-list');
        const totalAlarmsCount = document.getElementById('total-alarms-count');
        const acknowledgedTodayCount = document.getElementById('acknowledged-today');
        const pendingWarningsCount = document.getElementById('pending-warnings-count');
        const myPatientsCount = document.getElementById('my-patients-count');
        const patientDetailContent = document.getElementById('patient-detail-content');
        const alarmMenuContent = document.getElementById('alarm-menu-content');
        const registerPatientForm = document.getElementById('register-patient-form');
        const saveThresholdsBtn = document.getElementById('save-thresholds-btn');
        const pauseWorkBtn = document.getElementById('pause-work-btn');
        const pauseWorkText = document.getElementById('pause-work-text');
        const busyStatusIndicator = document.getElementById('busy-status-indicator');

        let patients = [
             { id: 1, name: 'Rohan Sharma', age: 68, bed: 'ICU-05', reason: 'Post-Cardiac Surgery', vitals: { hr: 78, spo2: 98, bp: '120/80', rr: 18, isCritical: false }, notes: [{text: 'Patient stable, wound dressing changed.', time: '1 hour ago'}], history: [{type: 'High Heart Rate', time: '10 min ago'}], meds: [{name: 'Aspirin', dosage: '81 mg', frequency: 'Daily'}, {name: 'Metoprolol', dosage: '25 mg', frequency: 'BID'}] },
             { id: 2, name: 'Priya Patel', age: 45, bed: 'GEN-12', reason: 'Pneumonia', vitals: { hr: 85, spo2: 95, bp: '110/70', rr: 20, isCritical: false }, notes: [{text: 'Chest X-ray shows improvement.', time: '3 hours ago'}], history: [{type: 'Low SpO2', time: '5 min ago'}], meds: [{name: 'Amoxicillin', dosage: '500 mg', frequency: 'TID'}] },
             { id: 3, name: 'Amit Singh', age: 72, bed: 'ICU-02', reason: 'Sepsis Management', vitals: { hr: 92, spo2: 96, bp: '130/85', rr: 16, isCritical: false }, notes: [], history: [], meds: [] },
             { id: 4, name: 'Sunita Gupta', age: 55, bed: 'CARD-08', reason: 'Arrhythmia', vitals: { hr: 65, spo2: 99, bp: '115/75', rr: 17, isCritical: false }, notes: [], history: [], meds: [] }
        ];

        let activeAlarms = [];
        let alarmHistory = [];
        let acknowledgedToday = 0;
        let isNurseBusy = false;
        let ecgAnimationId;

        const showPage = (targetId) => {
            pages.forEach(page => page.classList.remove('active'));
            const targetPage = document.getElementById(targetId);
            if (targetPage) targetPage.classList.add('active');
            updateUI();
        };
        
        const showCustomPage = (targetId, data = null) => {
            pages.forEach(page => page.classList.remove('active'));
            const targetPage = document.getElementById(targetId);
            if (targetPage) {
                if (targetId === 'patient-detail-content' && data) renderPatientDetail(data);
                if (targetId === 'alarm-menu-content' && data) renderAlarmMenu(data);
                targetPage.classList.add('active');
            }
        }

        const updateUI = () => {
            renderDashboard();
            renderActiveAlarms();
            renderAlarmHistory();
        };
        
        const renderDashboard = () => {
            patients.sort((a, b) => b.vitals.isCritical - a.vitals.isCritical);

            liveVitalsList.innerHTML = patients.map(p => {
                const isCriticalClass = p.vitals.isCritical ? 'border-red-500 pulsing-alarm' : 'border-green-500';
                const textColor = p.vitals.isCritical ? 'text-red-500' : 'text-gray-500';
                return `
                    <div class="flex items-center p-4 bg-white rounded-lg shadow-sm cursor-pointer border-l-4 ${isCriticalClass} patient-link" data-id="${p.id}">
                        <i class="ri-user-3-line text-pink-600 text-3xl mr-4"></i>
                        <div class="flex-grow">
                            <h3 class="font-bold text-lg">${p.name} <span class="text-sm font-normal text-gray-500">(${p.bed})</span></h3>
                            <p class="text-xs text-gray-600">Reason: ${p.reason}</p>
                        </div>
                        <div class="text-right">
                            <div class="flex items-center justify-end"><span class="font-bold text-lg ${textColor} blinking-live mr-2">${p.vitals.hr}</span><span class="text-xs ${textColor}">bpm</span></div>
                            <div class="flex items-center justify-end"><span class="font-bold text-lg ${textColor} mr-2">${p.vitals.spo2}</span><span class="text-xs ${textColor}">SpO₂%</span></div>
                        </div>
                    </div>
                `;
            }).join('');
            
            recentActivityList.innerHTML = alarmHistory.slice(0, 5).map(a => `
                <div class="flex items-center p-4 gradient-bg-card rounded-lg shadow-sm">
                    <i class="ri-history-line text-pink-600 text-3xl mr-4"></i>
                    <div><h3 class="font-bold">${a.patient.name}</h3><p class="text-sm text-gray-600">${a.type}</p></div>
                    <span class="ml-auto text-xs text-gray-500">${a.time}</span>
                </div>
            `).join('');

            totalAlarmsCount.textContent = activeAlarms.length;
            acknowledgedTodayCount.textContent = acknowledgedToday;
            pendingWarningsCount.textContent = activeAlarms.filter(a => a.severity === 'moderate').length;
            myPatientsCount.textContent = patients.length;

            document.querySelectorAll('.patient-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    const patient = patients.find(p => p.id == e.currentTarget.dataset.id);
                    if (patient) showCustomPage('patient-detail-content', patient);
                });
            });
        };

        const renderActiveAlarms = () => {
            activeAlarmsList.innerHTML = activeAlarms.length === 0 
                ? '<p class="text-center text-gray-500 mt-8">No active alarms.</p>'
                : activeAlarms.map(alarm => `
                    <div class="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                        <div>
                            <h3 class="font-bold text-red-600">${alarm.type.toUpperCase()} ALARM</h3>
                            <p class="text-sm text-gray-500">Patient: ${alarm.patient.name} | Bed: ${alarm.patient.bed}</p>
                            <p class="text-sm text-gray-500">Time: ${new Date(alarm.triggeredAt).toLocaleTimeString()}</p>
                        </div>
                        <button class="bg-pink-500 text-white font-bold py-2 px-4 rounded-lg acknowledge-alarm-btn" data-id="${alarm.id}">Acknowledge</button>
                    </div>
                `).join('');

            document.querySelectorAll('.acknowledge-alarm-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const alarm = activeAlarms.find(a => a.id == e.target.dataset.id);
                    if (alarm) showCustomPage('alarm-menu-content', alarm);
                });
            });
        };

        const renderAlarmHistory = () => {
            alarmHistoryList.innerHTML = alarmHistory.length === 0
                ? '<p class="text-center text-gray-500 mt-8">No alarm history yet.</p>'
                : alarmHistory.map(alarm => `
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="font-bold text-green-600">${alarm.type} Acknowledged</h3>
                        <p class="text-sm text-gray-500">Patient: ${alarm.patient.name} | Bed: ${alarm.patient.bed}</p>
                        <p class="text-xs text-gray-400">Time: ${alarm.time}</p>
                    </div>
                `).join('');
        };

        const renderPatientDetail = (patient) => {
            const medsHtml = patient.meds.map(med => `<div class="flex items-center justify-between p-3 border-b last:border-b-0"><span class="font-semibold">${med.name}</span><span class="text-sm text-gray-600">${med.dosage}</span><span class="text-xs text-gray-500">${med.frequency}</span></div>`).join('');
            const notesHtml = patient.notes.map(note => `<div class="bg-gray-100 p-3 rounded-lg text-sm mb-2">${note.text} <span class="text-xs text-gray-500 float-right">${note.time}</span></div>`).join('');
            const historyHtml = patient.history.map(hist => `<div class="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between"><div><h3 class="font-semibold">${hist.type}</h3><p class="text-xs text-gray-500">Time: ${hist.time}</p></div></div>`).join('');

            patientDetailContent.innerHTML = `
                <button onclick="document.querySelector('.nav-link[data-target=dashboard-content]').click()" class="mb-4 bg-gray-200 text-gray-800 py-1 px-3 rounded">&larr; Back to Dashboard</button>
                <h1 class="text-3xl font-bold mb-6">${patient.name}</h1>
                <div class="grid grid-cols-2 gap-6 mb-8">
                    <div class="bg-white p-6 rounded-lg shadow-md"><h2 class="text-xl font-semibold mb-2">Patient Vitals</h2><div class="grid grid-cols-2 gap-4 text-center"><div><p class="font-bold text-2xl">${patient.vitals.hr}</p><p class="text-sm text-gray-500">HR (bpm)</p></div><div><p class="font-bold text-2xl">${patient.vitals.spo2}%</p><p class="text-sm text-gray-500">SpO₂</p></div><div><p class="font-bold text-2xl">${patient.vitals.bp}</p><p class="text-sm text-gray-500">BP (mmHg)</p></div><div><p class="font-bold text-2xl">${patient.vitals.rr}</p><p class="text-sm text-gray-500">RR (rpm)</p></div></div><div class="mt-4"><canvas id="ecg-graph-canvas" class="ecg-graph w-full h-40"></canvas></div></div>
                    <div class="bg-white p-6 rounded-lg shadow-md"><h2 class="text-xl font-semibold mb-2">Medication</h2><div class="space-y-2">${medsHtml}</div></div>
                    <div class="bg-white p-6 rounded-lg shadow-md col-span-2"><h2 class="text-xl font-semibold mb-2">Notes</h2><div class="space-y-2">${notesHtml}</div></div>
                    <div class="bg-white p-6 rounded-lg shadow-md col-span-2"><h2 class="text-xl font-semibold mb-2">Recent Alarms</h2><div class="space-y-2">${historyHtml}</div></div>
                </div>
            `;
            const canvas = document.getElementById('ecg-graph-canvas');
            if (canvas) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                drawEcgGraph('ecg-graph-canvas', patient.vitals.hr);
            }
        };
        
        const renderAlarmMenu = (alarm) => {
            const alarmType = alarm.type.toUpperCase() + ' ALARM';
            const value = alarm.type === 'High Heart Rate' ? `"${alarm.patient.vitals.hr} BPM"` : `"${alarm.patient.vitals.spo2}%"`;
            const bgColor = alarm.severity === 'severe' ? 'bg-red-500' : 'bg-yellow-500';
            const iconColor = alarm.severity === 'severe' ? 'text-red-500' : 'text-yellow-500';
            
            alarmMenuContent.innerHTML = `
                <div class="flex flex-col items-center justify-start w-full h-full p-4 space-y-3 pt-8" style="background-color: #c7e5ff;">
                    <div class="relative mb-3"><i class="ri-notification-3-line h-20 w-20 ${iconColor} ${alarm.severity === 'severe' ? 'pulsing-alarm' : ''}"></i><span class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 ${bgColor} rounded-full">1</span></div>
                    <div class="w-full ${bgColor} text-white font-bold py-3 rounded-2xl shadow-md text-center">${alarmType}<br>${value}</div>
                    <div class="w-full ${bgColor} text-white font-bold py-3 rounded-2xl shadow-md text-center">PATIENT: ${alarm.patient.name}<br>BED: ${alarm.patient.bed}</div>
                    <div class="w-full bg-white/50 p-2 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-center"><div><span class="font-semibold block text-xs">HR</span> ${alarm.patient.vitals.hr}</div><div><span class="font-semibold block text-xs">SpO2</span> ${alarm.patient.vitals.spo2}%</div><div><span class="font-semibold block text-xs">BP</span> ${alarm.patient.vitals.bp}</div><div><span class="font-semibold block text-xs">RR</span> ${alarm.patient.vitals.rr}</div></div>
                    <div class="w-full grid grid-cols-1 md:grid-cols-2 gap-3 mt-4"><button id="respond-alarm-btn" class="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl shadow-md">RESPOND ALARM</button><button id="patient-under-control-btn" class="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl shadow-md">PATIENT UNDER CONTROL</button></div>
                    <div class="w-full grid grid-cols-2 gap-3"><button id="not-available-btn" class="w-full bg-green-500 text-white font-bold py-2 rounded-2xl shadow-md text-xs">I AM NOT<br>AVAILABLE</button><button id="delegate-btn" class="w-full bg-green-500 text-white font-bold py-2 rounded-2xl shadow-md text-xs">NOTIFY THE<br>SENIOR NURSE</button></div>
                    <button id="mute-btn" class="w-full bg-purple-600 text-white font-bold py-2 rounded-2xl shadow-md text-sm">MUTE ALARM<br><span class="text-xs font-normal">(REQUIRES FACE ID)</span></button>
                </div>`;
            
            const resolveAndGoToDashboard = () => {
                resolveAlarm(alarm);
                showPage('dashboard-content');
            };
            alarmMenuContent.querySelectorAll('button').forEach(btn => btn.addEventListener('click', resolveAndGoToDashboard));
        };

        const drawEcgGraph = (canvasId, hr) => {
            if (ecgAnimationId) cancelAnimationFrame(ecgAnimationId);
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            const ctx = canvas.getContext('2d'), width = canvas.width, height = canvas.height, amplitude = height / 4, vCenter = height / 2, speed = 2;
            let x = 0, data = [], lastTime = performance.now();
            
            const generateWave = (t) => {
                const beatPhase = (t % (60 / hr)) * (2 * Math.PI / (60 / hr));
                if (beatPhase < 0.2*Math.PI) return 0.1*Math.sin(10*beatPhase)*amplitude;
                if (beatPhase < 0.3*Math.PI) return -0.5*amplitude;
                if (beatPhase < 0.32*Math.PI) return 1.5*amplitude;
                if (beatPhase < 0.4*Math.PI) return -0.3*amplitude;
                if (beatPhase >= 0.5*Math.PI && beatPhase < 0.7*Math.PI) return 0.2*Math.sin(10*(beatPhase-0.5*Math.PI))*amplitude;
                return 0;
            };
            const render = () => {
                x += speed;
                data.push({ x: x % width, y: generateWave(x / width) });
                if (data.length > width / speed) data.shift();
                
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, width, height);
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                if(data.length > 0) ctx.moveTo(data[0].x, vCenter + data[0].y);
                for (let i = 1; i < data.length; i++) {
                    if (data[i-1].x > data[i].x) { ctx.stroke(); ctx.beginPath(); ctx.moveTo(data[i].x, vCenter + data[i].y); } 
                    else { ctx.lineTo(data[i].x, vCenter + data[i].y); }
                }
                ctx.stroke();
                ecgAnimationId = requestAnimationFrame(render);
            };
            render();
        };

        const resolveAlarm = (alarm) => {
            const index = activeAlarms.findIndex(a => a.id === alarm.id);
            if (index > -1) {
                activeAlarms.splice(index, 1);
                alarmHistory.unshift({ ...alarm, time: new Date().toLocaleTimeString('en-US') });
                if (alarm.severity === 'severe') acknowledgedToday++;
                const patient = patients.find(p => p.id === alarm.patient.id);
                if (patient) patient.vitals.isCritical = false;
                updateUI();
            }
        };

        
        const triggerAlarm = (patient, alarmType, severity) => {
            if (isNurseBusy || activeAlarms.some(a => a.patient.id === patient.id)) return;

            patient.vitals.isCritical = true;
            activeAlarms.push({
                id: Date.now(),
                patient: patient,
                type: alarmType,
                severity: severity,
                triggeredAt: Date.now()
            });
            updateUI();
        };

        const updateVitals = () => {
            if (isNurseBusy) return;
            patients.forEach(p => {
                if (p.vitals.isCritical) return;

              
                p.vitals.hr += Math.floor(Math.random() * 9) - 4;
                if (p.vitals.hr < 30) p.vitals.hr = 30; 
                if (p.vitals.hr > 180) p.vitals.hr = 180; 

                p.vitals.spo2 = Math.min(100, p.vitals.spo2 + (Math.floor(Math.random() * 3) - 1.1)); 
                if (p.vitals.spo2 < 80) p.vitals.spo2 = 80;
                
                p.vitals.rr += Math.floor(Math.random() * 3) - 1;
                p.vitals.bp = `${110 + Math.floor(Math.random() * 21) - 10}/${70 + Math.floor(Math.random() * 11) - 5}`;
                
             
                const hrCriticalHigh = 150, hrCriticalLow = 40;
                const spo2CriticalLow = 85;
                const hrWarningHigh = 120, hrWarningLow = 50;
                const spo2WarningLow = 90;

                if (p.vitals.hr > hrCriticalHigh || p.vitals.hr < hrCriticalLow) {
                    triggerAlarm(p, 'Critical Heart Rate', 'severe');
                } else if (p.vitals.spo2 < spo2CriticalLow) {
                    triggerAlarm(p, 'Critical SpO2', 'severe');
                } else if (p.vitals.hr > hrWarningHigh || p.vitals.hr < hrWarningLow) {
                     triggerAlarm(p, 'Warning: Heart Rate', 'moderate');
                } else if (p.vitals.spo2 < spo2WarningLow) {
                     triggerAlarm(p, 'Warning: SpO2', 'moderate');
                }
            });
            if (document.getElementById('dashboard-content').classList.contains('active')) renderDashboard();
        };

        const showModal = (title, description) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
                    <h3 class="text-xl font-bold mb-2">${title}</h3><p class="text-gray-600 mb-4">${description}</p>
                    <button class="bg-blue-600 text-white py-2 px-4 rounded-lg modal-close-btn">Close</button>
                </div>`;
            document.body.appendChild(modal);
            modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
        };

        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                e.currentTarget.classList.add('active');
                showPage(e.currentTarget.dataset.target);
            });
        });
        
        document.querySelectorAll('.feature-item').forEach(item => {
            item.addEventListener('click', (e) => showModal(item.dataset.title, item.dataset.description));
        });

        document.getElementById('send-chat-btn').addEventListener('click', () => {
            const input = document.getElementById('chat-input'), messages = document.getElementById('chat-messages');
            if (input.value.trim() !== '') {
                messages.innerHTML += `<div class="text-right"><span class="p-3 bg-gray-200 rounded-lg inline-block">${input.value}</span></div>`;
                input.value = '';
                messages.scrollTop = messages.scrollHeight;
            }
        });

        document.getElementById('sign-out-btn').addEventListener('click', () => showModal('Signed Out', 'You have been successfully signed out.'));

        registerPatientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPatient = {
                id: Date.now(),
                name: document.getElementById('patient-name-input').value,
                age: document.getElementById('patient-age-input').value,
                bed: document.getElementById('patient-bed-input').value,
                reason: document.getElementById('patient-reason-input').value,
                vitals: { hr: 75, spo2: 97, bp: '120/80', rr: 16, isCritical: false },
                notes: [], history: [], meds: []
            };
            patients.push(newPatient);
            showModal('Success', `${newPatient.name} has been registered successfully.`);
            registerPatientForm.reset();
            updateUI();
        });
        
        saveThresholdsBtn.addEventListener('click', () => {
            showModal('Settings Saved', 'Alarm threshold settings have been updated successfully.');
        });

        pauseWorkBtn.addEventListener('click', () => {
            isNurseBusy = !isNurseBusy;
            pauseWorkBtn.classList.toggle('active', isNurseBusy);
            const icon = pauseWorkBtn.querySelector('i');
            if (isNurseBusy) {
                pauseWorkText.textContent = 'Resume My Work';
                icon.className = 'ri-play-circle-line w-6 h-6 mr-3';
                busyStatusIndicator.classList.remove('hidden');
            } else {
                pauseWorkText.textContent = 'Pause My Work';
                icon.className = 'ri-pause-circle-line w-6 h-6 mr-3';
                busyStatusIndicator.classList.add('hidden');
            }
        });

       
        updateUI();
        setInterval(updateVitals, 3000);
        
    });