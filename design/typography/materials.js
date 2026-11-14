/* Graphite + Reflective is approved. Other combinations remain review options. */
const palettes = {
  graphite: {
    name: 'Graphite', description: 'Silver light · neutral dark surfaces',
    canvas: '#0b0c0e', nav: '#101114', surface: '#17191d', raised: '#202328', hover: '#292d34', line: '#30353e', strong: '#677282', ink: '#eef0f3', 'body-ink': '#c2c7d0', muted: '#a7aeba', quiet: '#959eac', accent: '#c8d0dc', 'on-accent': '#12161c', primary: '#dbe0e8', 'primary-hover': '#f3f5f8', success: '#add2bb', error: '#f0a5b5', warning: '#e6bfb0', glint: '#e8f2ff', 'glint-end': '#9baac1', focus: '#bccadc', 'field-focus': '#8c97a6',
    rationale: 'Approved neutral graphite surfaces with silver light. Agent identities keep their own colors.',
  },
  ice: {
    name: 'Ice blue', description: 'Cool light · blue-black surfaces',
    canvas: '#0a0e13', nav: '#0d131b', surface: '#121c27', raised: '#1a2838', hover: '#23374b', line: '#304457', strong: '#62839e', ink: '#edf5fc', 'body-ink': '#bccddd', muted: '#a2b8cc', quiet: '#8fa7bd', accent: '#96d8ee', 'on-accent': '#071925', primary: '#b6e4f2', 'primary-hover': '#d8f4fc', success: '#add9c4', error: '#f1a8b8', warning: '#e9c1b1', glint: '#d5f4ff', 'glint-end': '#7aa9d1', focus: '#a9e3f8', 'field-focus': '#809fb8',
    rationale: 'Blue-black surfaces with pale cyan actions and focus. The cool tint carries across surfaces, while note content stays stable when hovered.',
  },
  iridescent: {
    name: 'Iridescent', description: 'Lilac light · violet-black surfaces',
    canvas: '#0e0c12', nav: '#131017', surface: '#1a1721', raised: '#262130', hover: '#332c40', line: '#40374d', strong: '#8c789f', ink: '#f3eff8', 'body-ink': '#c9bfd7', muted: '#b8abc6', quiet: '#a698b8', accent: '#c7b5f4', 'on-accent': '#1c112d', primary: '#d2c3f4', 'primary-hover': '#e7ddfb', success: '#b3d4c5', error: '#f1a8be', warning: '#e7c4b9', glint: '#cdbdf6', 'glint-end': '#97d9e1', focus: '#d8c5fc', 'field-focus': '#9c88b1',
    rationale: 'Violet-black surfaces with pale lilac actions. Reflective edges shift from lilac to cyan, borrowing the spectral quality of the references without tinting reading text with a gradient.',
  },
};
const materialRoot = document.documentElement;
const materialParams = new URLSearchParams(location.search);
let activePalette = Object.hasOwn(palettes, materialParams.get('palette')) ? materialParams.get('palette') : 'graphite';
let activeMaterial = materialParams.get('material') === 'matte' ? 'matte' : 'reflective';
materialRoot.style.setProperty('--heading', '"Space Grotesk"');
materialRoot.style.setProperty('--body', 'Geist');
document.title = 'Commons · Color and material study';
document.querySelector('.review').innerHTML = `
  <div class="review-top"><div><p class="review-title">Choose the light. Keep the clarity.</p><p>Same project and approved typography. Compare palette and surface treatment.</p></div><a href="./">Typography study <svg class="icon" aria-hidden="true"><use href="../assets/icons.svg#ArrowUpRight"></use></svg></a></div>
  <div class="review-controls"><div class="palette-options" role="group" aria-label="Palette to preview">
    ${Object.entries(palettes).map(([id, p]) => `<button class="palette-option" data-palette="${id}" aria-pressed="false"><span class="palette-chip ${id}" aria-hidden="true"></span><span><strong>${p.name}</strong><small>${p.description}</small></span></button>`).join('')}
  </div><div class="material-controls"><div class="material-picker"><span>Surface</span><div class="material-buttons" role="group" aria-label="Surface treatment"><button data-material-choice="matte" aria-pressed="false">Matte</button><button data-material-choice="reflective" aria-pressed="false">Reflective</button></div></div><p class="review-hint">Move over the note and buttons. Click, press Tab, and try the controls below.</p></div></div>`;
document.querySelector('.sidebar-bottom').textContent = 'Palette & material preview';
document.querySelector('.study-foot a').href = '#material-review';
document.querySelector('.study-foot a').textContent = 'Inspect colors & controls';
const existingFooter = document.querySelector('.type-details');
const materialReview = document.createElement('section');
materialReview.className = 'materials-review';
materialReview.id = 'material-review';
materialReview.setAttribute('aria-label', 'Palette details and interaction samples');
materialReview.innerHTML = `
  <h2>Color in context.</h2>
  <div class="token-list" aria-label="Palette values"></div>
  <div class="review-lower">
    <form class="control-sample" novalidate><h2>Try the feedback.</h2><label for="sample-name">Project name</label><input id="sample-name" name="name" value="Commons launch" maxlength="80" required aria-describedby="sample-feedback"><div class="sample-feedback" id="sample-feedback" role="status">Clear the name and save to see the error state.</div><div class="sample-actions"><button class="action" id="sample-save" type="submit">Save preview</button><button class="action" type="button" disabled>Unavailable</button></div></form>
    <div class="material-notes"><h2 id="palette-name"></h2><p id="palette-rationale"></p><p id="material-rationale"></p><p><strong>Typography stays fixed:</strong> Space Grotesk headings, Geist reading and controls, Geist Mono identifiers. Sora remains the stored alternate.</p><p>Graphite + Reflective is approved. Other combinations remain comparison options. Changing this preview does not apply a different theme to the main mock.</p></div>
  </div>
  <div class="review-end"><a href="./">Revisit fonts</a><a href="../v2/?flow=31#/start">Current onboarding</a><span>Toolcraft references: <a href="https://toolcraft.sh/gallery/liquid-metal" target="_blank" rel="noopener">Liquid Metal</a> · <a href="https://toolcraft.sh/gallery/mesh-fx" target="_blank" rel="noopener">Mesh FX</a> · <a href="https://toolcraft.sh/gallery/dither-lab" target="_blank" rel="noopener">Dither Lab</a></span></div>`;
existingFooter.replaceWith(materialReview);
const tokens = [['canvas', 'Canvas'], ['surface', 'Surface'], ['ink', 'Text'], ['accent', 'Accent'], ['success', 'Success'], ['warning', 'Warning'], ['error', 'Error']];
function updateMaterials() {
  const palette = palettes[activePalette];
  Object.entries(palette).forEach(([key, value]) => { if (value.startsWith('#')) materialRoot.style.setProperty('--' + key, value); });
  materialRoot.dataset.palette = activePalette;
  materialRoot.dataset.material = activeMaterial;
  document.querySelectorAll('button[data-palette]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.palette === activePalette)));
  document.querySelectorAll('[data-material-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.materialChoice === activeMaterial)));
  document.querySelector('.token-list').innerHTML = tokens.map(([token, label]) => `<div class="token"><div class="token-color" style="background:${palette[token]}" aria-hidden="true"></div><strong>${label}</strong><code>${palette[token]}</code></div>`).join('');
  document.querySelector('#palette-name').textContent = palette.name + ' · ' + (activeMaterial === 'matte' ? 'matte' : 'reflective');
  document.querySelector('#palette-rationale').textContent = palette.rationale;
  document.querySelector('#material-rationale').textContent = activeMaterial === 'matte' ? 'Matte: solid surfaces, clear boundaries and direct feedback. Hover changes the edge; press gives the button a small physical response.' : 'Reflective: a soft surface gradient, a thin light edge that follows your pointer, and a passing highlight on primary buttons. Reading content stays still.';
  document.querySelector('meta[name="theme-color"]').content = palette.canvas;
  const url = new URL(location.href);
  url.searchParams.set('palette', activePalette);
  url.searchParams.set('material', activeMaterial);
  url.searchParams.delete('font');
  url.searchParams.delete('body');
  history.replaceState(null, '', url);
}
document.querySelectorAll('button[data-palette]').forEach(button => button.addEventListener('click', () => { activePalette = button.dataset.palette; updateMaterials(); }));
document.querySelectorAll('[data-material-choice]').forEach(button => button.addEventListener('click', () => { activeMaterial = button.dataset.materialChoice; updateMaterials(); }));
updateMaterials();
const noteSurface = document.querySelector('.note');
let pointerFrame = 0;
let pointerX = 0;
noteSurface.addEventListener('pointermove', event => {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches || activeMaterial !== 'reflective') return;
  pointerX = event.clientX - noteSurface.getBoundingClientRect().left;
  if (!pointerFrame) pointerFrame = requestAnimationFrame(() => { noteSurface.style.setProperty('--pointer-x', pointerX + 'px'); pointerFrame = 0; });
});
noteSurface.addEventListener('pointerleave', () => {
  cancelAnimationFrame(pointerFrame);
  pointerFrame = 0;
  noteSurface.style.removeProperty('--pointer-x');
});
const sampleForm = document.querySelector('.control-sample');
const sampleInput = document.querySelector('#sample-name');
const sampleSave = document.querySelector('#sample-save');
const feedback = document.querySelector('#sample-feedback');
function showFeedback(state, message, iconName) {
  feedback.dataset.state = state;
  feedback.replaceChildren();
  if (iconName) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '../assets/icons.svg#' + iconName);
    svg.append(use);
    feedback.append(svg);
  }
  feedback.append(document.createTextNode(message));
}
sampleInput.addEventListener('input', () => {
  sampleInput.removeAttribute('aria-invalid');
  showFeedback('idle', 'Preview only. This will not rename your project.');
});
sampleForm.addEventListener('submit', event => {
  event.preventDefault();
  if (sampleSave.disabled) return;
  if (!sampleInput.value.trim()) {
    sampleInput.setAttribute('aria-invalid', 'true');
    showFeedback('error', 'Enter a project name, then save again.', 'WarningCircle');
    sampleInput.focus();
    return;
  }
  sampleInput.removeAttribute('aria-invalid');
  sampleSave.disabled = true;
  sampleSave.setAttribute('aria-busy', 'true');
  sampleSave.textContent = 'Saving…';
  sampleInput.readOnly = true;
  showFeedback('pending', 'Demonstrating the pending state.', 'Clock');
  setTimeout(() => {
    sampleSave.disabled = false;
    sampleSave.removeAttribute('aria-busy');
    sampleSave.textContent = 'Save preview';
    sampleInput.readOnly = false;
    showFeedback('success', 'Preview saved. No project data was changed.', 'CheckCircle');
  }, 750);
});
