/* ============================================
   INTERACTIVE EXERCISES — Drag & Drop, Flashcards, Subnet Calc
   ============================================ */

const InteractiveEngine = {

    escapeAttr(str) {
        return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    render(exercises) {
        const container = document.getElementById('tab-interactive');
        if (!exercises || exercises.length === 0) {
            container.innerHTML = '<p>No interactive exercises for this module yet.</p>';
            return;
        }

        container.innerHTML = exercises.map(ex => {
            switch (ex.type) {
                case 'drag-drop': return this.renderDragDrop(ex);
                case 'subnet-calculator': return this.renderSubnetCalculator(ex);
                case 'flashcards': return this.renderFlashcards(ex);
                default: return '';
            }
        }).join('');

        // Initialize drag-drop after render
        exercises.forEach(ex => {
            if (ex.type === 'drag-drop') this.initDragDrop(ex.id);
        });
    },

    // ─── DRAG & DROP ──────────────────────────────
    renderDragDrop(exercise) {
        const targetNames = Object.keys(exercise.targets);
        return `
        <div class="interactive-exercise" id="exercise-${exercise.id}">
            <h3>🎯 ${exercise.title}</h3>
            <p class="exercise-description">${exercise.description}</p>
            <div class="drag-drop-area">
                <div class="drag-source" id="source-${exercise.id}">
                    <h4 style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">Items to place:</h4>
                    ${this.shuffle(exercise.items).map(item => `
                        <div class="drag-item" draggable="true" data-exercise="${this.escapeAttr(exercise.id)}" data-value="${this.escapeAttr(item)}">
                            ${this.escapeAttr(item)}
                        </div>
                    `).join('')}
                </div>
                <div class="drag-target">
                    ${targetNames.map(target => `
                        <div style="margin-bottom:12px">
                            <div class="label" style="font-weight:600;font-size:13px;margin-bottom:4px">${target}</div>
                            <div class="drop-zone" data-exercise="${exercise.id}" data-target="${target}">
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div style="margin-top:12px;display:flex;gap:8px">
                <button class="btn-primary" onclick="InteractiveEngine.checkDragDrop('${exercise.id}')">Check Answers</button>
                <button class="btn-secondary" onclick="InteractiveEngine.resetDragDrop('${exercise.id}')">Reset</button>
            </div>
            <div class="lab-validation" id="validation-${exercise.id}"></div>
        </div>
        `;
    },

    initDragDrop(exerciseId) {
        const items = document.querySelectorAll(`.drag-item[data-exercise="${exerciseId}"]`);
        const zones = document.querySelectorAll(`.drop-zone[data-exercise="${exerciseId}"]`);
        const source = document.getElementById(`source-${exerciseId}`);

        items.forEach(item => {
            item.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', e.target.dataset.value);
                e.dataTransfer.setData('exercise', exerciseId);
                e.target.classList.add('dragging');
            });
            item.addEventListener('dragend', e => {
                e.target.classList.remove('dragging');
            });
        });

        const setupDropZone = (zone) => {
            zone.addEventListener('dragover', e => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });
            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });
            zone.addEventListener('drop', e => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                const value = e.dataTransfer.getData('text/plain');
                const exId = e.dataTransfer.getData('exercise');
                if (exId !== exerciseId) return;

                // Find the dragged item
                const draggedItem = document.querySelector(`.drag-item[data-exercise="${exerciseId}"][data-value="${value}"]`);
                if (draggedItem) {
                    zone.appendChild(draggedItem);
                }
            });
        };

        zones.forEach(setupDropZone);

        // Also allow dropping back to source
        if (source) {
            source.addEventListener('dragover', e => e.preventDefault());
            source.addEventListener('drop', e => {
                e.preventDefault();
                const value = e.dataTransfer.getData('text/plain');
                const draggedItem = document.querySelector(`.drag-item[data-exercise="${exerciseId}"][data-value="${value}"]`);
                if (draggedItem) source.appendChild(draggedItem);
            });
        }
    },

    checkDragDrop(exerciseId) {
        // Find the exercise data
        const allModules = typeof MODULES !== 'undefined' ? MODULES : [];
        let exercise = null;
        for (const mod of allModules) {
            if (mod.interactive) {
                const found = mod.interactive.find(e => e.id === exerciseId);
                if (found) { exercise = found; break; }
            }
        }
        if (!exercise) return;

        let correct = 0;
        let total = 0;
        const zones = document.querySelectorAll(`.drop-zone[data-exercise="${exerciseId}"]`);
        
        zones.forEach(zone => {
            const targetName = zone.dataset.target;
            const expectedItems = exercise.targets[targetName] || [];
            const droppedItems = zone.querySelectorAll('.drag-item');
            
            droppedItems.forEach(item => {
                total++;
                if (expectedItems.includes(item.dataset.value)) {
                    correct++;
                    item.style.borderColor = 'var(--success)';
                    item.style.background = '#e6f9e6';
                } else {
                    item.style.borderColor = 'var(--error)';
                    item.style.background = '#fde7e9';
                }
            });
        });

        // Count items still in source
        const sourceItems = document.querySelectorAll(`#source-${exerciseId} .drag-item`);
        total += sourceItems.length;

        const totalExpected = Object.values(exercise.targets).flat().length;
        const validation = document.getElementById(`validation-${exerciseId}`);
        
        if (correct === totalExpected && total === totalExpected) {
            validation.className = 'lab-validation success';
            validation.textContent = `✓ Perfect! All ${correct} items placed correctly.`;
            ProgressManager.completeInteractive(exerciseId);
            app.updateProgress();
        } else {
            validation.className = 'lab-validation error';
            validation.textContent = `${correct} of ${totalExpected} correct. Items with red borders are in the wrong place. Try again!`;
        }
    },

    resetDragDrop(exerciseId) {
        const source = document.getElementById(`source-${exerciseId}`);
        const items = document.querySelectorAll(`.drag-item[data-exercise="${exerciseId}"]`);
        items.forEach(item => {
            item.style.borderColor = '';
            item.style.background = '';
            source.appendChild(item);
        });
        const validation = document.getElementById(`validation-${exerciseId}`);
        if (validation) {
            validation.className = 'lab-validation';
            validation.textContent = '';
        }
    },

    // ─── SUBNET CALCULATOR ──────────────────────────
    renderSubnetCalculator(exercise) {
        return `
        <div class="interactive-exercise" id="exercise-${exercise.id}">
            <h3>🧮 ${exercise.title}</h3>
            <p class="exercise-description">${exercise.description}</p>
            <div class="subnet-calculator">
                <div class="calc-input-group">
                    <label>IP Address</label>
                    <input type="text" id="calc-ip-${exercise.id}" value="10.0.0.0" 
                           oninput="InteractiveEngine.calculateSubnet('${exercise.id}')">
                </div>
                <div class="calc-input-group">
                    <label>CIDR Prefix Length</label>
                    <select id="calc-cidr-${exercise.id}" 
                            onchange="InteractiveEngine.calculateSubnet('${exercise.id}')">
                        ${Array.from({length: 25}, (_, i) => i + 8).map(n => 
                            `<option value="${n}" ${n === 24 ? 'selected' : ''}>/${n}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="calc-result" id="calc-result-${exercise.id}">
                    Click "Calculate" or change values to see results.
                </div>
                <div style="grid-column: 1 / -1">
                    <button class="btn-primary" onclick="InteractiveEngine.calculateSubnet('${exercise.id}')">Calculate</button>
                </div>
            </div>
        </div>
        `;
    },

    calculateSubnet(exerciseId) {
        const ipInput = document.getElementById(`calc-ip-${exerciseId}`).value.trim();
        const cidr = parseInt(document.getElementById(`calc-cidr-${exerciseId}`).value);
        const result = document.getElementById(`calc-result-${exerciseId}`);

        // Validate IP format strictly (only digits and dots)
        if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipInput)) {
            result.textContent = 'Invalid IP address. Use format: x.x.x.x (digits only)';
            return;
        }

        // Parse IP
        const parts = ipInput.split('.').map(Number);
        if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
            result.textContent = 'Invalid IP address. Each octet must be 0-255.';
            return;
        }

        const ipNum = (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
        const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
        const network = (ipNum & mask) >>> 0;
        const broadcast = (network | (~mask >>> 0)) >>> 0;
        const totalHosts = Math.pow(2, 32 - cidr);
        const azureUsable = Math.max(0, totalHosts - 5);
        const standardUsable = Math.max(0, totalHosts - 2);

        const numToIp = n => [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255].join('.');
        const maskToIp = m => numToIp(m >>> 0);

        // All values below are computed from validated integers — safe for textContent
        const safeIp = parts.join('.'); // reconstructed from validated numbers
        result.textContent = '';
        result.innerHTML = `
<strong>Subnet Analysis for ${safeIp}/${cidr}</strong>

Network Address:    ${numToIp(network)}
Broadcast Address:  ${numToIp(broadcast)}
Subnet Mask:        ${maskToIp(mask)}
Total Addresses:    ${totalHosts.toLocaleString()}
Standard Usable:    ${standardUsable.toLocaleString()} (total - 2)
<strong style="color:var(--azure-blue)">Azure Usable:       ${azureUsable.toLocaleString()} (total - 5)</strong>
Host Range:         ${numToIp(network + 1)} — ${numToIp(broadcast - 1)}

Azure Reserved:
  ${numToIp(network)}        — Network address
  ${numToIp(network + 1)}    — Default gateway
  ${numToIp(network + 2)}    — Azure DNS
  ${numToIp(network + 3)}    — Azure DNS
  ${numToIp(broadcast)}      — Broadcast`;
    },

    // ─── FLASHCARDS ──────────────────────────────────
    renderFlashcards(exercise) {
        return `
        <div class="interactive-exercise" id="exercise-${exercise.id}">
            <h3>🃏 ${exercise.title}</h3>
            <p class="exercise-description">Click a card to flip it. Use the arrows to navigate. ${exercise.cards.length} cards total.</p>
            <div class="flashcard-container">
                <div class="flashcard" id="flashcard-${exercise.id}" onclick="InteractiveEngine.flipCard('${exercise.id}')">
                    <div class="flashcard-front">
                        <span id="fc-front-${exercise.id}">${exercise.cards[0].front}</span>
                    </div>
                    <div class="flashcard-back">
                        <span id="fc-back-${exercise.id}">${exercise.cards[0].back}</span>
                    </div>
                </div>
            </div>
            <div class="flashcard-nav">
                <button class="btn-secondary" onclick="InteractiveEngine.prevCard('${exercise.id}')" style="padding:6px 14px">← Prev</button>
                <span id="fc-counter-${exercise.id}" style="line-height:38px;font-size:13px;color:var(--text-secondary)">1 / ${exercise.cards.length}</span>
                <button class="btn-secondary" onclick="InteractiveEngine.nextCard('${exercise.id}')" style="padding:6px 14px">Next →</button>
            </div>
        </div>
        `;
    },

    flashcardIndex: {},

    flipCard(exerciseId) {
        const card = document.getElementById(`flashcard-${exerciseId}`);
        card.classList.toggle('flipped');
    },

    getFlashcardExercise(exerciseId) {
        const allModules = typeof MODULES !== 'undefined' ? MODULES : [];
        for (const mod of allModules) {
            if (mod.interactive) {
                const found = mod.interactive.find(e => e.id === exerciseId);
                if (found) return found;
            }
        }
        return null;
    },

    prevCard(exerciseId) {
        const ex = this.getFlashcardExercise(exerciseId);
        if (!ex) return;
        if (!this.flashcardIndex[exerciseId]) this.flashcardIndex[exerciseId] = 0;
        this.flashcardIndex[exerciseId] = Math.max(0, this.flashcardIndex[exerciseId] - 1);
        this.updateCard(exerciseId, ex);
    },

    nextCard(exerciseId) {
        const ex = this.getFlashcardExercise(exerciseId);
        if (!ex) return;
        if (!this.flashcardIndex[exerciseId]) this.flashcardIndex[exerciseId] = 0;
        this.flashcardIndex[exerciseId] = Math.min(ex.cards.length - 1, this.flashcardIndex[exerciseId] + 1);
        this.updateCard(exerciseId, ex);
    },

    updateCard(exerciseId, exercise) {
        const idx = this.flashcardIndex[exerciseId] || 0;
        const card = document.getElementById(`flashcard-${exerciseId}`);
        card.classList.remove('flipped');
        
        setTimeout(() => {
            document.getElementById(`fc-front-${exerciseId}`).textContent = exercise.cards[idx].front;
            document.getElementById(`fc-back-${exerciseId}`).textContent = exercise.cards[idx].back;
            document.getElementById(`fc-counter-${exerciseId}`).textContent = `${idx + 1} / ${exercise.cards.length}`;
        }, 100);
    },

    // ─── UTILITY ──────────────────────────────────
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};
