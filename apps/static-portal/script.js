document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Navbar Effect on Scroll
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Mobile Hamburger Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            if (navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            } else {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '70px';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = '#050810';
                navLinks.style.backdropFilter = 'blur(16px)';
                navLinks.style.padding = '2rem';
                navLinks.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
                navLinks.style.boxShadow = '0 15px 30px rgba(0,0,0,0.8)';
            }
        });
    }

    // 3. Cinematic 3D Anatomical Brain & Wondering Particles Canvas Animation
    const brainCanvas = document.getElementById('heroBrainCanvas');
    if (brainCanvas) {
        const ctx = brainCanvas.getContext('2d');
        let width = brainCanvas.width = 500;
        let height = brainCanvas.height = 500;

        let brainNodes = [];
        let wanderingParticles = [];
        let time = 0;

        function initBrain() {
            brainNodes = [];
            const count = 400;
            for (let i = 0; i < count; i++) {
                const u = Math.random() * Math.PI * 2;
                const v = Math.random() * Math.PI - Math.PI / 2;

                let rx = 120;
                let ry = 85;
                let rz = 95;

                const fold = Math.sin(u * 8) * Math.cos(v * 7) * 8 + Math.cos(u * 14 - v * 10) * 4;
                let x = (rx + fold) * Math.cos(v) * Math.cos(u);
                let y = (ry + fold) * Math.sin(v) * 0.85 - 10;
                let z = (rz + fold) * Math.cos(v) * Math.sin(u);

                if (x > 0) x *= 1.1;
                if (y > 25) { x *= 0.85; z *= 0.9; }

                brainNodes.push({
                    ox: x,
                    oy: y,
                    oz: z,
                    radius: Math.random() * 3.5 + 2.5,
                    offset: Math.random() * Math.PI * 2
                });
            }
        }

        function initParticles() {
            wanderingParticles = [];
            const count = 50;
            for (let i = 0; i < count; i++) {
                wanderingParticles.push({
                    x: (Math.random() - 0.5) * 350,
                    y: (Math.random() - 0.5) * 350,
                    z: (Math.random() - 0.5) * 200,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: (Math.random() - 0.5) * 0.6,
                    vz: (Math.random() - 0.5) * 0.6,
                    size: Math.random() * 2 + 1,
                    alpha: Math.random() * 0.7 + 0.3
                });
            }
        }

        initBrain();
        initParticles();

        function animateBrain(timestamp) {
            time = timestamp;
            ctx.clearRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height / 2;

            const breath = Math.sin(time * 0.0015) * 5;
            const scaleBreath = 1 + Math.sin(time * 0.0015) * 0.012;
            const glowPulse = (Math.sin(time * 0.002) + 1) / 2;

            const coreGlow = ctx.createRadialGradient(
                centerX, centerY + breath, 10,
                centerX, centerY + breath, 200
            );
            coreGlow.addColorStop(0, `rgba(34, 211, 238, ${0.2 + glowPulse * 0.1})`);
            coreGlow.addColorStop(0.5, `rgba(99, 102, 241, ${0.08 + glowPulse * 0.05})`);
            coreGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = coreGlow;
            ctx.fillRect(0, 0, width, height);

            const rotY = time * 0.0003;
            const cosY = Math.cos(rotY);
            const sinY = Math.sin(rotY);
            const cosX = Math.cos(0.2);
            const sinX = Math.sin(0.2);

            wanderingParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;

                if (p.x < -180 || p.x > 180) p.vx *= -1;
                if (p.y < -180 || p.y > 180) p.vy *= -1;
                if (p.z < -100 || p.z > 100) p.vz *= -1;

                let x1 = p.x * cosY + p.z * sinY;
                let z1 = -p.x * sinY + p.z * cosY;
                let y1 = p.y * cosX - z1 * sinX;
                let perspective = 500 / (500 - z1);

                let px = centerX + x1 * perspective;
                let py = centerY + y1 * perspective;

                ctx.beginPath();
                ctx.arc(px, py, p.size * perspective, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(34, 211, 238, ${p.alpha})`;
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#22D3EE';
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            const projected = brainNodes.map(node => {
                let x = node.ox * scaleBreath;
                let y = (node.oy + breath) * scaleBreath;
                let z = node.oz * scaleBreath;

                let x1 = x * cosY + z * sinY;
                let z1 = -x * sinY + z * cosY;
                let y1 = y;

                let y2 = y1 * cosX - z1 * sinX;
                let z2 = y1 * sinX + z1 * cosX;
                let x2 = x1;

                let perspective = 500 / (500 - z2);
                return {
                    x: centerX + x2 * perspective,
                    y: centerY + y2 * perspective,
                    z: z2,
                    radius: node.radius * perspective,
                    offset: node.offset
                };
            });

            projected.sort((a, b) => a.z - b.z);

            projected.forEach(node => {
                const wave = (Math.sin(time * 0.0025 + node.offset) + 1) / 2;
                const alpha = Math.min(1, Math.max(0.2, (node.z + 100) / 200));

                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius * 1.8, 0, Math.PI * 2);

                const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 1.8);
                grad.addColorStop(0, `rgba(255, 255, 255, ${0.8 + wave * 0.2})`);
                grad.addColorStop(0.4, `rgba(34, 211, 238, ${0.7 * alpha})`);
                grad.addColorStop(1, `rgba(10, 15, 30, ${0.9 * alpha})`);

                ctx.fillStyle = grad;
                ctx.shadowBlur = 6;
                ctx.shadowColor = '#22D3EE';
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            requestAnimationFrame(animateBrain);
        }

        requestAnimationFrame(animateBrain);
    }

    // =========================================================================
    // 4. REAL-TIME FLOATING AI COMPANION & VOICE TALK WIDGET
    // =========================================================================
    const chatContainer = document.createElement('div');
    chatContainer.id = 'staticFloatingChat';
    chatContainer.innerHTML = `
        <button id="staticChatToggle" class="static-chat-btn" title="Talk with MediGrid Real-Time AI">
            <i class="fa-solid fa-robot"></i>
            <span>Talk with AI</span>
            <span class="chat-live-indicator"></span>
        </button>
        <div id="staticChatBox" class="static-chat-modal" style="display: none;">
            <div class="static-chat-head">
                <div class="sch-left">
                    <div class="sch-avatar"><i class="fa-solid fa-sparkles"></i></div>
                    <div>
                        <strong>MediBot Real-Time AI</strong>
                        <small>● Online & Voice Ready</small>
                    </div>
                </div>
                <div class="sch-actions">
                    <button id="staticVoiceToggle" title="Toggle voice readback"><i class="fa-solid fa-volume-high" id="staticVoiceIcon"></i></button>
                    <button id="staticChatClose" title="Close chat"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <div id="staticChatBody" class="static-chat-body">
                <div class="sc-msg ai">
                    <div class="sc-bubble">
                        👋 <strong>Hello! I'm your MediGrid Real-Time AI Companion.</strong><br><br>
                        I'm right here to talk with you. You can type your thoughts or click the <strong>🎙️ Mic</strong> to speak aloud. How are you feeling today?
                    </div>
                </div>
            </div>
            <div class="sc-suggestions" id="staticSuggestions">
                <button class="sc-chip" data-msg="Can we talk? I would love to share how my day is going.">💬 Let's talk</button>
                <button class="sc-chip" data-msg="I feel a bit anxious and overwhelmed today.">⚡ Anxiety relief</button>
                <button class="sc-chip" data-msg="Guide me through calming box breathing (4-4-4-4).">🧘 Box breathing</button>
                <button class="sc-chip" data-msg="Play peace music and Solfeggio soundscapes.">🎵 Play peace music</button>
            </div>
            <div class="static-chat-foot">
                <button id="staticMicBtn" class="sc-mic-btn" title="Click to speak with microphone"><i class="fa-solid fa-microphone"></i></button>
                <input type="text" id="staticChatInput" placeholder="Type or click 🎙️ to talk..." />
                <button id="staticSendBtn" class="sc-send-btn" title="Send message"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>
    `;
    document.body.appendChild(chatContainer);

    const chatToggle = document.getElementById('staticChatToggle');
    const chatBox = document.getElementById('staticChatBox');
    const chatClose = document.getElementById('staticChatClose');
    const chatInput = document.getElementById('staticChatInput');
    const sendBtn = document.getElementById('staticSendBtn');
    const micBtn = document.getElementById('staticMicBtn');
    const voiceToggle = document.getElementById('staticVoiceToggle');
    const voiceIcon = document.getElementById('staticVoiceIcon');
    const chatBody = document.getElementById('staticChatBody');
    const suggestions = document.getElementById('staticSuggestions');

    let voiceEnabled = true;
    let isListening = false;
    let recognition = null;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
        recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isListening = true;
            micBtn.classList.add('recording');
            chatInput.placeholder = "🎙️ Listening... speak now";
        };

        recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            if (transcript) {
                chatInput.value = transcript;
                sendStaticMessage(transcript);
            }
        };

        recognition.onerror = () => {
            isListening = false;
            micBtn.classList.remove('recording');
            chatInput.placeholder = "Type or click 🎙️ to talk...";
        };

        recognition.onend = () => {
            isListening = false;
            micBtn.classList.remove('recording');
            chatInput.placeholder = "Type or click 🎙️ to talk...";
        };
    }

    function speakStaticText(text) {
        if (!voiceEnabled || !window.speechSynthesis) return;
        try {
            window.speechSynthesis.cancel();
            const clean = text.replace(/[*_#`~>\[\]()•\-]/g, ' ').replace(/\s+/g, ' ').trim();
            const utter = new SpeechSynthesisUtterance(clean);
            utter.rate = 1.0;
            utter.pitch = 1.02;
            window.speechSynthesis.speak(utter);
        } catch (e) {
            console.warn('Speech synthesis error:', e);
        }
    }

    if (chatToggle && chatBox) {
        chatToggle.addEventListener('click', () => {
            const isHidden = chatBox.style.display === 'none';
            chatBox.style.display = isHidden ? 'flex' : 'none';
            if (isHidden) chatInput.focus();
        });
    }

    if (chatClose) {
        chatClose.addEventListener('click', () => {
            chatBox.style.display = 'none';
        });
    }

    if (voiceToggle) {
        voiceToggle.addEventListener('click', () => {
            voiceEnabled = !voiceEnabled;
            voiceIcon.className = voiceEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
            if (!voiceEnabled && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        });
    }

    if (micBtn) {
        micBtn.addEventListener('click', () => {
            if (!recognition) {
                alert("Voice recognition is not supported in this browser. Please try Google Chrome or Edge.");
                return;
            }
            if (isListening) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    }

    async function sendStaticMessage(textToSend) {
        const text = (textToSend || chatInput.value).trim();
        if (!text) return;

        // Append user bubble
        const userRow = document.createElement('div');
        userRow.className = 'sc-msg user';
        userRow.innerHTML = `<div class="sc-bubble">${escapeHtml(text)}</div>`;
        chatBody.appendChild(userRow);
        chatInput.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;

        // Loading indicator
        const loadingRow = document.createElement('div');
        loadingRow.className = 'sc-msg ai';
        loadingRow.id = 'scLoadingBubble';
        loadingRow.innerHTML = `<div class="sc-bubble" style="opacity: 0.7;">Reflecting & listening...</div>`;
        chatBody.appendChild(loadingRow);
        chatBody.scrollTop = chatBody.scrollHeight;

        try {
            const res = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            if (res.ok) {
                const data = await res.json();
                const aiReply = data.reply;
                const loading = document.getElementById('scLoadingBubble');
                if (loading) loading.remove();

                const aiRow = document.createElement('div');
                aiRow.className = 'sc-msg ai';
                aiRow.innerHTML = `<div class="sc-bubble">${formatMarkdown(aiReply)}</div>`;
                chatBody.appendChild(aiRow);
                chatBody.scrollTop = chatBody.scrollHeight;

                if (voiceEnabled) {
                    speakStaticText(aiReply);
                }
            } else {
                throw new Error("API Offline");
            }
        } catch (e) {
            const loading = document.getElementById('scLoadingBubble');
            if (loading) loading.remove();

            const fallbackReply = "I am right here with you. Let's take a calm breath together. You can explore our DASS-42 screener or listen to gentle peace music in the ML Dashboard.";
            const aiRow = document.createElement('div');
            aiRow.className = 'sc-msg ai';
            aiRow.innerHTML = `<div class="sc-bubble">${fallbackReply}</div>`;
            chatBody.appendChild(aiRow);
            chatBody.scrollTop = chatBody.scrollHeight;

            if (voiceEnabled) {
                speakStaticText(fallbackReply);
            }
        }
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function formatMarkdown(str) {
        return escapeHtml(str)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', () => sendStaticMessage());
    }

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendStaticMessage();
        });
    }

    if (suggestions) {
        suggestions.addEventListener('click', (e) => {
            const chip = e.target.closest('.sc-chip');
            if (chip && chip.dataset.msg) {
                sendStaticMessage(chip.dataset.msg);
            }
        });
    }
});