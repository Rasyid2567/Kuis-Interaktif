// ── DATA ──
  let role = '', userName = '';

  let paketList = [
    {
      id: 1, nama: "Latihan Umum",
      soal: [
        { soal: "Apa ibu kota Indonesia?", opsi: ["Jakarta","Surabaya","Bandung","Bali"], jawaban: 0 },
        { soal: "Berapa hasil dari 7 × 8?", opsi: ["54","56","64","48"], jawaban: 1 },
        { soal: "Siapa proklamator kemerdekaan Indonesia?", opsi: ["Soeharto & Habibie","Soekarno & Hatta","Gus Dur & Megawati","SBY & Jokowi"], jawaban: 1 },
      ]
    },
    {
      id: 2, nama: "Ujian Sains",
      soal: [
        { soal: "Planet terbesar di tata surya?", opsi: ["Saturnus","Bumi","Jupiter","Neptunus"], jawaban: 2 },
        { soal: "Lambang kimia untuk emas?", opsi: ["Ag","Fe","Au","Cu"], jawaban: 2 },
        { soal: "Gas terbanyak di atmosfer bumi?", opsi: ["Oksigen","Karbon Dioksida","Nitrogen","Hidrogen"], jawaban: 2 },
      ]
    },
    {
      id: 3, nama: "Ujian Sejarah",
      soal: [
        { soal: "Proklamasi kemerdekaan Indonesia dibacakan pada?", opsi: ["17 Agustus 1945","17 Agustus 1944","18 Agustus 1945","1 Juni 1945"], jawaban: 0 },
        { soal: "Gunung tertinggi di Indonesia adalah?", opsi: ["Gunung Rinjani","Gunung Semeru","Puncak Jaya","Gunung Kerinci"], jawaban: 2 },
        { soal: "Perjanjian yang mengakhiri Perang Dunia II di Asia?", opsi: ["Perjanjian Versailles","Perjanjian San Francisco","Perjanjian Paris","Perjanjian Genewa"], jawaban: 1 },
      ]
    }
  ];

  let nextPaketId = 4;
  let activePaketId = 1; // filter daftar soal
  let hapusTarget = null; // { paketId, soalIdx }
  let selectedPaket = null; // untuk kerjakan soal
  let quiz = { idx: 0, score: 0, answered: false, soalList: [], paketNama: '' };

  // ── AUTH ──
  document.getElementById('inp-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('inp-user').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  function doLogin() {
    const u = document.getElementById('inp-user').value.trim().toLowerCase();
    const p = document.getElementById('inp-pass').value;
    if ((u === 'admin' || u === 'user') && p === '1234') {
      role = u; userName = u.charAt(0).toUpperCase() + u.slice(1);
      document.getElementById('err-login').style.display = 'none';
      ['nav-name','nav-name-buat','nav-name-kerjakan'].forEach(id => document.getElementById(id).textContent = userName);
      document.getElementById('dash-name').textContent = userName;
      const badge = document.getElementById('nav-role');
      badge.textContent = role === 'admin' ? 'Admin' : 'User';
      badge.className = 'role-tag ' + (role === 'admin' ? 'role-admin' : 'role-user');
      renderMenu();
      showPage('dashboard');
    } else {
      document.getElementById('err-login').style.display = 'block';
      document.getElementById('inp-pass').value = '';
    }
  }

  function confirmLogout() {
    document.getElementById('modal-logout').classList.add('open');
  }

  function closeModalLogout() {
    document.getElementById('modal-logout').classList.remove('open');
  }

  function doLogout() {
    closeModalLogout();
    role = ''; userName = '';
    document.getElementById('inp-user').value = '';
    document.getElementById('inp-pass').value = '';
    showPage('login');
  }

  // ── NAVIGATION ──
  function showPage(name) {
    if (name === 'buat' && role !== 'admin') { toast('Hanya admin yang bisa membuat soal.'); return; }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    window.scrollTo(0, 0);
    if (name === 'buat') { renderPaketSelect(); renderPaketTabs(); renderSoalList(); }
    if (name === 'kerjakan') showPilihPaket();
  }

  // ── DASHBOARD ──
  function renderMenu() {
    const isAdmin = role === 'admin';
    document.getElementById('menu-grid').className = 'card-grid' + (isAdmin ? '' : ' single');
    document.getElementById('menu-grid').innerHTML = `
      ${isAdmin ? `<div class="menu-card" onclick="showPage('buat')">
        <div class="icon">✏️</div><h2>Buat Soal</h2><p>Tambahkan dan kelola soal pilihan ganda.</p>
      </div>` : ''}
      <div class="menu-card" onclick="showPage('kerjakan')">
        <div class="icon">📝</div><h2>Kerjakan Soal</h2><p>Pilih paket soal dan mulai ujian.</p>
      </div>`;
    document.getElementById('menu-notice').innerHTML = isAdmin ? '' :
      `<div class="notice">🔒 Akun <b>User</b> hanya bisa mengerjakan soal.</div>`;
  }

  // ── BUAT SOAL ──

  // Render dropdown paket di form
  function renderPaketSelect() {
    const sel = document.getElementById('inp-paket-soal');
    sel.innerHTML = paketList.map(p => `<option value="${p.id}">${p.nama}</option>`).join('');
    // Set ke activePaketId jika ada
    if (paketList.find(p => p.id === activePaketId)) sel.value = activePaketId;
  }

  // Render tab filter atas daftar soal
  function renderPaketTabs() {
    const bar = document.getElementById('paket-tabs');
    bar.innerHTML = paketList.map(p =>
      `<button class="paket-tab ${p.id === activePaketId ? 'active' : ''}" onclick="setActivePaket(${p.id})">
        ${p.nama}
        <span class="paket-tab-del" onclick="event.stopPropagation();openModalHapusPaket(${p.id})" title="Hapus paket">×</span>
      </button>`
    ).join('') +
    `<button class="paket-tab-add" onclick="openModalPaket()">+ Paket Baru</button>`;
  }

  function setActivePaket(id) {
    activePaketId = id;
    // Sync dropdown form juga
    const sel = document.getElementById('inp-paket-soal');
    if (sel) sel.value = id;
    renderPaketTabs();
    renderSoalList();
  }

  // Render daftar soal sesuai tab aktif
  function renderSoalList() {
    const paket = paketList.find(p => p.id === activePaketId);
    const container = document.getElementById('soal-list');
    const countEl = document.getElementById('soal-count-label');

    if (!paket || !activePaketId) { container.innerHTML = `<div class="empty-state">Belum ada paket soal. Tambahkan paket baru di atas.</div>`; countEl.textContent = '0 soal'; return; }

    countEl.textContent = paket.soal.length + ' soal';

    if (paket.soal.length === 0) {
      container.innerHTML = `<div class="empty-state">Belum ada soal di paket ini.<br>Tambahkan soal di atas.</div>`;
      return;
    }

    container.innerHTML = paket.soal.map((s, si) => {
      const bodyId = `body-${paket.id}-${si}`;
      return `
        <div class="soal-item">
          <div class="soal-item-head" onclick="toggleBody('${bodyId}')">
            <span class="soal-item-num">No. ${si + 1}</span>
            <span class="soal-item-text">${s.soal.length > 60 ? s.soal.slice(0,60)+'…' : s.soal}</span>
            <span class="soal-item-badge">Jwb: ${'ABCD'[s.jawaban]}</span>
            <div class="soal-item-actions" onclick="event.stopPropagation()">
              <button class="btn-sm" onclick="editSoal(${paket.id},${si})">Edit</button>
              <button class="btn-sm red" onclick="openModalHapus(${paket.id},${si})">Hapus</button>
            </div>
          </div>
          <div class="soal-item-body" id="${bodyId}">
            <div style="font-size:14px;font-weight:600;margin-bottom:12px;line-height:1.5">${s.soal}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
              ${s.opsi.map((o, i) => `
                <div style="padding:8px 12px;border-radius:6px;font-size:13px;border:1px solid ${i===s.jawaban?'#188038':'#e0e0e0'};background:${i===s.jawaban?'#e6f4ea':'#fafafa'};color:${i===s.jawaban?'#188038':'#444'}">
                  <b>${'ABCD'[i]}.</b> ${o}${i===s.jawaban?' ✓':''}
                </div>`).join('')}
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function toggleBody(id) {
    document.getElementById(id).classList.toggle('open');
  }

  function resetForm() {
    document.getElementById('form-title').textContent = 'Tambah Soal';
    document.getElementById('btn-save-soal').textContent = 'Simpan Soal';
    document.getElementById('edit-idx').value = '';
    document.getElementById('inp-soal').value = '';
    ['A','B','C','D'].forEach(l => document.getElementById('opt-' + l).value = '');
    document.getElementById('inp-jawaban').value = '';
    // Sync paket select ke active tab
    const sel = document.getElementById('inp-paket-soal');
    if (sel && paketList.find(p => p.id === activePaketId)) sel.value = activePaketId;
  }

  function saveSoal() {
    const q = document.getElementById('inp-soal').value.trim();
    const paketId = parseInt(document.getElementById('inp-paket-soal').value);
    const opts = ['A','B','C','D'].map(l => document.getElementById('opt-' + l).value.trim());
    const j = document.getElementById('inp-jawaban').value;
    if (!q || !paketId || opts.some(o => !o) || j === '') { toast('Lengkapi semua isian terlebih dahulu.'); return; }

    const newSoal = { soal: q, opsi: opts, jawaban: parseInt(j) };
    const editIdx = document.getElementById('edit-idx').value;

    if (editIdx !== '') {
      const [eId, eSi] = editIdx.split('-').map(Number);
      const paket = paketList.find(p => p.id === eId);
      if (paket) paket.soal[eSi] = newSoal;
      toast('Soal diperbarui!');
    } else {
      const paket = paketList.find(p => p.id === paketId);
      if (paket) paket.soal.push(newSoal);
      toast('Soal disimpan ke "' + paket.nama + '"!');
    }

    // Pindah tab ke paket tujuan
    activePaketId = paketId;
    resetForm();
    renderPaketTabs();
    renderSoalList();
  }

  function editSoal(paketId, soalIdx) {
    const paket = paketList.find(p => p.id === paketId);
    const s = paket.soal[soalIdx];
    document.getElementById('form-title').textContent = 'Edit Soal';
    document.getElementById('btn-save-soal').textContent = 'Update Soal';
    document.getElementById('edit-idx').value = paketId + '-' + soalIdx;
    document.getElementById('inp-paket-soal').value = paketId;
    document.getElementById('inp-soal').value = s.soal;
    ['A','B','C','D'].forEach((l, i) => document.getElementById('opt-' + l).value = s.opsi[i]);
    document.getElementById('inp-jawaban').value = s.jawaban;
    document.getElementById('form-box') && document.querySelector('.form-box').scrollIntoView({ behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── MODAL PAKET ──
  function openModalPaket() {
    document.getElementById('inp-nama-paket').value = '';
    document.getElementById('modal-paket').classList.add('open');
    setTimeout(() => document.getElementById('inp-nama-paket').focus(), 100);
  }

  function closeModalPaket() {
    document.getElementById('modal-paket').classList.remove('open');
  }

  document.getElementById('inp-nama-paket').addEventListener('keydown', e => { if (e.key === 'Enter') confirmTambahPaket(); });

  function confirmTambahPaket() {
    const nama = document.getElementById('inp-nama-paket').value.trim();
    if (!nama) { toast('Nama paket tidak boleh kosong.'); return; }
    if (paketList.find(p => p.nama.toLowerCase() === nama.toLowerCase())) { toast('Nama paket sudah ada!'); return; }
    const newPaket = { id: nextPaketId++, nama, soal: [] };
    paketList.push(newPaket);
    activePaketId = newPaket.id;
    closeModalPaket();
    renderPaketSelect();
    renderPaketTabs();
    renderSoalList();
    toast('Paket "' + nama + '" berhasil ditambahkan!');
  }

  // ── MODAL HAPUS PAKET ──
  let hapusPaketTarget = null;

  function openModalHapusPaket(paketId) {
    hapusPaketTarget = paketId;
    const paket = paketList.find(p => p.id === paketId);
    const n = paket.soal.length;
    document.getElementById('modal-hapus-paket-msg').textContent =
      `Paket "${paket.nama}"${n > 0 ? ` beserta ${n} soal di dalamnya` : ''} akan dihapus permanen.`;
    document.getElementById('modal-hapus-paket').classList.add('open');
  }

  function closeModalHapusPaket() {
    hapusPaketTarget = null;
    document.getElementById('modal-hapus-paket').classList.remove('open');
  }

  function confirmHapusPaket() {
    if (!hapusPaketTarget) return;
    const idx = paketList.findIndex(p => p.id === hapusPaketTarget);
    const nama = paketList[idx].nama;
    paketList.splice(idx, 1);
    // Set active ke paket pertama yang tersisa, atau 0 jika kosong
    activePaketId = paketList.length > 0 ? paketList[0].id : null;
    closeModalHapusPaket();
    renderPaketSelect();
    renderPaketTabs();
    renderSoalList();
    toast(`Paket "${nama}" dihapus.`);
  }

  // ── MODAL HAPUS SOAL ──
  function openModalHapus(paketId, soalIdx) {
    hapusTarget = { paketId, soalIdx };
    document.getElementById('modal-hapus').classList.add('open');
  }

  function closeModalHapus() {
    hapusTarget = null;
    document.getElementById('modal-hapus').classList.remove('open');
  }

  function confirmHapus() {
    if (!hapusTarget) return;
    const paket = paketList.find(p => p.id === hapusTarget.paketId);
    if (paket) paket.soal.splice(hapusTarget.soalIdx, 1);
    closeModalHapus();
    renderSoalList();
    toast('Soal dihapus.');
  }

  // ── KERJAKAN SOAL ──

  // Skor history per paket id
  let paketSkor = {}; // { paketId: { skor, total, pct } }

  function showPilihPaket() {
    selectedPaket = null;
    document.getElementById('kerjakan-title').textContent = 'Pilih Paket Soal';
    const tersedia = paketList.filter(p => p.soal.length > 0);

    if (tersedia.length === 0) {
      document.getElementById('quiz-body').innerHTML = `<div class="empty-state" style="padding-top:60px">Belum ada soal tersedia.<br><button class="btn-sm blue" style="margin-top:16px" onclick="showPage('dashboard')">← Kembali</button></div>`;
      return;
    }

    document.getElementById('quiz-body').innerHTML = `
      <div style="font-size:13px;color:#888;margin-bottom:14px">Pilih paket soal yang ingin dikerjakan:</div>
      <div class="paket-grid" id="paket-grid">
        ${tersedia.map((p, i) => {
          const s = paketSkor[p.id];
          const skorBadge = s
            ? `<div class="pk-skor" style="margin-top:8px;font-size:12px;font-weight:700;color:${s.pct>=80?'#188038':s.pct>=60?'#f57c00':'#c0392b'}">
                Skor terakhir: ${s.pct}%
               </div>`
            : `<div class="pk-skor" style="margin-top:8px;font-size:12px;color:#bbb">Belum dikerjakan</div>`;
          return `<div class="paket-card" id="pk-${i}" onclick="selectPaket(${i})">
            <div class="pk-title">${p.nama}</div>
            <div class="pk-count">${p.soal.length} soal</div>
            ${skorBadge}
          </div>`;
        }).join('')}
      </div>
      <div class="paket-start">
        <button class="btn-sm blue" id="btn-mulai" onclick="mulaiKerjakan()" disabled style="opacity:0.45">Mulai Ujian →</button>
        <span id="paket-hint" style="font-size:13px;color:#aaa">Pilih paket terlebih dahulu</span>
      </div>`;
  }

  function selectPaket(i) {
    selectedPaket = i;
    document.querySelectorAll('.paket-card').forEach((el, idx) => el.classList.toggle('selected', idx === i));
    const tersedia = paketList.filter(p => p.soal.length > 0);
    document.getElementById('btn-mulai').disabled = false;
    document.getElementById('btn-mulai').style.opacity = '1';
    document.getElementById('paket-hint').textContent = tersedia[i].soal.length + ' soal dipilih';
  }

  function mulaiKerjakan() {
    if (selectedPaket === null) return;
    const tersedia = paketList.filter(p => p.soal.length > 0);
    const paket = tersedia[selectedPaket];
    quiz = {
      idx: 0,
      score: 0,
      answered: false,
      soalList: paket.soal,
      paketNama: paket.nama,
      paketId: paket.id,
      jawabanUser: [] // simpan jawaban user per soal
    };
    document.getElementById('kerjakan-title').textContent = paket.nama;
    renderQuestion();
  }

  function backFromKerjakan() {
    const body = document.getElementById('quiz-body');
    if (body.querySelector('.paket-grid') || body.querySelector('.result-box')) {
      showPage('dashboard');
    } else {
      showPilihPaket();
    }
  }

  // ── QUIZ ──
  function renderQuestion() {
    const q = quiz.soalList[quiz.idx];
    const total = quiz.soalList.length;
    const pilihanUser = quiz.jawabanUser[quiz.idx]; // undefined jika belum dijawab

    document.getElementById('quiz-body').innerHTML = `
      <div class="progress-wrap">
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(quiz.idx/total*100)}%"></div></div>
        <span class="progress-label">${quiz.idx + 1} / ${total}</span>
      </div>
      <div class="q-card">
        <div class="q-num">Soal ${quiz.idx + 1}</div>
        <div class="q-text">${q.soal}</div>
        ${q.opsi.map((o, i) => `
          <div class="choice ${pilihanUser === i ? 'selected' : ''}" id="c${i}" onclick="pilih(${i})">
            <div class="choice-letter">${'ABCD'[i]}</div>${o}
          </div>`).join('')}
      </div>
      <div class="q-actions" style="justify-content:space-between">
        <button class="btn-sm" onclick="prevQ()" ${quiz.idx === 0 ? 'disabled style="opacity:0.4"' : ''}>← Sebelumnya</button>
        ${quiz.idx + 1 < total
          ? `<button class="btn-sm blue" onclick="nextQ()">Berikutnya →</button>`
          : `<button class="btn-sm blue" onclick="submitQuiz()">Submit Jawaban ✓</button>`
        }
      </div>`;
  }

  function pilih(i) {
    // Simpan jawaban, boleh ganti sebelum submit
    quiz.jawabanUser[quiz.idx] = i;
    // Highlight pilihan
    document.querySelectorAll('.choice').forEach((el, idx) => {
      el.classList.toggle('selected', idx === i);
    });
  }

  function prevQ() {
    if (quiz.idx > 0) { quiz.idx--; renderQuestion(); }
  }

  function nextQ() {
    quiz.idx++;
    renderQuestion();
  }

  function submitQuiz() {
    // Cek apakah semua soal sudah dijawab
    const total = quiz.soalList.length;
    const belumDijawab = [];
    for (let i = 0; i < total; i++) {
      if (quiz.jawabanUser[i] === undefined) belumDijawab.push(i + 1);
    }
    if (belumDijawab.length > 0) {
      toast(`Soal ${belumDijawab.join(', ')} belum dijawab!`);
      return;
    }
    // Hitung skor
    quiz.score = 0;
    for (let i = 0; i < total; i++) {
      if (quiz.jawabanUser[i] === quiz.soalList[i].jawaban) quiz.score++;
    }
    const pct = Math.round(quiz.score / total * 100);
    paketSkor[quiz.paketId] = { skor: quiz.score, total, pct };
    showResult();
  }

  function showResult() {
    const total = quiz.soalList.length;
    const pct = Math.round(quiz.score / total * 100);
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : pct >= 40 ? '📚' : '😅';

    // Buat review per soal
    const reviewHtml = quiz.soalList.map((q, i) => {
      const user = quiz.jawabanUser[i];
      const benar = q.jawaban;
      const isCorrect = user === benar;
      return `
        <div style="background:#fff;border:1px solid ${isCorrect?'#c3e6cb':'#f5c6cb'};border-radius:8px;padding:14px 16px;margin-bottom:8px">
          <div style="font-size:12px;font-weight:700;color:${isCorrect?'#188038':'#c0392b'};margin-bottom:6px">
            ${isCorrect ? '✓ Benar' : '✗ Salah'} — Soal ${i+1}
          </div>
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;line-height:1.5">${q.soal}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${q.opsi.map((o, oi) => {
              let bg = '#f9f9f9', border = '#e0e0e0', color = '#444';
              if (oi === benar) { bg = '#e6f4ea'; border = '#188038'; color = '#188038'; }
              else if (oi === user && !isCorrect) { bg = '#fdecea'; border = '#c0392b'; color = '#c0392b'; }
              return `<div style="padding:7px 10px;border-radius:6px;font-size:12px;border:1px solid ${border};background:${bg};color:${color}">
                <b>${'ABCD'[oi]}.</b> ${o}
                ${oi === benar ? ' ✓' : ''}
                ${oi === user && !isCorrect ? ' ✗' : ''}
              </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');

    document.getElementById('quiz-body').innerHTML = `
      <div class="result-box">
        <div class="result-emoji">${emoji}</div>
        <div class="result-score">${pct}%</div>
        <div class="result-label">Skor kamu — ${quiz.paketNama}</div>
        <div class="result-stats">
          <div><div class="r-stat-val" style="color:#188038">${quiz.score}</div><div class="r-stat-lbl">Benar</div></div>
          <div><div class="r-stat-val" style="color:#c0392b">${total - quiz.score}</div><div class="r-stat-lbl">Salah</div></div>
          <div><div class="r-stat-val">${total}</div><div class="r-stat-lbl">Total</div></div>
        </div>
        <div class="result-btns" style="margin-bottom:24px">
          <button class="btn-sm" onclick="showPilihPaket()">← Paket Lain</button>
          <button class="btn-sm blue" onclick="mulaiKerjakan()">Ulangi</button>
        </div>
      </div>
      <div style="font-size:14px;font-weight:700;margin:24px 0 12px">Pembahasan</div>
      ${reviewHtml}`;
  }

  // ── TOAST ──
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
  }