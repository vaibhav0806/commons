/* Approved foundation: typography, Graphite + Reflective, scale, geometry and response. */
document.querySelector('button[data-palette="graphite"]').click();
document.querySelector('[data-material-choice="reflective"]').click();
document.documentElement.dataset.review = 'system';
document.title = 'Commons · Design system';
document.querySelector('.review').innerHTML = `<div class="system-review-head"><div><h1>Commons design system.</h1><p>Approved typography, Graphite + Reflective, type scale, spacing, corners and interaction response.</p></div><nav class="system-review-links" aria-label="Design system"><a href="#main">Project preview</a><a href="#material-review">States &amp; colors</a><a href="#foundations">Scale &amp; rules</a></nav></div>`;
document.querySelector('.sidebar-bottom').textContent = 'Approved design system';
document.querySelector('.material-notes').innerHTML = `<h2>Graphite + Reflective.</h2><p><strong>Your approved direction:</strong> neutral dark surfaces, silver light and a restrained reflective response. Space Grotesk headings, Geist reading and controls, Geist Mono identifiers; Sora stays available as the alternate.</p><p><strong>Try it:</strong> hover the note, press a button, use Tab to focus controls, and save an empty project name to see validation. Enter a name and save to see pending and success.</p><p>The scale, geometry and responses are approved. Text fields use a subtle border-color change on focus, with no outer outline, ring, glow or added shadow. The active mock now uses the same shared foundations.</p>`;
const foundations = document.createElement('section');
foundations.className = 'foundation-review';
foundations.id = 'foundations';
foundations.innerHTML = `<h2>One set of rules. Every component.</h2><p>These approved values are used in the project preview above. The full system is recorded in DESIGN.md at the project root. This page is a local simulation; no agents execute and no account or project data is changed.</p>
  <div class="foundation-grid"><div><h3>Type scale</h3>
    <div class="type-row"><span>44 / 52</span><span class="type-page">Commons</span></div>
    <div class="type-row"><span>26 / 34</span><span class="type-note">Ready for launch.</span></div>
    <div class="type-row"><span>20 / 28</span><span class="type-section">Project notes</span></div>
    <div class="type-row"><span>15 / 27</span><span class="type-body">Leave the context your next assistant needs. Clear writing deserves room to breathe.</span></div>
    <div class="type-row"><span>13 / 18</span><span class="type-control">Add a note · Save request</span></div>
    <div class="type-row"><span>12 / 19</span><span class="type-meta">Note by Codex · Today, 10:42</span></div>
    <div class="type-row"><span>12 / 19</span><span class="type-id">482 193 &nbsp; PROJECT / 001</span></div>
  </div><div><h3>Geometry &amp; response</h3><dl class="rule-list">
    <div><dt>Spacing</dt><dd>4, 8, 12, 16, 20, 24, 32, 40, 48, 64px. Related items sit closer; sections get more room.</dd></div>
    <div><dt>Corners</dt><dd>8px controls. 14px content surfaces. Agent marks keep their own shape.</dd></div>
    <div><dt>Controls</dt><dd>44px minimum primary-control height. Small icons live inside a usable hit area.</dd></div>
    <div><dt>Reading</dt><dd>One content column, up to 960px. Long text stays within approximately 72 characters per line.</dd></div>
    <div><dt>Hover / press</dt><dd>140ms response. A restrained edge or surface change, with a small button press.</dd></div>
    <div><dt>Surface reveal</dt><dd>260ms ease-out. Preserve context and keep the reading position stable.</dd></div>
    <div><dt>Light</dt><dd>500ms highlight travel on primary buttons. A thin reflection follows the pointer on the note.</dd></div>
    <div><dt>Reduced motion</dt><dd>Remove movement and travelling highlights. Keep focus, state and outcomes visible.</dd></div>
  </dl><div class="empty-example"><h3>Empty state sample</h3><svg class="icon" aria-hidden="true"><use href="../assets/icons.svg#Tray"></use></svg><h3>No new requests.</h3><p>Shared notes keep the project’s context ready for the next assistant.</p><button class="text-button" id="empty-add-note">Leave a note <svg class="icon" aria-hidden="true"><use href="../assets/icons.svg#ArrowRight"></use></svg></button></div></div></div>`;
document.querySelector('.review-end').before(foundations);
document.querySelector('.review-end').innerHTML = `<a href="./?study=materials&palette=graphite&material=reflective">Palette comparison</a><a href="./">Typography comparison</a><a href="../v2/?flow=31#/start">Current onboarding</a><span>Approved foundations. New components follow the same rules.</span>`;
document.querySelector('#empty-add-note').addEventListener('click', () => {
  if (document.querySelector('#composer').hidden) document.querySelector('#add-note').click();
  document.querySelector('#note-title').focus();
});
const mobileType = matchMedia('(max-width:700px)');
function labelTypeScale() {
  foundations.querySelector('.type-row>span').textContent = mobileType.matches ? '36 / 42' : '44 / 52';
  foundations.querySelectorAll('.type-row>span:first-child')[1].textContent = mobileType.matches ? '24 / 31' : '26 / 34';
}
mobileType.addEventListener('change', labelTypeScale);
labelTypeScale();
