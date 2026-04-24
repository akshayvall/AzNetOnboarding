/* ============================================
   LAB ENGINE v2 — Detailed Azure Hands-On Labs
   Step-by-step guided labs with Azure Portal & CLI instructions
   ============================================ */

const LabEngine = {
    currentLab: null,
    currentStep: 0,
    stepResults: [],
    expandedSteps: {},

    init(moduleId, lab) {
        const container = document.getElementById('tab-lab');
        if (!lab) {
            container.innerHTML = '<p class="no-content">No lab available for this module yet.</p>';
            return;
        }
        this.currentLab = moduleId;
        this.currentStep = 0;
        this.lab = lab;
        this.stepResults = new Array(lab.steps.length).fill(null);
        this.expandedSteps = {};
        this.expandedSteps[0] = true;
        this.render();
    },

    render() {
        const container = document.getElementById('tab-lab');
        const lab = this.lab;
        const completedSteps = this.stepResults.filter(r => r === true).length;
        const totalSteps = lab.steps.length;
        const pct = Math.round((completedSteps / totalSteps) * 100);

        container.innerHTML = `
        <div class="lab-v2 fade-in">
            <div class="lab-header-card">
                <div class="lab-header-icon">${lab.icon || '🧪'}</div>
                <div class="lab-header-info">
                    <h2>${lab.title}</h2>
                    <p class="lab-header-desc">${lab.scenario}</p>
                    <div class="lab-meta">
                        ${lab.duration ? `<span class="lab-meta-item">⏱️ ${lab.duration}</span>` : ''}
                        ${lab.cost ? `<span class="lab-meta-item">💰 ${lab.cost}</span>` : ''}
                        ${lab.difficulty ? `<span class="lab-meta-item">📊 ${lab.difficulty}</span>` : ''}
                    </div>
                </div>
            </div>

            ${lab.prerequisites ? `
            <div class="lab-prereqs">
                <h4>📋 Prerequisites</h4>
                <ul>${lab.prerequisites.map(p => `<li>${p}</li>`).join('')}</ul>
            </div>` : ''}

            <div class="lab-progress-bar">
                <div class="lab-progress-fill" style="width:${pct}%"></div>
                <span class="lab-progress-label">${completedSteps} / ${totalSteps} steps complete (${pct}%)</span>
            </div>

            <div class="lab-steps-list">
                ${lab.steps.map((step, i) => this.renderStep(step, i)).join('')}
            </div>

            ${completedSteps === totalSteps ? `
            <div class="lab-complete-banner">
                <h3>🎉 Lab Complete!</h3>
                <p>You've successfully completed all steps. Don't forget to clean up resources to avoid charges!</p>
                ${lab.cleanup ? `
                <div class="lab-cleanup">
                    <h4>🧹 Cleanup Commands</h4>
                    <div class="lab-code-block">${lab.cleanup}</div>
                </div>` : ''}
            </div>` : ''}
        </div>`;
    },

    renderStep(step, index) {
        const isCompleted = this.stepResults[index] === true;
        const isExpanded = this.expandedSteps[index] === true;
        const isLocked = index > 0 && this.stepResults[index - 1] !== true && !isCompleted;
        const statusClass = isCompleted ? 'completed' : isLocked ? 'locked' : '';

        return `
        <div class="lab-step-v2 ${statusClass}" id="lab-step-${index}">
            <div class="lab-step-header" onclick="LabEngine.toggleStep(${index})">
                <div class="lab-step-num ${isCompleted ? 'done' : ''}">${isCompleted ? '✓' : index + 1}</div>
                <div class="lab-step-title-area">
                    <h4>${step.title}</h4>
                    ${step.subtitle ? `<span class="lab-step-subtitle">${step.subtitle}</span>` : ''}
                </div>
                <span class="lab-step-chevron ${isExpanded ? 'open' : ''}">${isLocked ? '🔒' : '▸'}</span>
            </div>
            ${isExpanded && !isLocked ? `
            <div class="lab-step-body">
                ${step.explanation ? `<div class="lab-step-explain">${step.explanation}</div>` : ''}

                ${step.portal ? `
                <div class="lab-method-toggle">
                    <button class="lab-method-btn active" onclick="LabEngine.showMethod(${index},'portal')">🌐 Azure Portal</button>
                    ${step.cli ? `<button class="lab-method-btn" onclick="LabEngine.showMethod(${index},'cli')">⌨️ Azure CLI</button>` : ''}
                    ${step.powershell ? `<button class="lab-method-btn" onclick="LabEngine.showMethod(${index},'ps')">🔷 PowerShell</button>` : ''}
                </div>
                <div class="lab-method-content" id="lab-method-${index}">
                    <div class="lab-portal-steps" id="lab-portal-${index}">${step.portal}</div>
                    ${step.cli ? `<div class="lab-cli-steps" id="lab-cli-${index}" style="display:none">${step.cli}</div>` : ''}
                    ${step.powershell ? `<div class="lab-ps-steps" id="lab-ps-${index}" style="display:none">${step.powershell}</div>` : ''}
                </div>
                ` : ''}

                ${step.tip ? `<div class="lab-tip">💡 <strong>Tip:</strong> ${step.tip}</div>` : ''}
                ${step.warning ? `<div class="lab-warning">⚠️ <strong>Warning:</strong> ${step.warning}</div>` : ''}

                ${step.verification ? `
                <div class="lab-verification-section">
                    <h5>✅ Verify Your Work</h5>
                    <div class="lab-verify-content">${step.verification}</div>
                </div>` : ''}

                ${this.renderValidation(step, index, isCompleted)}
            </div>` : ''}
        </div>`;
    },

    renderValidation(step, index, isCompleted) {
        if (isCompleted) return `<div class="lab-validation success" style="display:block">✓ Step completed!</div>`;

        if (step.type === 'confirm') {
            return `
            <div class="lab-confirm-section">
                <button class="btn-primary lab-confirm-btn" onclick="LabEngine.confirmStep(${index})">✓ I've completed this step</button>
            </div>
            <div class="lab-validation" id="lab-validation-${index}"></div>`;
        }

        let inputHtml = '';
        switch (step.type) {
            case 'text':
                inputHtml = `<div class="lab-input-group"><label>${step.content || 'Enter your answer:'}</label><input type="text" id="lab-input-${index}" placeholder="${step.placeholder || 'Type your answer...'}" autocomplete="off"></div>`;
                break;
            case 'select':
                inputHtml = `<div class="lab-input-group"><label>${step.content || 'Select the correct answer:'}</label><select id="lab-input-${index}"><option value="">-- Select --</option>${step.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}</select></div>`;
                break;
            case 'multi-select':
                inputHtml = `<div class="lab-input-group"><label>${step.content || 'Select all that apply:'}</label>${step.options.map((opt, oi) => `<label class="lab-checkbox"><input type="checkbox" id="lab-input-${index}-${oi}" value="${opt}"> ${opt}</label>`).join('')}</div>`;
                break;
        }

        if (inputHtml) {
            return `${inputHtml}
            <div style="display:flex;gap:8px;margin-top:12px">
                <button class="btn-primary" onclick="LabEngine.checkStep(${index})" style="font-size:13px;padding:8px 20px">Submit Answer</button>
                ${step.hint ? `<button class="btn-secondary" onclick="LabEngine.showHint(${index})" style="font-size:13px;padding:8px 16px">💡 Hint</button>` : ''}
            </div>
            <div class="lab-validation" id="lab-validation-${index}"></div>`;
        }

        return `<div class="lab-confirm-section"><button class="btn-primary lab-confirm-btn" onclick="LabEngine.confirmStep(${index})">✓ I've completed this step</button></div><div class="lab-validation" id="lab-validation-${index}"></div>`;
    },

    toggleStep(index) {
        const isLocked = index > 0 && this.stepResults[index - 1] !== true && !this.stepResults[index];
        if (isLocked) return;
        this.expandedSteps[index] = !this.expandedSteps[index];
        this.render();
    },

    showMethod(index, method) {
        const els = { portal: document.getElementById(`lab-portal-${index}`), cli: document.getElementById(`lab-cli-${index}`), ps: document.getElementById(`lab-ps-${index}`) };
        Object.entries(els).forEach(([k, el]) => { if (el) el.style.display = k === method ? 'block' : 'none'; });
        const container = document.querySelector(`#lab-step-${index} .lab-method-toggle`);
        if (container) {
            container.querySelectorAll('.lab-method-btn').forEach(btn => btn.classList.remove('active'));
            const methodMap = { portal: 0, cli: 1, ps: 2 };
            const btns = container.querySelectorAll('.lab-method-btn');
            if (btns[methodMap[method]]) btns[methodMap[method]].classList.add('active');
        }
    },

    confirmStep(index) {
        this.stepResults[index] = true;
        if (index + 1 < this.lab.steps.length) this.expandedSteps[index + 1] = true;
        this.expandedSteps[index] = false;
        if (this.stepResults.every(r => r === true)) {
            ProgressManager.completeLab(this.currentLab);
            app.updateProgress();
            app.showToast('Lab completed! 🎉', 'success');
        }
        this.render();
    },

    checkStep(index) {
        const step = this.lab.steps[index];
        const validation = document.getElementById(`lab-validation-${index}`);

        if (step.type === 'multi-select') {
            const checked = [];
            step.options.forEach((opt, oi) => { const cb = document.getElementById(`lab-input-${index}-${oi}`); if (cb && cb.checked) checked.push(opt); });
            const expected = step.validation;
            if (expected.length === checked.length && expected.every(v => checked.includes(v))) { this.confirmStep(index); } else { validation.className = 'lab-validation error'; validation.textContent = '✗ Not quite. Check your selections and try again.'; validation.style.display = 'block'; }
            return;
        }

        const input = document.getElementById(`lab-input-${index}`);
        if (!input || !input.value.trim()) { validation.className = 'lab-validation error'; validation.textContent = 'Please enter an answer.'; validation.style.display = 'block'; return; }

        const userAnswer = input.value.trim().toLowerCase();
        const expectedAnswer = (typeof step.validation === 'string' ? step.validation : '').toLowerCase();
        let isCorrect = userAnswer === expectedAnswer;
        if (!isCorrect && step.acceptAlternatives) isCorrect = step.acceptAlternatives.some(alt => userAnswer === alt.toLowerCase());
        if (!isCorrect && step.type === 'text') isCorrect = userAnswer.includes(expectedAnswer) || expectedAnswer.includes(userAnswer);

        if (isCorrect) { this.confirmStep(index); } else { validation.className = 'lab-validation error'; validation.style.display = 'block'; validation.textContent = step.errorMsg || `✗ Not quite. Expected: "${step.validation}". Try again!`; }
    },

    showHint(index) {
        const step = this.lab.steps[index];
        const validation = document.getElementById(`lab-validation-${index}`);
        validation.className = 'lab-validation';
        validation.style.display = 'block';
        validation.style.background = '#fff4e5';
        validation.style.color = '#8a6914';
        validation.style.border = '1px solid #ffd88c';
        validation.textContent = `💡 ${step.hint}`;
    }
};
