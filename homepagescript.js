    document.addEventListener('DOMContentLoaded', () => {
            const leftDeviceContainer = document.getElementById('left-device-container');
            const rightDeviceContainer = document.getElementById('right-device-container');
            const mobileMenu = document.getElementById('mobile-menu');
            const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
            const pagesContainer = document.querySelector('.phone-content-wrapper');
            const bottomNavBar = document.getElementById('bottom-nav-bar');
            const loginErrorMsg = document.getElementById('login-error-message');

            let liveAlarmsCount = 0;
            let respondedAlarmsCount = 0;
            let liveAlarms = [];
            let alarmHistory = [];
            let alarmInterval;
            let vitalsInterval;
            let ecgAnimationId;

            const patients = [{
                id: 1,
                name: 'Rohan Sharma',
                age: 68,
                bed: 'ICU-05',
                reason: 'Post-Cardiac Surgery',
                daysInHospital: 5,
                dischargeDate: '2025-08-30',
                notes: [{
                    text: 'Patient stable, wound dressing changed.',
                    time: '1 hour ago'
                }],
                history: [{
                    type: 'High Heart Rate',
                    time: '10 min ago'
                }, {
                    type: 'Low SpO2',
                    time: '1 hour ago'
                }],
                vitals: {
                    hr: 78,
                    spo2: 98,
                    bp: '120/80',
                    rr: 18
                },
                medications: [{
                    name: 'Aspirin',
                    dosage: '81 mg',
                    frequency: 'Daily',
                    isGiven: false
                }, {
                    name: 'Metoprolol',
                    dosage: '25 mg',
                    frequency: 'BID',
                    isGiven: true
                }]
            }, {
                id: 2,
                name: 'Priya Patel',
                age: 45,
                bed: 'GEN-12',
                reason: 'Pneumonia',
                daysInHospital: 2,
                dischargeDate: '2025-09-02',
                notes: [{
                    text: 'Chest X-ray shows improvement.',
                    time: '3 hours ago'
                }],
                history: [{
                    type: 'Low SpO2',
                    time: '5 min ago'
                }],
                vitals: {
                    hr: 85,
                    spo2: 95,
                    bp: '110/70',
                    rr: 20
                },
                medications: [{
                    name: 'Amoxicillin',
                    dosage: '500 mg',
                    frequency: 'TID',
                    isGiven: false
                }, {
                    name: 'Paracetamol',
                    dosage: '500 mg',
                    frequency: 'PRN',
                    isGiven: true
                }]
            }, {
                id: 3,
                name: 'Amit Singh',
                age: 72,
                bed: 'ICU-02',
                reason: 'Sepsis Management',
                daysInHospital: 12,
                dischargeDate: '2025-09-15',
                notes: [],
                history: [{
                    type: 'High Heart Rate',
                    time: '2 hours ago'
                }],
                vitals: {
                    hr: 92,
                    spo2: 96,
                    bp: '130/85',
                    rr: 16
                },
                medications: []
            }, {
                id: 4,
                name: 'Sunita Gupta',
                age: 55,
                bed: 'CARD-08',
                reason: 'Arrhythmia',
                daysInHospital: 8,
                dischargeDate: '2025-09-05',
                notes: [],
                history: [],
                vitals: {
                    hr: 65,
                    spo2: 99,
                    bp: '115/75',
                    rr: 17
                },
                medications: []
            }, {
                id: 5,
                name: 'Vikram Kumar',
                age: 62,
                bed: 'NEURO-01',
                reason: 'Stroke Recovery',
                daysInHospital: 1,
                dischargeDate: '2025-09-01',
                notes: [],
                history: [],
                vitals: {
                    hr: 88,
                    spo2: 97,
                    bp: '125/82',
                    rr: 19
                },
                medications: []
            }];

            const updateDashboardCounts = () => {
                const liveAlarmsCountEl = document.getElementById('live-alarms-count');
                const respondedAlarmsCountEl = document.getElementById('responded-alarms-count');
                if (liveAlarmsCountEl) liveAlarmsCountEl.textContent = liveAlarmsCount;
                if (respondedAlarmsCountEl) respondedAlarmsCountEl.textContent = respondedAlarmsCount;
            };

            const resolveAlarm = (alarmId) => {
                const alarmIndex = liveAlarms.findIndex(a => a.id === alarmId);
                if (alarmIndex > -1) {
                    const resolvedAlarm = liveAlarms[alarmIndex];
                    alarmHistory.unshift({ ...resolvedAlarm,
                        time: new Date().toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })
                    });
                    liveAlarmsCount--;
                    respondedAlarmsCount++;
                    liveAlarms.splice(alarmIndex, 1);
                    updateDashboardCounts();
                }
            };

            const renderResponseHistoryChart = () => {
                const chartContainer = document.getElementById('response-history-chart');
                if (!chartContainer) return;

                const data = [{
                    hour: '8A',
                    count: 2
                }, {
                    hour: '9A',
                    count: 5
                }, {
                    hour: '10A',
                    count: 3
                }, {
                    hour: '11A',
                    count: 7
                }, {
                    hour: '12P',
                    count: 4
                }, {
                    hour: '1P',
                    count: 6
                }, ];
                const maxCount = Math.max(...data.map(d => d.count), 1);
                let chartHTML = '';

                data.forEach(d => {
                    const barHeight = (d.count / maxCount) * 90; 
                    chartHTML += `
                        <div class="flex flex-col items-center justify-end h-full w-1/6">
                            <div class="w-4 bg-blue-400 rounded-t" style="height: ${barHeight}%"></div>
                            <div class="text-xs font-semibold mt-1">${d.hour}</div>
                        </div>
                    `;
                });
                chartContainer.innerHTML = chartHTML;
            };

            const updateVitals = () => {
                patients.forEach(p => {
                    p.vitals.hr += Math.floor(Math.random() * 5) - 2;
                    p.vitals.spo2 += Math.floor(Math.random() * 3) - 1; 
                    p.vitals.rr += Math.floor(Math.random() * 3) - 1;
                    if (p.vitals.spo2 > 99) p.vitals.spo2 = 99;
                    if (p.vitals.spo2 < 92) p.vitals.spo2 = 92;
                    if (p.vitals.rr > 22) p.vitals.rr = 22;
                    if (p.vitals.rr < 16) p.vitals.rr = 16;

                    const bpSys = 110 + Math.floor(Math.random() * 21) - 10;
                    const bpDia = 70 + Math.floor(Math.random() * 11) - 5;
                    p.vitals.bp = `${bpSys}/${bpDia}`;

                    const hrEl = document.getElementById(`hr-${p.id}`);
                    const spo2El = document.getElementById(`spo2-${p.id}`);
                    const bpEl = document.getElementById(`bp-${p.id}`);
                    const rrEl = document.getElementById(`rr-${p.id}`);
                    if (hrEl) hrEl.textContent = p.vitals.hr;
                    if (spo2El) spo2El.textContent = p.vitals.spo2;
                    if (bpEl) bpEl.textContent = p.vitals.bp;
                    if (rrEl) rrEl.textContent = p.vitals.rr;
                });
            };

            const stopEcgAnimation = () => {
                if (ecgAnimationId) {
                    cancelAnimationFrame(ecgAnimationId);
                }
            };
            
            const drawEcgGraph = (canvasId, hr) => {
                const canvas = document.getElementById(canvasId);
                if (!canvas) return;

                const ctx = canvas.getContext('2d');
                const width = canvas.width;
                const height = canvas.height;
                const amplitude = height / 4;
                const verticalCenter = height / 2;
                const scaleX = 1;
                const speed = 2;

                let x = 0;
                let data = [];
                let lastTime = performance.now();
                const interval = 1000 / (hr * 2); 

                const generateWave = (t, freq, amp) => {
                    const beatPhase = (t % (60 / hr)) * (2 * Math.PI / (60 / hr));
                    let y = 0;

                   
                    if (beatPhase < 0.2 * Math.PI) {
                        y = 0.1 * Math.sin(10 * beatPhase) * amp;
                    }
                  
                    else if (beatPhase >= 0.2 * Math.PI && beatPhase < 0.3 * Math.PI) {
                        y = -0.5 * amp;
                    } else if (beatPhase >= 0.3 * Math.PI && beatPhase < 0.32 * Math.PI) {
                        y = 1.5 * amp;
                    } else if (beatPhase >= 0.32 * Math.PI && beatPhase < 0.4 * Math.PI) {
                        y = -0.3 * amp;
                    }
                   
                    else if (beatPhase >= 0.5 * Math.PI && beatPhase < 0.7 * Math.PI) {
                        y = 0.2 * Math.sin(10 * (beatPhase - 0.5 * Math.PI)) * amp;
                    }

                    return y;
                };

                const render = (currentTime) => {
                    const elapsed = currentTime - lastTime;
                    if (elapsed > 10) {
                        lastTime = currentTime;
                        x += speed;

                        const yValue = generateWave(x / width, hr, amplitude);
                        data.push({ x: x, y: yValue });
                        if (x > width) {
                            data.shift();
                        }

                        ctx.clearRect(0, 0, width, height);
                        ctx.fillStyle = '#000';
                        ctx.fillRect(0, 0, width, height);

                        ctx.strokeStyle = '#00ff00';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(0, verticalCenter);

                        for (let i = 0; i < data.length; i++) {
                            const point = data[i];
                            ctx.lineTo(point.x, verticalCenter + point.y);
                        }
                        ctx.stroke();

                        if (data.length > 0) {
                            ctx.clearRect(0, 0, x - width, height);
                        }
                    }

                    ecgAnimationId = requestAnimationFrame(render);
                };

                render(performance.now());
            };

            const showPage = (pageId, data) => {
                const allPages = pagesContainer.querySelectorAll('.app-page');
                allPages.forEach(p => p.classList.remove('active'));
                stopEcgAnimation(); 

                const page = document.getElementById(pageId);
                if (page) {
                    if (pageId === 'my-patients-container') {
                        let patientListHTML = `
                            <h1 class="text-3xl font-bold text-gray-800 px-2 mb-4">My Patients</h1>
                            <div class="px-2 mb-4">
                                <input id="patient-search-input" type="text" placeholder="Search patients..." class="w-full p-2 border border-gray-300 rounded-lg shadow-sm">
                            </div>
                            <div id="patient-grid" class="w-full flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                        `;
                        patients.forEach(p => {
                            patientListHTML += `
                                <div class="patient-item bg-white p-4 rounded-lg shadow-sm cursor-pointer" data-patient-id="${p.id}" data-patient-name="${p.name.toLowerCase()}">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <h3 class="font-semibold">${p.name}, ${p.age}</h3>
                                            <p class="text-xs text-gray-500">Bed: ${p.bed} | Reason: ${p.reason}</p>
                                        </div>
                                        <i class="hi hi-chevron-right text-gray-400"></i>
                                    </div>
                                    <div class="mt-2 pt-2 border-t grid grid-cols-3 gap-2 text-sm">
                                        <div class="text-center">
                                            <span class="font-semibold block text-xs">HR</span> <span id="hr-${p.id}">${p.vitals.hr}</span>
                                        </div>
                                        <div class="text-center">
                                            <span class="font-semibold block text-xs">SpO2</span> <span id="spo2-${p.id}">${p.vitals.spo2}</span>%
                                        </div>
                                        <div class="flex items-center justify-center gap-1 text-red-500 font-bold text-xs blinking-live">
                                            <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                                            LIVE
                                        </div>
                                        <div class="text-center">
                                            <span class="font-semibold block text-xs">BP</span> <span id="bp-${p.id}">${p.vitals.bp}</span>
                                        </div>
                                        <div class="text-center">
                                            <span class="font-semibold block text-xs">RR</span> <span id="rr-${p.id}">${p.vitals.rr}</span>
                                        </div>
                                    </div>
                                </div>`;
                        });
                        patientListHTML += `</div>`;
                        page.innerHTML = patientListHTML;

                        document.querySelectorAll('.patient-item').forEach(item => {
                            item.addEventListener('click', () => showPage('patient-detail-container', {
                                patientId: item.dataset.patientId
                            }));
                        });

                        document.getElementById('patient-search-input').addEventListener('input', (e) => {
                            const searchTerm = e.target.value.toLowerCase();
                            document.querySelectorAll('.patient-item').forEach(item => {
                                const patientName = item.dataset.patientName;
                                if (patientName.includes(searchTerm)) {
                                    item.style.display = '';
                                } else {
                                    item.style.display = 'none';
                                }
                            });
                        });

                    } else if (pageId === 'patient-detail-container' && data) {
                        const patient = patients.find(p => p.id == data.patientId);
                        
                        let dischargeInfoHTML = '';
                        let daysLeft = 'N/A';
                        if (patient.dischargeDate) {
                            const dischargeDate = new Date(patient.dischargeDate);
                            const now = new Date();
                            const timeDiff = dischargeDate.getTime() - now.getTime();
                            daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            dischargeInfoHTML = `
                                <div class="bg-white p-4 rounded-lg shadow-sm">
                                    <h3 class="font-semibold text-gray-500 text-sm">Admission & Discharge</h3>
                                    <p class="text-lg font-semibold mt-2">Days in Hospital: <span class="text-blue-600">${patient.daysInHospital}</span></p>
                                    <p class="text-lg font-semibold">Days Left: <span class="text-red-600">${daysLeft < 0 ? 'Discharged' : daysLeft}</span></p>
                                    <div class="mt-4">
                                        <label for="discharge-date-input" class="block text-sm font-medium text-gray-700">Set Discharge Date</label>
                                        <input type="date" id="discharge-date-input" class="w-full mt-1 p-2 border rounded-lg" value="${patient.dischargeDate}">
                                        <button id="set-discharge-btn" class="w-full bg-blue-500 text-white font-bold py-2 rounded-lg shadow-md mt-2">Set Discharge</button>
                                    </div>
                                </div>
                            `;
                        }

                        let medicationsHTML = '';
                        if (patient.medications && patient.medications.length > 0) {
                            medicationsHTML = patient.medications.map(med => {
                                return `
                                    <tr>
                                        <td class="py-2">${med.name} (${med.frequency})</td>
                                        <td class="py-2 text-center">${med.dosage}</td>
                                        <td class="py-2 text-center"><input type="checkbox" ${med.isGiven ? 'checked' : ''} class="med-checkbox"></td>
                                    </tr>
                                `;
                            }).join('');
                        } else {
                            medicationsHTML = `<tr><td colspan="3" class="text-center text-gray-500 py-4">No medications added.</td></tr>`;
                        }

                        let notesHTML = '';
                        if (patient.notes && patient.notes.length > 0) {
                            notesHTML = patient.notes.map(note => {
                                return `<div class="p-3 bg-gray-100 rounded-lg text-sm mb-2">${note.text} <span class="text-xs text-gray-500 float-right">${note.time}</span></div>`;
                            }).join('');
                        } else {
                            notesHTML = `<p class="text-center text-gray-500 text-sm mt-4">No notes for this patient.</p>`;
                        }

                        let detailHTML = `
                            <h1 class="text-3xl font-bold text-gray-800 px-2 mb-4">${patient.name}</h1>
                            <div class="px-2 space-y-4">
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="bg-white p-4 rounded-lg shadow-sm">
                                        <h3 class="font-semibold text-gray-500 text-sm">Age</h3>
                                        <p class="text-xl font-bold">${patient.age}</p>
                                    </div>
                                    <div class="bg-white p-4 rounded-lg shadow-sm">
                                        <h3 class="font-semibold text-gray-500 text-sm">Bed</h3>
                                        <p class="text-xl font-bold">${patient.bed}</p>
                                    </div>
                                    <div class="bg-white p-4 rounded-lg shadow-sm col-span-2">
                                        <h3 class="font-semibold text-gray-500 text-sm">Reason for Admission</h3>
                                        <p class="text-lg font-bold">${patient.reason}</p>
                                    </div>
                                </div>
                                ${dischargeInfoHTML}
                            </div>
                            <h2 class="text-2xl font-bold text-gray-800 px-2 mt-6 mb-2">Live Vitals</h2>
                            <div class="grid grid-cols-2 gap-4 px-2 text-center">
                                <div class="bg-white p-4 rounded-lg shadow-sm"><p class="font-bold text-2xl">${patient.vitals.hr}</p><p class="text-sm text-gray-500">Heart Rate</p></div>
                                <div class="bg-white p-4 rounded-lg shadow-sm"><p class="font-bold text-2xl">${patient.vitals.spo2}%</p><p class="text-sm text-gray-500">SpO2</p></div>
                                <div class="bg-white p-4 rounded-lg shadow-sm"><p class="font-bold text-2xl">${patient.vitals.bp}</p><p class="text-sm text-gray-500">Blood Pressure</p></div>
                                <div class="bg-white p-4 rounded-lg shadow-sm"><p class="font-bold text-2xl">${patient.vitals.rr}</p><p class="text-sm text-gray-500">Resp. Rate</p></div>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-800 px-2 mt-6 mb-2">Live ECG Graph</h2>
                            <div class="px-2 mb-4">
                                <canvas id="ecg-graph-canvas" class="ecg-graph w-full h-40"></canvas>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-800 px-2 mt-6 mb-2">Medication & Prescription</h2>
                            <div class="bg-white p-4 rounded-lg shadow-sm">
                                <table class="w-full text-left text-sm">
                                    <thead>
                                        <tr class="border-b">
                                            <th>Medication</th>
                                            <th class="text-center">Dose</th>
                                            <th class="text-center">Given</th>
                                        </tr>
                                    </thead>
                                    <tbody id="medication-table-body">
                                        ${medicationsHTML}
                                    </tbody>
                                </table>
                                <button id="add-prescription-btn" class="w-full bg-yellow-500 text-white font-bold py-2 rounded-lg shadow-md mt-4 hover:bg-yellow-600 transition">Add New Prescription</button>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-800 px-2 mt-6 mb-2">Notes</h2>
                            <div class="bg-white p-4 rounded-lg shadow-sm">
                                <div id="notes-container">${notesHTML}</div>
                                <div class="mt-4 flex gap-2">
                                    <input type="text" id="new-note-input" class="flex-grow p-2 border rounded-lg" placeholder="Add a new note...">
                                    <button id="add-note-btn" class="bg-green-500 text-white p-2 rounded-lg"><i class="hi hi-plus"></i></button>
                                </div>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-800 px-2 mt-6 mb-2">Alarm History</h2>
                            <div class="w-full flex-grow overflow-y-auto space-y-2 p-1">
                        `;
                        patient.history.forEach(h => {
                            const bgColor = h.type === 'High Heart Rate' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600';
                            detailHTML += `<div class="flex items-center bg-white p-3 rounded-lg shadow-sm"><div class="p-2 ${bgColor} rounded-full mr-3"><i class="hi hi-bell-alert"></i></div><div><h3 class="font-semibold">${h.type}</h3><p class="text-xs text-gray-500">${h.time}</p></div></div>`;
                        });
                        detailHTML += `</div>`;
                        page.innerHTML = detailHTML;
                        
                        const canvas = document.getElementById('ecg-graph-canvas');
                        if (canvas) {
                            canvas.width = canvas.offsetWidth;
                            canvas.height = canvas.offsetHeight;
                            drawEcgGraph('ecg-graph-canvas', patient.vitals.hr);
                        }

                       
                        if (document.getElementById('add-prescription-btn')) {
                            document.getElementById('add-prescription-btn').addEventListener('click', () => {
                                alert('Simulating adding a new prescription/medication.');
                            });
                        }

                        document.querySelectorAll('.med-checkbox').forEach(checkbox => {
                            checkbox.addEventListener('change', (e) => {
                                if (e.target.checked) {
                                    alert('Medication given. A log has been created.');
                                } else {
                                    alert('Medication log reversed.');
                                }
                            });
                        });

                        if (document.getElementById('set-discharge-btn')) {
                            document.getElementById('set-discharge-btn').addEventListener('click', () => {
                                const dischargeDateInput = document.getElementById('discharge-date-input').value;
                                if (dischargeDateInput) {
                                    alert(`Discharge date set for ${patient.name} to ${dischargeDateInput}.`);
                                    patient.dischargeDate = dischargeDateInput;
                                    showPage('my-patients-container');
                                } else {
                                    alert('Please select a valid date.');
                                }
                            });
                        }
                        if (document.getElementById('add-note-btn')) {
                            document.getElementById('add-note-btn').addEventListener('click', () => {
                                const newNoteInput = document.getElementById('new-note-input');
                                if (newNoteInput.value.trim() !== '') {
                                    alert('Note added.');
                                    showPage('my-patients-container');
                                } else {
                                    alert('Please enter a note.');
                                }
                            });
                        }
                    } else if (pageId === 'live-alarms-container') {
                        let liveAlarmsHTML = `<h1 class="text-3xl font-bold text-gray-800 px-2 mb-4">Live Alarms</h1><div class="w-full flex-grow overflow-y-auto space-y-2 p-1">`;
                        if (liveAlarms.length === 0) {
                            liveAlarmsHTML += `<p class="text-center text-gray-500 mt-8">No active alarms.</p>`;
                        } else {
                            liveAlarms.forEach(alarm => {
                                const timeString = alarm.triggeredAt.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                                const bgColor = alarm.severity === 'severe' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600';
                                liveAlarmsHTML += `<div class="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"><div class="flex items-center"><div class="p-2 ${bgColor} rounded-full mr-3"><i class="hi hi-bell-alert"></i></div><div><h3 class="font-semibold">${alarm.type}</h3><p class="text-xs text-gray-500">${alarm.patient.name} - ${alarm.patient.bed} • ${timeString}</p></div></div><button class="respond-live-alarm bg-blue-500 text-white text-xs px-3 py-1 rounded-full" data-alarm-id="${alarm.id}">Respond</button></div>`;
                            });
                        }
                        liveAlarmsHTML += `</div>`;
                        page.innerHTML = liveAlarmsHTML;
                        document.querySelectorAll('.respond-live-alarm').forEach(btn => {
                            btn.addEventListener('click', () => {
                                const alarm = liveAlarms.find(a => a.id == btn.dataset.alarmId);
                                if (alarm) triggerMobileAlarm(alarm.severity, alarm.id, alarm.patient);
                            });
                        });
                    } else if (pageId === 'history-container') {
                        let historyHTML = `<h1 class="text-3xl font-bold text-gray-800 px-2 mb-4">Alarm History</h1><div id="history-list" class="w-full flex-grow space-y-2 p-1">`;
                        if (alarmHistory.length === 0) {
                            historyHTML += `<p class="text-center text-gray-500 mt-8">No alarm history yet.</p>`;
                        } else {
                            alarmHistory.forEach(h => {
                                const bgColor = h.severity === 'severe' ? 'bg-red-100 text-red-600' : (h.severity === 'moderate' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600');
                                historyHTML += `<div class="flex items-center bg-white p-3 rounded-lg shadow-sm"><div class="p-2 ${bgColor} rounded-full mr-3"><i class="hi hi-bell-alert"></i></div><div><h3 class="font-semibold">${h.type}</h3><p class="text-xs text-gray-500">${h.patient.name} - ${h.time}</p></div></div>`;
                            });
                        }
                        historyHTML += `</div>`;
                        page.innerHTML = historyHTML;
                    } else if (pageId === 'admin-panel-container') {
                        page.innerHTML = `<h1 class="text-3xl font-bold text-gray-800 px-2 mb-4">Admin Panel</h1>
                                                 <div class="w-full flex-grow space-y-4 p-1">
                                                     <div class="bg-white p-4 rounded-lg shadow-sm">
                                                         <h3 class="text-lg font-bold">Heart Rate <span class="text-sm font-normal text-gray-500">(bpm)</span></h3>
                                                         <div class="grid grid-cols-3 gap-2 mt-2 text-center">
                                                             <div><label class="text-xs font-semibold text-red-600">Critical</label><input type="text" value="> 150 or < 40" class="w-full text-sm p-2 border rounded mt-1"></div>
                                                             <div><label class="text-xs font-semibold text-yellow-600">Warning</label><input type="text" value="> 120 or < 50" class="w-full text-sm p-2 border rounded mt-1"></div>
                                                             <div><label class="text-xs font-semibold text-green-600">Normal</label><input type="text" value="60-100" class="w-full text-sm p-2 border rounded mt-1 bg-green-50" readonly></div>
                                                         </div>
                                                     </div>
                                                     <div class="bg-white p-4 rounded-lg shadow-sm">
                                                         <h3 class="text-lg font-bold">SpO2 <span class="text-sm font-normal text-gray-500">(%)</span></h3>
                                                         <div class="grid grid-cols-3 gap-2 mt-2 text-center">
                                                             <div><label class="text-xs font-semibold text-red-600">Critical</label><input type="text" value="< 85" class="w-full text-sm p-2 border rounded mt-1"></div>
                                                             <div><label class="text-xs font-semibold text-yellow-600">Warning</label><input type="text" value="< 90" class="w-full text-sm p-2 border rounded mt-1"></div>
                                                             <div><label class="text-xs font-semibold text-green-600">Normal</label><input type="text" value="> 95" class="w-full text-sm p-2 border rounded mt-1 bg-green-50" readonly></div>
                                                         </div>
                                                     </div>
                                                     <button id="save-admin-changes" class="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow-md mt-4">Save Changes</button>
                                                 </div>`;
                        document.getElementById('save-admin-changes').addEventListener('click', () => {
                            const confirmationPage = document.getElementById('confirmation-container');
                            confirmationPage.innerHTML = `<i class="hi hi-check-badge text-8xl text-green-500 mb-6"></i><h2 class="text-3xl font-bold text-green-800 mb-4">Settings Saved</h2>`;
                            showPage('confirmation-container');
                        });
                    } else if (pageId === 'responded-alarms-container') {
                        let respondedHTML = `<h1 class="text-3xl font-bold text-gray-800 px-2 mb-4">Responded Alarms</h1><div class="w-full flex-grow overflow-y-auto space-y-2 p-1">`;
                        if (alarmHistory.length === 0) {
                            respondedHTML += `<p class="text-center text-gray-500 mt-8">No responded alarms yet.</p>`;
                        } else {
                            alarmHistory.forEach(h => {
                                const bgColor = h.severity === 'severe' ? 'bg-red-100 text-red-600' : (h.severity === 'moderate' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600');
                                respondedHTML += `<div class="bg-white p-3 rounded-lg shadow-sm">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center">
                                            <div class="p-2 ${bgColor} rounded-full mr-3"><i class="hi hi-bell-alert"></i></div>
                                            <div>
                                                <h3 class="font-semibold">${h.type}</h3>
                                                <p class="text-xs text-gray-500">${h.patient.name}, ${h.patient.age} | Bed: ${h.patient.bed}</p>
                                            </div>
                                        </div>
                                        <span class="text-xs text-gray-500">${h.time}</span>
                                    </div>
                                    <div class="mt-2 pt-2 border-t text-xs text-gray-600">
                                        <p>Responded by: Shivani</p>
                                        <p>Vitals at time of alarm: HR: ${h.patient.vitals.hr}, SpO2: ${h.patient.vitals.spo2}%, BP: ${h.patient.vitals.bp}, RR: ${h.patient.vitals.rr}</p>
                                    </div>
                                </div>`;
                            });
                        }
                        respondedHTML += `</div>`;
                        page.innerHTML = respondedHTML;
                    } else if (pageId === 'team-chat-container') {
                        page.innerHTML = `<h1 class="text-3xl font-bold text-gray-800 px-2 mb-4">Team Chat</h1>
                                                 <div id="chat-messages" class="flex-grow space-y-4 text-base p-2">
                                                     <div class="text-left"><span class="p-3 bg-sky-100 rounded-lg inline-block">Rohan ki vitals sahi hai raat bhar se</span></div>
                                                     <div class="text-right"><span class="p-3 bg-gray-200 rounded-lg inline-block">Accha thik hai</span></div>
                                                 </div>
                                                 <div class="p-2 bg-white border-t">
                                                     <div class="flex gap-2">
                                                         <input type="text" id="chat-input" class="flex-grow border rounded-lg px-3" placeholder="Type a message...">
                                                         <button id="send-chat-btn" class="bg-blue-500 text-white p-3 rounded-lg"><i class="hi hi-paper-airplane"></i></button>
                                                     </div>
                                                 </div>`;
                        document.getElementById('send-chat-btn').addEventListener('click', () => {
                            const input = document.getElementById('chat-input');
                            if (input.value.trim() !== '') {
                                const messages = document.getElementById('chat-messages');
                                const newMsg = document.createElement('div');
                                newMsg.className = 'text-right';
                                newMsg.innerHTML = `<span class="p-3 bg-gray-200 rounded-lg inline-block">${input.value}</span>`;
                                messages.appendChild(newMsg);
                                input.value = '';
                                messages.scrollTop = messages.scrollHeight;
                            }
                        });
                    } else if (pageId === 'features-container') {
                        page.innerHTML = `<h1 class="text-3xl font-bold text-gray-800 px-2 mb-4">Features</h1>
                                                 <div class="w-full flex-grow overflow-y-auto space-y-2 p-1">
                                                     <div class="feature-item flex items-center bg-white p-3 rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition" data-title="AI SILENT MODE" data-description="Intelligently mutes false alarms based on learned patterns, reducing unnecessary noise and allowing caregivers to focus on genuine alerts."><div class="p-2 bg-red-100 text-red-600 rounded-full mr-3"><i class="hi hi-no-symbol"></i></div><div><h3 class="font-semibold">AI SILENT MODE</h3><p class="text-xs text-gray-500">Intelligently mutes false alarms.</p></div></div>
                                                     <div class="feature-item flex items-center bg-white p-3 rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition" data-title="PREDICTIVE ALERT" data-description="Uses trend analysis to warn staff of deteriorating patient vitals before a critical alarm triggers, enabling proactive intervention."><div class="p-2 bg-orange-100 text-orange-600 rounded-full mr-3"><i class="hi hi-exclamation-triangle"></i></div><div><h3 class="font-semibold">PREDICTIVE ALERT</h3><p class="text-xs text-gray-500">Warns staff before a critical alarm triggers.</p></div></div>
                                                 </div>`;
                        
                        document.querySelectorAll('.feature-item').forEach(item => {
                            item.addEventListener('click', () => {
                                alert(`${item.dataset.title}: ${item.dataset.description}`);
                            });
                        });
                    }


                    setTimeout(() => page.classList.add('active'), 50);
                }

                if (pageId === 'dashboard-container') {
                    const menuBtn = document.getElementById('mobile-menu-btn');
                    if (menuBtn) menuBtn.addEventListener('click', toggleMobileMenu);
                    document.querySelector('#dashboard-container button[data-target="my-patients-container"]').addEventListener('click', () => showPage('my-patients-container'));
                    document.querySelector('#dashboard-container button[data-target="live-alarms-container"]').addEventListener('click', () => showPage('live-alarms-container'));
                    document.querySelector('#dashboard-container button[data-target="responded-alarms-container"]').addEventListener('click', () => showPage('responded-alarms-container'));
                    renderResponseHistoryChart();
                }

                bottomNavBar.classList.toggle('hidden', pageId === 'login-container' || pageId === 'dashboard-container');
            };

            const toggleMobileMenu = () => {
                mobileMenu.classList.toggle('open');
                mobileMenuOverlay.classList.toggle('hidden');
                mobileMenuOverlay.classList.toggle('opacity-0');
            };

            document.getElementById('main-login-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('main-email').value;
                const password = document.getElementById('main-password').value;
                const errorMsg = document.getElementById('login-error-message');

                if (email === 'gecare.com' && password === 'medsanchar') {
                    if (errorMsg) errorMsg.classList.add('hidden');
                    showPage('dashboard-container');
                    leftDeviceContainer.classList.remove('hidden');
                    rightDeviceContainer.classList.remove('hidden');
                   
                    alarmInterval = setInterval(() => triggerAlarm(true, true), 30000);
                    vitalsInterval = setInterval(updateVitals, 3000);
                } else {
                    if (errorMsg) errorMsg.classList.remove('hidden');
                }
            });

            const signOut = () => {
                showPage('login-container');
                leftDeviceContainer.classList.add('hidden');
                rightDeviceContainer.classList.add('hidden');
                if (mobileMenu.classList.contains('open')) {
                    toggleMobileMenu();
                }
                clearInterval(alarmInterval);
                clearInterval(vitalsInterval);
                liveAlarms = [];
                liveAlarmsCount = 0;
                respondedAlarmsCount = 0;
            };

            document.querySelectorAll('.mobile-nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetPage = e.currentTarget.dataset.target;
                    showPage(targetPage);
                    toggleMobileMenu();
                });
            });

            const mobileSignOutBtn = document.getElementById('mobile-sign-out-btn');
            if (mobileSignOutBtn) mobileSignOutBtn.addEventListener('click', signOut);

            const menuCloseBtn = document.getElementById('mobile-menu-btn-close');
            if (menuCloseBtn) menuCloseBtn.addEventListener('click', toggleMobileMenu);
            if (mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', toggleMobileMenu);

            document.querySelector('.home-btn').addEventListener('click', () => showPage('dashboard-container'));

            const triggerMobileAlarm = (severity, alarmId, patient) => {
                const alarmPage = document.getElementById('alarm-menu-container');
                let alarmType = 'HIGH HEART RATE ALARM';
                let value = `"${patient.vitals.hr} BPM"`;
                let bgColor = 'bg-red-500';
                let iconColor = 'text-red-500';

                if (severity === 'moderate') {
                    alarmType = 'LOW SPO2 WARNING';
                    value = `"${patient.vitals.spo2}%"`;
                    bgColor = 'bg-yellow-500';
                    iconColor = 'text-yellow-500';
                } else if (severity === 'normal') {
                    alarmType = 'DEVICE DISCONNECTED';
                    value = 'Informational';
                    bgColor = 'bg-green-500';
                    iconColor = 'text-green-500';
                }

                alarmPage.innerHTML = `
                    <div class="flex flex-col items-center justify-start w-full h-full p-4 space-y-3 pt-8" style="background-color: #c7e5ff;">
                        <div class="relative mb-3">
                            <i class="hi hi-bell h-20 w-20 ${iconColor} ${severity === 'severe' ? 'pulsing-alarm' : ''}"></i>
                            <span class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 ${bgColor} rounded-full">1</span>
                        </div>
                        <button class="w-full ${bgColor} text-white font-bold py-3 rounded-2xl shadow-md">${alarmType}<br>${value}</button>
                        <button class="w-full ${bgColor} text-white font-bold py-3 rounded-2xl shadow-md">PATIENT: ${patient.name}<br>BED: ${patient.bed}</button>

                        <div class="w-full bg-white/50 p-2 rounded-lg grid grid-cols-3 gap-2 text-sm text-center">
                            <div><span class="font-semibold block text-xs">HR</span> ${patient.vitals.hr}</div>
                            <div><span class="font-semibold block text-xs">SpO2</span> ${patient.vitals.spo2}%</div>
                            <div class="flex items-center justify-center gap-1 text-red-500 font-bold text-xs blinking-live"><div class="w-2 h-2 bg-red-500 rounded-full"></div>LIVE</div>
                            <div><span class="font-semibold block text-xs">BP</span> ${patient.vitals.bp}</div>
                            <div><span class="font-semibold block text-xs">RR</span> ${patient.vitals.rr}</div>
                        </div>

                        <button id="respond-alarm-btn" class="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl shadow-md flex items-center justify-center">RESPOND ALARM <i class="hi hi-exclamation-triangle text-white ml-3 text-2xl"></i></button>
                        <button id="patient-under-control-btn" class="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl shadow-md flex items-center justify-center">PATIENT UNDER CONTROL <i class="hi hi-hand-thumb-up text-white ml-3 text-2xl"></i></button>
                        <div class="w-full grid grid-cols-2 gap-3">
                            <button id="not-available-btn" class="w-full bg-green-500 text-white font-bold py-2 rounded-2xl shadow-md text-xs">I AM NOT<br>AVAILABLE</button>
                            <button id="delegate-btn" class="w-full bg-green-500 text-white font-bold py-2 rounded-2xl shadow-md text-xs">NOTIFY THE<br>SENIOR NURSE</button>
                        </div>
                        <button id="mute-btn" class="w-full bg-purple-600 text-white font-bold py-2 rounded-2xl shadow-md text-sm">MUTE ALARM<br><span class="text-xs font-normal">(REQUIRES FACE ID)</span></button>
                    </div>
                `;
                showPage('alarm-menu-container');

                
                document.getElementById('respond-alarm-btn').addEventListener('click', () => {
                    const directionsPage = document.getElementById('directions-container');
                    directionsPage.innerHTML = `
                        <h2 class="text-3xl font-bold text-blue-800 mb-8 text-center">Directions to Patient</h2>
                        <div class="text-xl text-gray-700 space-y-4">
                            <p class="flex items-center"><i class="hi hi-building-office-2 text-blue-500 mr-4"></i>Go to <span class="font-bold ml-1">Second Floor</span>.</p>
                            <p class="flex items-center"><i class="hi hi-arrows-right-left text-blue-500 mr-4"></i>Turn <span class="font-bold ml-1">Left</span> from the main lift.</p>
                            <p class="flex items-center"><i class="hi hi-map-pin text-blue-500 mr-4"></i>Enter <span class="font-bold ml-1">Ward 18</span> on your right.</p>
                            <p class="flex items-center"><i class="hi hi-bed text-blue-500 mr-4"></i>Patient is in <span class="font-bold ml-1">Bed 23</span>.</p>
                        </div>
                        <button id="reached-btn" class="w-full bg-green-500 text-white font-bold py-3 rounded-lg shadow-md mt-8">REACHED</button>
                    `;
                    showPage('directions-container');
                    document.getElementById('reached-btn').addEventListener('click', () => {
                        const confirmationPage = document.getElementById('confirmation-container');
                        confirmationPage.innerHTML = `<i class="hi hi-check-badge text-8xl text-green-500 mb-6"></i><h2 class="text-3xl font-bold text-green-800 mb-4">THANKS FOR CONFIRMING</h2>`;
                        showPage('confirmation-container');
                        resolveAlarm(alarmId);
                    });
                });

                document.getElementById('patient-under-control-btn').addEventListener('click', () => {
                    const confirmationPage = document.getElementById('confirmation-container');
                    confirmationPage.innerHTML = `<i class="hi hi-check-badge text-8xl text-green-500 mb-6"></i><h2 class="text-3xl font-bold text-green-800 mb-4">Status Updated</h2><p class="text-lg text-gray-700">Patient is now under control.</p>`;
                    showPage('confirmation-container');
                    resolveAlarm(alarmId);
                });

                document.getElementById('delegate-btn').addEventListener('click', () => {
                    const confirmationPage = document.getElementById('confirmation-container');
                    confirmationPage.innerHTML = `<i class="hi hi-check-badge text-8xl text-green-500 mb-6"></i><h2 class="text-3xl font-bold text-green-800 mb-4">Delegated</h2><p class="text-lg text-gray-700">Alarm sent to next available nurse.</p>`;
                    showPage('confirmation-container');
                    resolveAlarm(alarmId);
                });

                document.getElementById('not-available-btn').addEventListener('click', () => {
                    const confirmationPage = document.getElementById('confirmation-container');
                    confirmationPage.innerHTML = `<i class="hi hi-check-badge text-8xl text-green-500 mb-6"></i><h2 class="text-3xl font-bold text-green-800 mb-4">Rerouted</h2><p class="text-lg text-gray-700">Alarm sent to next available nurse.</p>`;
                    showPage('confirmation-container');
                    resolveAlarm(alarmId);
                });

                document.getElementById('mute-btn').addEventListener('click', () => {
                    const faceIdModal = document.getElementById('face-id-modal');
                    faceIdModal.classList.remove('hidden');
                    setTimeout(() => {
                        faceIdModal.classList.add('hidden');
                        showPage('dashboard-container');
                        resolveAlarm(alarmId);
                    }, 2000);
                });
            };

            const triggerAlarm = (isTrue, isAuto = false) => {
                if (!isAuto) {
                    const analyzingPage = document.getElementById('analyzing-container');
                    analyzingPage.innerHTML = `<i class="hi hi-magnifying-glass text-6xl mb-4"></i><h2 class="text-2xl font-bold mb-2">Analyzing Alarm...</h2><p class="text-lg text-gray-300">Applying 5-second delay logic.</p>`;
                    showPage('analyzing-container');
                }

                setTimeout(() => {
                    let severity = 'normal';
                    if (isTrue) {
                        const random = Math.random();
                        severity = random > 0.5 ? 'severe' : 'moderate';
                    }

                    liveAlarmsCount++;
                    const newAlarmId = Date.now();
                    const randomPatient = patients[Math.floor(Math.random() * patients.length)];
                    const newAlarm = {
                        id: newAlarmId,
                        patient: randomPatient,
                        type: severity === 'severe' ? 'High Heart Rate' : 'Low SpO2',
                        severity: severity,
                        triggeredAt: new Date()
                    };
                    liveAlarms.push(newAlarm);
                    updateDashboardCounts();

                    if (!isAuto) {
                        triggerMobileAlarm(severity, newAlarmId, randomPatient);
                    }

                }, isAuto ? 0 : 5000);
            };

            document.getElementById('trigger-true-alarm').addEventListener('click', () => triggerAlarm(true));
            document.getElementById('trigger-false-alarm').addEventListener('click', () => triggerAlarm(false));

            showPage('login-container');
        });