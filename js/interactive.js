/* ============================================
   INTERACTIVE EXERCISES — Drag & Drop, Flashcards, Subnet Calc
   ============================================ */

const InteractiveEngine = {

    escapeAttr(str) {
        return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    escapeHtml(str) {
        return this.escapeAttr(str);
    },

    inlineArg(value) {
        return this.escapeAttr(JSON.stringify(String(value)));
    },

    escapeSelector(value) {
        return CSS.escape(String(value));
    },

    render(exercises) {
        const container = document.getElementById('tab-interactive');
        this.bindEvents(container);
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

    bindEvents(container) {
        if (container.dataset.interactiveEventsBound) return;
        container.dataset.interactiveEventsBound = 'true';

        container.addEventListener('click', event => {
            const control = event.target.closest('[data-interactive-action]');
            if (!control) return;
            const exerciseId = control.dataset.exerciseId;
            switch (control.dataset.interactiveAction) {
                case 'check-drag-drop': this.checkDragDrop(exerciseId); break;
                case 'reset-drag-drop': this.resetDragDrop(exerciseId); break;
                case 'calculate-subnet': this.calculateSubnet(exerciseId); break;
                case 'flip-card': this.flipCard(exerciseId); break;
                case 'prev-card': this.prevCard(exerciseId); break;
                case 'next-card': this.nextCard(exerciseId); break;
            }
        });

        container.addEventListener('change', event => {
            const control = event.target.closest('[data-interactive-change]');
            if (!control) return;
            if (control.dataset.interactiveChange === 'move-drag-item') {
                this.moveDragItem(control.dataset.exerciseId, control.dataset.itemKey, control.value);
            } else if (control.dataset.interactiveChange === 'calculate-subnet') {
                this.calculateSubnet(control.dataset.exerciseId);
            }
        });

        container.addEventListener('input', event => {
            const control = event.target.closest('[data-interactive-input="calculate-subnet"]');
            if (control) this.calculateSubnet(control.dataset.exerciseId);
        });
    },

    // ─── DRAG & DROP ──────────────────────────────
    renderDragDrop(exercise) {
        const targetNames = Object.keys(exercise.targets);
        const exerciseId = this.escapeAttr(exercise.id);
        const items = this.shuffle(exercise.items.map((value, index) => ({ value, index })));
        return `
        <div class="interactive-exercise" id="exercise-${exerciseId}">
            <h3>🎯 ${this.escapeHtml(exercise.title)}</h3>
            <p class="exercise-description">${this.escapeHtml(exercise.description)}</p>
            <p class="drag-instructions" id="drag-instructions-${exerciseId}">Drag each item to a category, or use the destination menu beside each item. Items can be moved again before checking answers.</p>
            <div class="drag-drop-area" aria-describedby="drag-instructions-${exerciseId}">
                <div class="drag-source" id="source-${exerciseId}" aria-label="Items not yet placed">
                    <h4 style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">Items to place:</h4>
                    ${items.map(({ value, index }) => `
                        <div class="drag-item-row">
                            <div class="drag-item" draggable="true" data-exercise="${exerciseId}" data-item-key="${index}" data-value="${this.escapeAttr(value)}">
                                ${this.escapeHtml(value)}
                            </div>
                            <label class="sr-only" for="drag-move-${exerciseId}-${index}">Move ${this.escapeHtml(value)} to a category</label>
                            <select class="drag-move-select" id="drag-move-${exerciseId}-${index}" data-interactive-change="move-drag-item" data-exercise-id="${exerciseId}" data-item-key="${index}" aria-label="Move ${this.escapeAttr(value)} to a category">
                                <option value="">Not placed</option>
                                ${targetNames.map(target => `<option value="${this.escapeAttr(target)}">${this.escapeHtml(target)}</option>`).join('')}
                            </select>
                        </div>
                    `).join('')}
                </div>
                <div class="drag-target">
                    ${targetNames.map(target => `
                        <div style="margin-bottom:12px">
                            <div class="label" id="drop-label-${exerciseId}-${targetNames.indexOf(target)}" style="font-weight:600;font-size:13px;margin-bottom:4px">${this.escapeHtml(target)}</div>
                            <div class="drop-zone" data-exercise="${exerciseId}" data-target="${this.escapeAttr(target)}" aria-labelledby="drop-label-${exerciseId}-${targetNames.indexOf(target)}">
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div style="margin-top:12px;display:flex;gap:8px">
                <button type="button" class="btn-primary" data-interactive-action="check-drag-drop" data-exercise-id="${exerciseId}">Check Answers</button>
                <button type="button" class="btn-secondary" data-interactive-action="reset-drag-drop" data-exercise-id="${exerciseId}">Reset</button>
            </div>
            <div class="lab-validation" id="validation-${exerciseId}" role="status" aria-live="polite"></div>
            <div class="sr-only drag-status" id="drag-status-${exerciseId}" role="status" aria-live="polite" aria-atomic="true"></div>
        </div>
        `;
    },

    initDragDrop(exerciseId) {
        const escapedId = this.escapeSelector(exerciseId);
        const items = document.querySelectorAll(`.drag-item[data-exercise="${escapedId}"]`);
        const zones = document.querySelectorAll(`.drop-zone[data-exercise="${escapedId}"]`);
        const source = document.getElementById(`source-${exerciseId}`);

        items.forEach(item => {
            item.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', e.currentTarget.dataset.itemKey);
                e.dataTransfer.setData('exercise', exerciseId);
                e.currentTarget.classList.add('dragging');
            });
            item.addEventListener('dragend', e => {
                e.currentTarget.classList.remove('dragging');
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
                const itemKey = e.dataTransfer.getData('text/plain');
                const exId = e.dataTransfer.getData('exercise');
                if (exId !== exerciseId) return;
                this.placeDragItem(exerciseId, itemKey, zone.dataset.target);
            });
        };

        zones.forEach(setupDropZone);

        // Also allow dropping back to source
        if (source) {
            source.addEventListener('dragover', e => e.preventDefault());
            source.addEventListener('drop', e => {
                e.preventDefault();
                const exId = e.dataTransfer.getData('exercise');
                if (exId !== exerciseId) return;
                this.placeDragItem(exerciseId, e.dataTransfer.getData('text/plain'), '');
            });
        }
    },

    moveDragItem(exerciseId, itemKey, targetName) {
        this.placeDragItem(exerciseId, itemKey, targetName);
    },

    placeDragItem(exerciseId, itemKey, targetName) {
        const escapedId = this.escapeSelector(exerciseId);
        const item = Array.from(document.querySelectorAll(`.drag-item[data-exercise="${escapedId}"]`))
            .find(candidate => candidate.dataset.itemKey === String(itemKey));
        if (!item) return;

        const destination = targetName
            ? Array.from(document.querySelectorAll(`.drop-zone[data-exercise="${escapedId}"]`)).find(zone => zone.dataset.target === targetName)
            : document.getElementById(`source-${exerciseId}`);
        const row = item.closest('.drag-item-row');
        if (!destination || !row) return;

        destination.appendChild(row);
        const select = row.querySelector('.drag-move-select');
        if (select) select.value = targetName;
        this.announceDragMove(exerciseId, `${item.dataset.value} moved to ${targetName || 'Items not yet placed'}.`);
    },

    announceDragMove(exerciseId, message) {
        const status = document.getElementById(`drag-status-${exerciseId}`);
        if (status) status.textContent = message;
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
        const escapedId = this.escapeSelector(exerciseId);
        const zones = document.querySelectorAll(`.drop-zone[data-exercise="${escapedId}"]`);
        
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
        const sourceItems = document.getElementById(`source-${exerciseId}`).querySelectorAll('.drag-item');
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
        const escapedId = this.escapeSelector(exerciseId);
        const items = document.querySelectorAll(`.drag-item[data-exercise="${escapedId}"]`);
        items.forEach(item => {
            item.style.borderColor = '';
            item.style.background = '';
            const row = item.closest('.drag-item-row');
            if (row) {
                source.appendChild(row);
                const select = row.querySelector('.drag-move-select');
                if (select) select.value = '';
            }
        });
        const validation = document.getElementById(`validation-${exerciseId}`);
        if (validation) {
            validation.className = 'lab-validation';
            validation.textContent = '';
        }
        this.announceDragMove(exerciseId, 'All items reset to Items not yet placed.');
    },

    // ─── SUBNET CALCULATOR ──────────────────────────
    renderSubnetCalculator(exercise) {
        const exerciseId = this.escapeAttr(exercise.id);
        return `
        <div class="interactive-exercise" id="exercise-${exerciseId}">
            <h3>🧮 ${this.escapeHtml(exercise.title)}</h3>
            <p class="exercise-description">${this.escapeHtml(exercise.description)}</p>
            <div class="subnet-calculator">
                <div class="calc-input-group">
                    <label for="calc-ip-${exerciseId}">IP Address</label>
                          <input type="text" id="calc-ip-${exerciseId}" value="10.0.0.0"
                              data-interactive-input="calculate-subnet" data-exercise-id="${exerciseId}">
                </div>
                <div class="calc-input-group">
                    <label for="calc-cidr-${exerciseId}">CIDR Prefix Length</label>
                        <select id="calc-cidr-${exerciseId}" data-interactive-change="calculate-subnet" data-exercise-id="${exerciseId}">
                        ${Array.from({length: 25}, (_, i) => i + 8).map(n => 
                            `<option value="${n}" ${n === 24 ? 'selected' : ''}>/${n}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="calc-result" id="calc-result-${exerciseId}" role="status" aria-live="polite">
                    Click "Calculate" or change values to see results.
                </div>
                <div style="grid-column: 1 / -1">
                    <button type="button" class="btn-primary" data-interactive-action="calculate-subnet" data-exercise-id="${exerciseId}">Calculate</button>
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
        const exerciseId = this.escapeAttr(exercise.id);
        const initialLabel = this.getFlashcardLabel(exercise, 0, false);
        return `
        <div class="interactive-exercise" id="exercise-${exerciseId}">
            <h3>🃏 ${this.escapeHtml(exercise.title)}</h3>
            <p class="exercise-description" id="fc-instructions-${exerciseId}">Activate the card to flip it. Use Previous and Next to navigate. ${exercise.cards.length} cards total.</p>
            <div class="flashcard-container">
                <button type="button" class="flashcard" id="flashcard-${exerciseId}" data-interactive-action="flip-card" data-exercise-id="${exerciseId}" aria-describedby="fc-instructions-${exerciseId}" aria-pressed="false" aria-label="${this.escapeAttr(initialLabel)}">
                    <span class="flashcard-front" aria-hidden="false">
                        <span id="fc-front-${exerciseId}">${this.escapeHtml(exercise.cards[0].front)}</span>
                    </span>
                    <span class="flashcard-back" aria-hidden="true">
                        <span id="fc-back-${exerciseId}">${this.escapeHtml(exercise.cards[0].back)}</span>
                    </span>
                </button>
            </div>
            <div class="flashcard-nav">
                <button type="button" class="btn-secondary" aria-label="Previous flashcard" data-interactive-action="prev-card" data-exercise-id="${exerciseId}" style="padding:6px 14px">← Prev</button>
                <span id="fc-counter-${exerciseId}" aria-live="polite" style="line-height:38px;font-size:13px;color:var(--text-secondary)">1 / ${exercise.cards.length}</span>
                <button type="button" class="btn-secondary" aria-label="Next flashcard" data-interactive-action="next-card" data-exercise-id="${exerciseId}" style="padding:6px 14px">Next →</button>
            </div>
            <div class="sr-only" id="fc-status-${exerciseId}" role="status" aria-live="polite" aria-atomic="true"></div>
        </div>
        `;
    },

    flashcardIndex: {},

    flipCard(exerciseId) {
        const card = document.getElementById(`flashcard-${exerciseId}`);
        const exercise = this.getFlashcardExercise(exerciseId);
        if (!card || !exercise) return;
        const isBack = card.classList.toggle('flipped');
        this.updateFlashcardAccessibility(exerciseId, exercise, this.flashcardIndex[exerciseId] || 0, isBack, true);
    },

    getFlashcardLabel(exercise, index, isBack) {
        const side = isBack ? 'back' : 'front';
        const content = isBack ? exercise.cards[index].back : exercise.cards[index].front;
        const action = isBack ? 'show the front' : 'show the back';
        return `Card ${index + 1} of ${exercise.cards.length}, ${side}: ${content}. Activate to ${action}.`;
    },

    updateFlashcardAccessibility(exerciseId, exercise, index, isBack, announce) {
        const card = document.getElementById(`flashcard-${exerciseId}`);
        if (!card) return;
        const label = this.getFlashcardLabel(exercise, index, isBack);
        card.setAttribute('aria-pressed', String(isBack));
        card.setAttribute('aria-label', label);
        const front = card.querySelector('.flashcard-front');
        const back = card.querySelector('.flashcard-back');
        if (front) front.setAttribute('aria-hidden', String(isBack));
        if (back) back.setAttribute('aria-hidden', String(!isBack));
        if (announce) {
            const status = document.getElementById(`fc-status-${exerciseId}`);
            if (status) status.textContent = label;
        }
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
            this.updateFlashcardAccessibility(exerciseId, exercise, idx, false, true);
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
