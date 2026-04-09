// share.js — AutoRepairIQ Pro customer estimate sharing
// Aloha from Pearl City! 🌺

// Resize a base64 photo to a thumbnail (max 480px wide)
function _thumbPhoto(b64, maxW = 480) {
  return new Promise(resolve => {
    if (!b64) return resolve(null);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => resolve(null);
    img.src = b64;
  });
}

function _esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _fmt(n) { return '$' + Number(n || 0).toLocaleString(); }

function _sevColor(s) {
  const map = { minor: '#4ade80', moderate: '#f97316', severe: '#fb7185' };
  return map[String(s).toLowerCase()] || '#a78bfa';
}

async function generateCustomerHTML(scanResult, photos, settings) {
  const v = scanResult.vision || {};
  const p = scanResult.pricing || {};
  const d = scanResult.decision || {};
  const parts = scanResult.parts_map || [];
  const vehicle = scanResult.vehicle || {};
  const shopName = _esc(settings.shopName || 'Auto Repair Shop');
  const shopPhone = _esc(settings.shopPhone || '');
  const ts = new Date().toLocaleString('en-US', { timeZone: 'Pacific/Honolulu', dateStyle: 'medium', timeStyle: 'short' });

  // Compress photos to thumbnails
  const thumbs = await Promise.all(photos.map(ph => _thumbPhoto(ph)));
  const photoImgs = thumbs.filter(Boolean).map(t =>
    `<img src="${t}" alt="damage photo" style="width:100%;border-radius:10px;display:block;">`
  );

  const sevColor = _sevColor(v.severity);
  const partsRows = parts.map(pt => `
    <tr>
      <td style="padding:0.55rem 0.5rem;border-bottom:1px solid #252838;font-size:0.87rem">${_esc(pt.part_name)}</td>
      <td style="padding:0.55rem 0.5rem;border-bottom:1px solid #252838;font-size:0.82rem;color:#a78bfa;font-weight:700;text-align:right">${_esc(pt.repair_action)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Repair Estimate — ${shopName}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0c0d14;color:#eef0f8;font-family:system-ui,-apple-system,sans-serif;line-height:1.55;min-height:100vh}
  .wrap{max-width:520px;margin:0 auto;padding:1.4rem 1.2rem 3rem}
  .brand-bar{height:3px;background:linear-gradient(90deg,#f59e0b,#f97316,#fb7185,#a78bfa,#38bdf8,#4ade80);border-radius:0 0 4px 4px}
  header{padding:1.2rem 1.4rem 1rem;background:#13151f;border-bottom:1px solid #252838;margin-bottom:1.4rem}
  .shop-name{font-size:1.18rem;font-weight:900;letter-spacing:-0.02em;background:linear-gradient(90deg,#f59e0b,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .shop-sub{font-size:0.73rem;color:#7a7f9a;margin-top:0.1rem}
  .vehicle{font-size:1rem;font-weight:800;margin-bottom:0.2rem}
  .ts{font-size:0.72rem;color:#7a7f9a}
  .section{font-size:0.63rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#38bdf8;margin-bottom:0.5rem;margin-top:1.4rem}
  .photos{display:grid;grid-template-columns:${photoImgs.length > 1 ? '1fr 1fr' : '1fr'};gap:0.65rem;margin-bottom:0.2rem}
  .sev-badge{display:inline-block;padding:0.25rem 0.7rem;border-radius:20px;font-size:0.75rem;font-weight:800;text-transform:uppercase;background:${sevColor}22;color:${sevColor};border:1px solid ${sevColor}44;margin-bottom:0.6rem}
  .summary{font-size:0.88rem;color:#b0b8cc;line-height:1.6;background:#13151f;border:1px solid #252838;border-left:3px solid #38bdf8;border-radius:8px;padding:0.8rem 1rem;margin-bottom:0.3rem}
  table{width:100%;border-collapse:collapse;background:#13151f;border-radius:10px;overflow:hidden;border:1px solid #252838}
  .cost-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.6rem;margin-top:0.6rem}
  .cost-box{background:#13151f;border:1px solid #252838;border-radius:10px;padding:0.8rem;text-align:center}
  .cost-box:nth-child(1){border-left:3px solid #f97316}
  .cost-box:nth-child(2){border-left:3px solid #60a5fa}
  .cost-box:nth-child(3){border-left:3px solid #4ade80}
  .cost-label{font-size:0.65rem;font-weight:700;color:#7a7f9a;text-transform:uppercase;margin-bottom:0.25rem}
  .cost-val{font-size:0.92rem;font-weight:800}
  .cost-val.c1{color:#f97316} .cost-val.c2{color:#60a5fa} .cost-val.c3{color:#4ade80}
  .total-bar{background:linear-gradient(135deg,rgba(249,115,22,0.12),rgba(167,139,250,0.08));border:1px solid rgba(249,115,22,0.3);border-radius:12px;padding:1rem 1.2rem;display:flex;justify-content:space-between;align-items:center;margin-top:0.8rem}
  .total-label{font-size:0.78rem;font-weight:700;color:#7a7f9a;text-transform:uppercase}
  .total-val{font-size:1.3rem;font-weight:900;color:#f97316}
  .conf{font-size:0.72rem;color:#7a7f9a;margin-top:0.5rem;text-align:right}
  .approve-section{margin-top:2rem}
  .btn-approve{width:100%;padding:1rem;border-radius:12px;background:linear-gradient(135deg,#16a34a,#4ade80);color:#fff;font-size:1.05rem;font-weight:900;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(74,222,128,0.3);letter-spacing:-0.01em;text-shadow:0 1px 2px rgba(0,0,0,0.2);transition:transform 0.15s,box-shadow 0.15s}
  .btn-approve:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(74,222,128,0.4)}
  .btn-approve:active{transform:translateY(0)}
  .btn-call{width:100%;padding:0.82rem;border-radius:12px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.35);color:#38bdf8;font-size:0.97rem;font-weight:800;cursor:pointer;margin-top:0.8rem;transition:background 0.15s}
  .btn-call:hover{background:rgba(56,189,248,0.15)}
  #approvalConfirm{display:none;background:linear-gradient(135deg,rgba(74,222,128,0.1),rgba(56,189,248,0.06));border:1px solid rgba(74,222,128,0.35);border-radius:12px;padding:1.2rem;text-align:center;margin-top:1rem}
  #approvalConfirm .icon{font-size:2rem;margin-bottom:0.4rem}
  #approvalConfirm .msg{font-size:0.95rem;font-weight:700;color:#4ade80;margin-bottom:0.2rem}
  #approvalConfirm .sub{font-size:0.78rem;color:#7a7f9a}
  .disclaimer{font-size:0.72rem;color:#555a70;text-align:center;margin-top:2rem;line-height:1.6}
  .powered{font-size:0.68rem;color:#444;text-align:center;margin-top:0.6rem}
</style>
</head>
<body>
<div class="brand-bar"></div>
<header>
  <div class="shop-name">🔧 ${shopName}</div>
  <div class="shop-sub">AI-Powered Repair Estimate</div>
</header>
<div class="wrap">
  <div class="vehicle">${_esc(vehicle.year)} ${_esc(vehicle.make)} ${_esc(vehicle.model)}</div>
  <div class="ts">Estimate prepared ${ts} (Hawaii Time)</div>

  ${photoImgs.length ? `
  <div class="section">Damage Photos</div>
  <div class="photos">${photoImgs.join('')}</div>` : ''}

  <div class="section">Assessment</div>
  <div class="sev-badge">${_esc(v.severity || 'unknown')} damage</div>
  <div style="font-size:0.92rem;font-weight:800;margin-bottom:0.5rem">${_esc(v.primary_part || 'Damage Area')}</div>
  <div class="summary">${_esc(d.executive_summary || v.raw_description || 'See line items below.')}</div>

  ${partsRows ? `
  <div class="section">Parts &amp; Work</div>
  <table>
    <tbody>${partsRows}</tbody>
  </table>` : ''}

  <div class="section">Cost Estimate</div>
  <div class="cost-row">
    <div class="cost-box"><div class="cost-label">Parts</div><div class="cost-val c1">${_fmt(p.parts?.low)}–${_fmt(p.parts?.high)}</div></div>
    <div class="cost-box"><div class="cost-label">Labor</div><div class="cost-val c2">${_fmt(p.labor?.low)}–${_fmt(p.labor?.high)}</div></div>
    <div class="cost-box"><div class="cost-label">Paint</div><div class="cost-val c3">${_fmt(p.paint?.low || 0)}–${_fmt(p.paint?.high || 0)}</div></div>
  </div>
  <div class="total-bar">
    <div>
      <div class="total-label">Total Estimate</div>
      <div class="total-val">${_fmt(p.total?.low)} – ${_fmt(p.total?.high)}</div>
    </div>
    <span style="font-size:1.6rem">🔧</span>
  </div>
  ${d.confidence_score ? `<div class="conf">AI Confidence: ${d.confidence_score}/100${d.human_review_flag ? ' · Human review recommended' : ''}</div>` : ''}

  <div class="approve-section">
    <button class="btn-approve" id="approveBtn" onclick="approveEstimate()">✅ Approve Repair</button>
    ${shopPhone ? `<button class="btn-call" onclick="window.location='tel:${_esc(shopPhone)}'">📞 Call ${shopName}</button>` : ''}
    <div id="approvalConfirm">
      <div class="icon">🤙</div>
      <div class="msg">Repair Approved!</div>
      <div class="sub" id="approvalTs"></div>
    </div>
  </div>

  <div class="disclaimer">${_esc(d.disclaimer || 'Preliminary AI estimate only. Final price confirmed at inspection.')}
  <br>All prices in USD. Labor rate may vary.</div>
  <div class="powered">Powered by AutoRepairIQ Pro · Pearl City, Hawaii</div>
</div>
<script>
function approveEstimate() {
  const ts = new Date().toLocaleString();
  localStorage.setItem('ariq_approval_' + Date.now(), JSON.stringify({ approved: true, ts, vehicle: '${_esc(vehicle.year + ' ' + vehicle.make + ' ' + vehicle.model)}' }));
  document.getElementById('approveBtn').style.display = 'none';
  document.getElementById('approvalTs').textContent = 'Approved on ' + ts;
  document.getElementById('approvalConfirm').style.display = 'block';
}
</script>
</body>
</html>`;
}

async function shareEstimateWithCustomer() {
  if (!window.currentScanResult) {
    alert('Run a scan first.'); return;
  }

  const btn = document.getElementById('shareEstimateBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Preparing…'; }

  try {
    const photos = window.scanPhotos || [];
    const settings = window.appSettings || {};
    const html = await generateCustomerHTML(window.currentScanResult, photos, settings);
    const blob = new Blob([html], { type: 'text/html' });
    const file = new File([blob], 'repair-estimate.html', { type: 'text/html' });

    // Try native share with file (Android Web Share Level 2)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: `Repair Estimate — ${settings.shopName || 'Your Shop'}`,
        text: 'Tap the file to view your repair estimate and approve.',
        files: [file],
      });
    } else if (navigator.share) {
      // Fallback: share blob URL (same session only, but triggers share sheet)
      const url = URL.createObjectURL(blob);
      await navigator.share({ title: 'Repair Estimate', url });
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } else {
      // Desktop fallback: auto-download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'repair-estimate.html'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  } catch(e) {
    if (e.name !== 'AbortError') alert('Share failed: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📤 Share with Customer'; }
  }
}
