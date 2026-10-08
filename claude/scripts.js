/* School inspection form logic */

const CLASSES = ['প্রাক-প্রাথমিক', 'প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'চতুর্থ', 'পঞ্চম'];
const BN = '০১২৩৪৫৬৭৮৯';
const STORE_KEY = 'schoolInspectionForm_v1';

const $ = id => document.getElementById(id);
const toBn = s => String(s).replace(/\d/g, d => BN[d]);
const toEn = s => String(s).replace(/[০-৯]/g, c => BN.indexOf(c));

let ratingManual = false;   // true once the user picks a colour by hand

/* ---------- Build table rows (6 and 7) ---------- */

CLASSES.forEach((cls, i) => {
    $('studentRows').insertAdjacentHTML('beforeend', `
        <tr>
            <th>${cls}</th>
            <td><input type="text" class="n" inputmode="numeric" id="s${i}_enr"></td>
            <td><input type="text" class="n" inputmode="numeric" id="s${i}_pre"></td>
            <td class="calc" id="s${i}_abs"></td>
            <td class="calc" id="s${i}_rate"></td>
        </tr>`);

    $('testRows').insertAdjacentHTML('beforeend', `
        <tr>
            <td class="l"><input type="text" id="t${i}_name"></td>
            <th>${cls}</th>
            <td><input type="text" id="t${i}_sub"></td>
            <td><input type="text" class="n" inputmode="numeric" id="t${i}_tested"></td>
            <td><input type="text" class="n" inputmode="numeric" id="t${i}_ach"></td>
        </tr>`);
});

/* ---------- Helpers ---------- */

// number in a field, or null when empty
function val(id) {
    const v = toEn($(id).value).trim();
    return v === '' ? null : parseInt(v, 10);
}
function show(id, n, isPercent) {
    $(id).textContent = n === null ? '' : toBn(isPercent ? n.toFixed(2) : n);
}
function mean(list) {
    return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
}
function flag(id, bad) { $(id).classList.toggle('err', bad); }

/* ---------- Calculations ---------- */

function calc() {
    // 5. teachers
    const tn = val('tnum'), tp = val('ptnum');
    show('atnum', tn !== null && tp !== null ? Math.max(tn - tp, 0) : null);
    flag('ptnum', tn !== null && tp !== null && tp > tn);

    // 6. students
    let totE = 0, totP = 0, anyRow = false;
    const rates6 = [];
    CLASSES.forEach((_, i) => {
        const e = val(`s${i}_enr`), p = val(`s${i}_pre`);
        const ok = e !== null && p !== null;
        show(`s${i}_abs`, ok ? Math.max(e - p, 0) : null);
        flag(`s${i}_pre`, ok && p > e);
        if (e !== null) totE += e;
        if (p !== null) totP += p;
        if (e !== null || p !== null) anyRow = true;
        if (ok && e > 0) {
            const r = p / e * 100;
            rates6.push(r);
            show(`s${i}_rate`, r, true);
        } else show(`s${i}_rate`, null);
    });
    show('tot_enr', anyRow ? totE : null);
    show('tot_pre', anyRow ? totP : null);
    show('tot_abs', anyRow ? Math.max(totE - totP, 0) : null);
    show('tot_rate', totE > 0 ? totP / totE * 100 : null, true);
    $('avg6').textContent = toBn(mean(rates6).toFixed(2));

    // 7. learning-teaching check
    const rates7 = [];
    CLASSES.forEach((_, i) => {
        const t = val(`t${i}_tested`), a = val(`t${i}_ach`);
        flag(`t${i}_ach`, t !== null && a !== null && a > t);
        if (t !== null && a !== null && t > 0) rates7.push(a / t * 100);
    });
    const avg7 = mean(rates7);
    $('avg7').textContent = toBn(avg7.toFixed(2));

    // 8. rating – suggest a colour from the average unless the user chose one
    if (!ratingManual) {
        const radios = document.querySelectorAll('input[name="rating"]');
        radios.forEach(r => (r.checked = false));
        if (rates7.length) {
            const pick = avg7 < 61 ? 'red' : avg7 < 80 ? 'yellow' : 'green';
            document.querySelector(`input[name="rating"][value="${pick}"]`).checked = true;
        }
    }
    markRating();
}

function markRating() {
    document.querySelectorAll('table.rating td').forEach(td => {
        td.classList.toggle('sel', td.querySelector('input').checked);
    });
}

/* ---------- Saving / restoring (survives refresh) ---------- */

function save() {
    const data = {};
    document.querySelectorAll('#sheet input[id], #sheet textarea[id]').forEach(el => (data[el.id] = el.value));
    const r = document.querySelector('input[name="rating"]:checked');
    data.__rating = r ? r.value : '';
    data.__manual = ratingManual;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
}

function restore() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { /* ignore */ }
    if (!data) return false;
    Object.keys(data).forEach(k => { if ($(k)) $(k).value = data[k]; });
    ratingManual = !!data.__manual;
    if (data.__rating) {
        const r = document.querySelector(`input[name="rating"][value="${data.__rating}"]`);
        if (r) r.checked = true;
    }
    return true;
}

function setToday() {
    const d = new Date();
    $('dd').value = toBn(String(d.getDate()).padStart(2, '0'));
    $('mm').value = toBn(String(d.getMonth() + 1).padStart(2, '0'));
    $('yy').value = toBn(d.getFullYear());
}

/* ---------- Auto-grow textareas ---------- */

function grow(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}
function growAll() { document.querySelectorAll('#sheet textarea').forEach(grow); }

/* ---------- Events ---------- */

// every typing action
$('sheet').addEventListener('input', e => {
    const el = e.target;

    // numeric boxes: digits only, shown in Bengali digits
    if (el.classList.contains('n')) {
        const pos = el.selectionStart;
        el.value = toBn(toEn(el.value).replace(/\D/g, ''));
        try { el.setSelectionRange(pos, pos); } catch (err) { /* ignore */ }
    }
    if (el.tagName === 'TEXTAREA') grow(el);

    calc();
    save();
});

// manual colour choice
document.querySelectorAll('input[name="rating"]').forEach(r =>
    r.addEventListener('change', () => { ratingManual = true; markRating(); save(); })
);

// print / save as PDF
$('printBtn').addEventListener('click', () => window.print());

// give the PDF a useful file name
const oldTitle = document.title;
window.addEventListener('beforeprint', () => {
    growAll();
    const name = $('scname').value.trim();
    document.title = 'বিদ্যালয় পরিদর্শন' + (name ? ' - ' + name : '');
});
window.addEventListener('afterprint', () => { document.title = oldTitle; });

// new blank form
$('clearBtn').addEventListener('click', () => {
    if (!confirm('সব তথ্য মুছে নতুন ফরম শুরু করবেন?')) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    document.querySelectorAll('#sheet input[id], #sheet textarea[id]').forEach(el => (el.value = ''));
    document.querySelectorAll('input[name="rating"]').forEach(r => (r.checked = false));
    ratingManual = false;
    setToday();
    calc();
    growAll();
    save();
});

/* ---------- Start ---------- */

if (!restore()) setToday();
calc();
growAll();
