/* MCStore — local data layer: schema, IDs, persistence, backup/restore, import validation, v4 migration.
 * Pure functions are DOM-free so they can be unit-tested in Node. */
(function (root) {
  'use strict';
  var APP_VERSION = '5.0.0-dev';
  var SCHEMA_VERSION = 5;
  var KEY = 'MCC_V5_DB', RESTORE_KEY = 'MCC_V5_RESTORE', V4_KEY = 'MC_V3';
  var B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  var COLLECTIONS = ['trainees', 'screenings', 'baselines', 'plans', 'sessions', 'reviews', 'audit'];
  var PREFIX = { trainees: 'TR5', screenings: 'SC5', baselines: 'BL5', plans: 'PL5', sessions: 'SS5', reviews: 'RV5', audit: 'AU5' };

  function nowISO() { return new Date().toISOString(); }
  function randomValues(n) {
    var a = new Uint8Array(n), c = root.crypto || (typeof globalThis !== 'undefined' && globalThis.crypto);
    if (c && c.getRandomValues) { c.getRandomValues(a); return { bytes: a, secure: true }; }
    for (var i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
    return { bytes: a, secure: false };
  }
  function checkChar(body) {
    var s = 0, chars = body.replace(/[^0-9A-Z]/g, '');
    for (var i = 0; i < chars.length; i++) { var v = B32.indexOf(chars[i]); if (v < 0) v = chars.charCodeAt(i) % 32; s = (s + v * (2 * i + 1)) % 32; /* odd weights: every single-character substitution changes the sum */ }
    return B32[s];
  }
  /* Human-readable, collision-resistant ID: PREFIX-[YYYYWww-]XXXXX-XXXXC (50 random bits + check char). */
  function makeId(prefix, extra) {
    var r = randomValues(10), s = '';
    for (var i = 0; i < 10; i++) s += B32[r.bytes[i] & 31];
    var body = prefix + '-' + (extra ? extra + '-' : '') + s.slice(0, 5) + '-' + s.slice(5, 9);
    return body + checkChar(body);
  }
  function idValid(id) {
    if (typeof id !== 'string' || !/^[A-Z]{2}5-(\d{4}W\d{2}-)?[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/.test(id)) return false;
    return checkChar(id.slice(0, -1)) === id.slice(-1);
  }
  function normalizeId(s) {
    var x = String(s || '').trim().toUpperCase().replace(/\s+/g, ''), i = x.indexOf('-');
    if (i < 0) return x.replace(/O/g, '0').replace(/[IL]/g, '1');
    return x.slice(0, i + 1) + x.slice(i + 1).replace(/O/g, '0').replace(/[IL]/g, '1'); /* keep the prefix (e.g. PL5) intact */
  }
  function isoWeek(dateStr) {
    var d = new Date(dateStr + 'T12:00:00Z'); var day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day + 3);
    var y = d.getUTCFullYear(), jan4 = new Date(Date.UTC(y, 0, 4));
    var w = 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
    return y + 'W' + (w < 10 ? '0' : '') + w;
  }
  function uniqueId(db, coll, extra) {
    for (var i = 0; i < 20; i++) { var id = makeId(PREFIX[coll], extra); if (!db[coll].some(function (x) { return x.id === id; })) return id; }
    throw new Error('تعذر توليد معرف فريد');
  }

  function emptyDB() {
    var t = nowISO();
    return { schema: 'MCC', schemaVersion: SCHEMA_VERSION, appVersion: APP_VERSION, createdAt: t, updatedAt: t,
      settings: { coachName: '', emergencyNumber: '999', weekStartDay: 0 },
      trainees: [], screenings: [], baselines: [], plans: [], sessions: [], reviews: [], audit: [], legacy: null };
  }

  /* FNV-1a 32-bit checksum of a string (integrity check for export files; not a security signature). */
  function fnv(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('00000000' + h.toString(16)).slice(-8);
  }

  /* ---------- validation of an untrusted object ---------- */
  var MAXSTR = 4000;
  function cleanValue(v, depth, path, errs) {
    if (depth > 12) { errs.push(path + ': تداخل مفرط'); return null; }
    if (v === null || typeof v === 'boolean') return v;
    if (typeof v === 'number') { if (!isFinite(v)) { errs.push(path + ': رقم غير صالح'); return null; } return v; }
    if (typeof v === 'string') return v.length > MAXSTR ? v.slice(0, MAXSTR) : v;
    if (Array.isArray(v)) { if (v.length > 5000) { errs.push(path + ': مصفوفة كبيرة جداً'); return []; } return v.map(function (x, i) { return cleanValue(x, depth + 1, path + '[' + i + ']', errs); }); }
    if (typeof v === 'object') {
      var o = {};
      Object.keys(v).forEach(function (k) { if (k === '__proto__' || k === 'constructor' || k === 'prototype') { errs.push(path + ': مفتاح محظور'); return; } o[k] = cleanValue(v[k], depth + 1, path + '.' + k, errs); });
      return o;
    }
    errs.push(path + ': نوع غير مدعوم'); return null;
  }
  var REQUIRED = {
    trainees: ['id', 'displayName', 'createdAt'],
    screenings: ['id', 'traineeId', 'at', 'version', 'answers', 'outcome'],
    baselines: ['id', 'traineeId', 'at', 'version', 'tests'],
    plans: ['id', 'traineeId', 'weekStart', 'createdAt', 'ruleVersion', 'status'],
    sessions: ['id', 'traineeId', 'planId', 'dayIndex', 'status'],
    reviews: ['id', 'traineeId', 'planId', 'at', 'answers', 'decision'],
    audit: ['id', 'at', 'type']
  };
  function validateDBShape(obj) {
    var errs = [], warns = [];
    if (!obj || typeof obj !== 'object') return { ok: false, errors: ['الملف لا يحتوي كائناً صالحاً'], warnings: [] };
    if (obj.schema !== 'MCC') errs.push('الحقل schema يجب أن يكون MCC');
    if (typeof obj.schemaVersion !== 'number') errs.push('رقم إصدار المخطط مفقود');
    else if (obj.schemaVersion > SCHEMA_VERSION) errs.push('الملف من إصدار أحدث (' + obj.schemaVersion + ') من هذا التطبيق (' + SCHEMA_VERSION + ')');
    COLLECTIONS.forEach(function (c) {
      if (!Array.isArray(obj[c])) { errs.push('المجموعة ' + c + ' مفقودة أو ليست مصفوفة'); return; }
      var ids = {};
      obj[c].forEach(function (r, i) {
        if (!r || typeof r !== 'object' || Array.isArray(r)) { errs.push(c + '[' + i + ']: سجل غير صالح'); return; }
        REQUIRED[c].forEach(function (k) { if (r[k] === undefined || r[k] === null || r[k] === '') errs.push(c + '[' + i + ']: الحقل ' + k + ' مفقود'); });
        if (typeof r.id === 'string') {
          if (!idValid(r.id)) errs.push(c + '[' + i + ']: معرف غير صالح ' + String(r.id).slice(0, 40));
          if (ids[r.id]) errs.push(c + ': معرف مكرر ' + r.id); ids[r.id] = 1;
        }
      });
    });
    if (!errs.length) {
      var tids = {}; obj.trainees.forEach(function (t) { tids[t.id] = 1; });
      ['screenings', 'baselines', 'plans', 'sessions', 'reviews'].forEach(function (c) {
        obj[c].forEach(function (r) { if (!tids[r.traineeId]) errs.push(c + ' ' + r.id + ': يشير إلى متدرب غير موجود في الملف'); });
      });
      var pids = {}; obj.plans.forEach(function (p) { pids[p.id] = 1; });
      obj.sessions.concat(obj.reviews).forEach(function (r) { if (!pids[r.planId]) errs.push(r.id + ': يشير إلى خطة غير موجودة'); });
    }
    return { ok: !errs.length, errors: errs.slice(0, 50), warnings: warns };
  }

  /* Parse an export file text. Returns {ok, errors, warnings, kind, data}. Never executes content. */
  function parseImport(text) {
    var res = { ok: false, errors: [], warnings: [], kind: null, data: null };
    if (typeof text !== 'string' || text.length > 20 * 1024 * 1024) { res.errors.push('حجم الملف غير مقبول (الحد 20 ميغابايت)'); return res; }
    var obj;
    try { obj = JSON.parse(text); } catch (e) { res.errors.push('ليس ملف JSON صالحاً: ' + e.message); return res; }
    var cleanErrs = [];
    obj = cleanValue(obj, 0, '$', cleanErrs);
    if (cleanErrs.length) { res.errors = cleanErrs.slice(0, 20); return res; }
    if (obj && obj.format === 'MCC-EXPORT') {
      if (obj.formatVersion !== 1) { res.errors.push('إصدار تنسيق التصدير غير مدعوم'); return res; }
      var sum = fnv(JSON.stringify(obj.data));
      if (sum !== obj.checksum) { res.errors.push('فشل التحقق من سلامة الملف (checksum): الملف معدَّل أو تالف. لم يُستورد أي شيء.'); return res; }
      var v = validateDBShape(obj.data);
      res.errors = v.errors; res.warnings = v.warnings; res.ok = v.ok; res.kind = obj.scope === 'trainee' ? 'v5-trainee' : 'v5-full'; res.data = obj.data;
      res.meta = { exportedAt: obj.exportedAt, appVersion: obj.appVersion, scope: obj.scope };
      return res;
    }
    if (obj && Array.isArray(obj.people) && Array.isArray(obj.plans) && Array.isArray(obj.reviews)) {
      var m = migrateV4(obj);
      res.ok = m.ok; res.errors = m.errors; res.warnings = m.warnings; res.kind = 'v4'; res.data = m.data; return res;
    }
    if (obj && obj.schema === 'MCC') { var v2 = validateDBShape(obj); res.ok = v2.ok; res.errors = v2.errors; res.kind = 'v5-raw'; res.data = obj; res.warnings.push('ملف قاعدة بيانات خام بدون غلاف تصدير وبدون checksum'); return res; }
    res.errors.push('بنية غير معروفة: ليس ملف تصدير من هذا التطبيق ولا نسخة v4');
    return res;
  }

  /* v4 (key MC_V3 / MC-backup-v4.json) → v5. v4 screening answers are kept as legacy raw data only;
   * every migrated trainee must be re-screened under the v5 rules before any new plan is generated. */
  function migrateV4(v4) {
    var out = emptyDB(), errs = [], warns = [], t = nowISO();
    var sexMap = { 'ذكر': 'male', 'أنثى': 'female' };
    var idMap = {};
    (v4.people || []).forEach(function (p, i) {
      if (!p || typeof p !== 'object' || typeof p.name !== 'string' || !p.name.trim()) { warns.push('v4 people[' + i + ']: بدون اسم — تم تجاهله'); return; }
      var id = uniqueId(out, 'trainees');
      idMap[p.id] = id;
      var n = function (x) { var v = Number(x); return isFinite(v) && x !== '' && x != null ? v : null; };
      out.trainees.push({ id: id, displayName: p.name.trim().slice(0, 120), internalId: '', coachName: '', age: n(p.age), sex: sexMap[p.sex] || '',
        heightCm: n(p.height), weightKg: n(p.weight), bodyMetricsConsent: n(p.height) != null || n(p.weight) != null,
        goal: ({ 'لياقة عامة': 'general', 'تحمل': 'endurance', 'قوة وزن الجسم': 'strength', 'خفض الوزن': 'weight', 'حركة ومرونة': 'mobility' })[p.goal] || 'general',
        experience: ({ 'مبتدئ': 'beginner', 'متوسط': 'intermediate', 'متقدم': 'advanced' })[p.experience] || 'beginner',
        days: [0, 2, 4].slice(0, Math.max(1, Math.min(3, n(p.days) || 3))), minutes: Math.max(15, Math.min(90, n(p.minutes) || 30)),
        equipment: p.equipment === 'عقلة ثابتة' ? ['bar'] : p.equipment === 'عقلة وكرسي ثابت' ? ['bar', 'chair'] : [],
        limitations: [], accessibility: '', notes: typeof p.notes === 'string' ? p.notes.slice(0, 1000) : '', avoid: [],
        archived: false, createdAt: t, updatedAt: t, consent: null, legacyV4: { id: String(p.id || ''), raw: p } });
    });
    out.legacy = { v4: { importedAt: t, plans: (v4.plans || []).slice(0, 2000), reviews: (v4.reviews || []).slice(0, 2000), idMap: idMap } };
    warns.push('تم ترحيل ' + out.trainees.length + ' متدرب من v4. خطط v4 ومراجعاتها محفوظة للقراءة فقط في السجل. يجب إعادة الفحص الصحي والتقييم وفق v5 قبل أي خطة جديدة، ويجب تسجيل موافقة الخصوصية.');
    return { ok: !errs.length, errors: errs, warnings: warns, data: out };
  }

  /* Merge imported data into db. policy: 'keep-local' | 'prefer-imported'. Returns report. Does not mutate on error. */
  function mergeInto(db, data, policy) {
    var rep = { added: {}, skippedSame: 0, conflicts: [], replaced: 0 };
    var next = JSON.parse(JSON.stringify(db));
    COLLECTIONS.forEach(function (c) {
      rep.added[c] = 0;
      (data[c] || []).forEach(function (r) {
        var i = next[c].findIndex(function (x) { return x.id === r.id; });
        if (i < 0) { next[c].push(r); rep.added[c]++; return; }
        if (JSON.stringify(next[c][i]) === JSON.stringify(r)) { rep.skippedSame++; return; }
        rep.conflicts.push(c + ':' + r.id);
        if (policy === 'prefer-imported') { next[c][i] = r; rep.replaced++; }
      });
    });
    if (data.legacy && data.legacy.v4) {
      next.legacy = next.legacy || { v4: { plans: [], reviews: [], idMap: {} } };
      next.legacy.v4.plans = (next.legacy.v4.plans || []).concat(data.legacy.v4.plans || []);
      next.legacy.v4.reviews = (next.legacy.v4.reviews || []).concat(data.legacy.v4.reviews || []);
      Object.assign(next.legacy.v4.idMap = next.legacy.v4.idMap || {}, data.legacy.v4.idMap || {});
    }
    next.updatedAt = nowISO();
    return { db: next, report: rep };
  }

  function exportEnvelope(db, scope, traineeIds) {
    var data;
    if (scope === 'trainee') {
      var set = {}; traineeIds.forEach(function (t) { set[t] = 1; });
      data = emptyDB(); data.settings = db.settings;
      data.trainees = db.trainees.filter(function (t) { return set[t.id]; });
      ['screenings', 'baselines', 'plans', 'sessions', 'reviews'].forEach(function (c) { data[c] = db[c].filter(function (r) { return set[r.traineeId]; }); });
      data.audit = db.audit.filter(function (a) { return set[a.traineeId]; });
    } else data = db;
    return { format: 'MCC-EXPORT', formatVersion: 1, appVersion: APP_VERSION, schemaVersion: SCHEMA_VERSION, exportedAt: nowISO(), scope: scope, traineeIds: traineeIds || [], checksum: fnv(JSON.stringify(data)), data: data };
  }

  function safeFileName(s) { return String(s || 'file').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/\s+/g, '_').slice(0, 80); }

  /* ---------- persistence (browser only) ---------- */
  var mem = null, status = { mode: 'unknown', lastSaved: null, error: null, bytes: 0, secureIds: !!(root.crypto && root.crypto.getRandomValues) };
  function storageAvailable() {
    try { var k = '__mcc_test__'; root.localStorage.setItem(k, '1'); root.localStorage.removeItem(k); return true; } catch (e) { return false; }
  }
  function load() {
    if (!root.localStorage || !storageAvailable()) { status.mode = 'memory'; status.error = 'التخزين المحلي غير متاح في هذا المتصفح/الوضع. البيانات ستضيع عند إغلاق الصفحة — صدّر نسخة JSON.'; mem = emptyDB(); return mem; }
    status.mode = 'local';
    var raw = root.localStorage.getItem(KEY);
    if (!raw) { mem = emptyDB(); status.known = null; return mem; }
    try {
      var obj = JSON.parse(raw); var v = validateDBShape(obj);
      if (!v.ok) throw new Error(v.errors.slice(0, 3).join('؛ '));
      mem = obj; status.bytes = raw.length; status.known = obj.updatedAt; return mem;
    } catch (e) {
      try { root.localStorage.setItem(KEY + '_CORRUPT_' + Date.now(), raw); } catch (e2) { /* ignore */ }
      status.error = 'تعذرت قراءة البيانات المحلية (' + e.message + '). حُفظت نسخة من البيانات التالفة جانباً ولم تُحذف. ابدأ من نسخة احتياطية.';
      mem = emptyDB(); status.mode = 'local-recovered'; status.known = storedStamp(); return mem;
    }
  }
  /* Optimistic concurrency: refuse to overwrite data written by another tab/window since we last read or wrote it. */
  function storedStamp() { try { var raw = root.localStorage.getItem(KEY); if (!raw) return null; var o = JSON.parse(raw); return (o && o.updatedAt) || 'unknown'; } catch (e) { return 'unparseable'; } }
  function save(db) {
    if (status.mode === 'memory') { db.updatedAt = nowISO(); return false; }
    if (status.conflict) return false;
    var cur = storedStamp();
    if (cur !== status.known) { status.conflict = true; status.error = 'عُدّلت البيانات من نافذة أو تبويب آخر لهذا الملف. لم يُحفظ التغيير الأخير لتجنب الكتابة فوق تلك البيانات. أعد تحميل الصفحة (F5) ثم أعد الإجراء.'; return false; }
    db.updatedAt = nowISO();
    try { var s = JSON.stringify(db); root.localStorage.setItem(KEY, s); status.known = db.updatedAt; status.lastSaved = db.updatedAt; status.bytes = s.length; status.error = null; return true; }
    catch (e) { status.error = 'فشل الحفظ المحلي (' + e.name + '). صدّر نسخة JSON الآن.'; return false; }
  }
  function restorePoints() { try { return JSON.parse(root.localStorage.getItem(RESTORE_KEY) || '[]'); } catch (e) { return []; } }
  function addRestorePoint(db, reason) {
    if (status.mode === 'memory') return false;
    try { var rp = restorePoints(); rp.unshift({ at: nowISO(), reason: reason, db: db }); root.localStorage.setItem(RESTORE_KEY, JSON.stringify(rp.slice(0, 3))); return true; }
    catch (e) { return false; }
  }
  function readV4Local() { try { var x = root.localStorage && root.localStorage.getItem(V4_KEY); return x ? JSON.parse(x) : null; } catch (e) { return null; } }

  root.MCStore = { APP_VERSION: APP_VERSION, SCHEMA_VERSION: SCHEMA_VERSION, COLLECTIONS: COLLECTIONS, KEY: KEY, V4_KEY: V4_KEY,
    makeId: makeId, uniqueId: uniqueId, idValid: idValid, normalizeId: normalizeId, isoWeek: isoWeek, emptyDB: emptyDB, fnv: fnv,
    validateDBShape: validateDBShape, parseImport: parseImport, migrateV4: migrateV4, mergeInto: mergeInto, exportEnvelope: exportEnvelope,
    safeFileName: safeFileName, load: load, save: save, status: status, restorePoints: restorePoints, addRestorePoint: addRestorePoint, readV4Local: readV4Local, nowISO: nowISO };
})(typeof window !== 'undefined' ? window : globalThis);
