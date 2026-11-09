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

  /* ---------- optional encryption (Web Crypto: PBKDF2-SHA256 → AES-GCM-256) ---------- */
  var ENC = { iter: 310000 };
  function b64(u8) { var s = ''; for (var i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(t) { var s = atob(t), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  function subtle() { var c = root.crypto; if (!c || !c.subtle) throw new Error('التشفير غير متاح في هذا المتصفح'); return c.subtle; }
  function deriveKey(pass, salt, iter) {
    return subtle().importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return subtle().deriveKey({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function encryptWith(key, salt, iter, text, extra) {
    var iv = randomValues(12).bytes;
    return subtle().encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(text)).then(function (ct) {
      return Object.assign({ kdf: 'PBKDF2-SHA256', iter: iter, salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)) }, extra || {});
    });
  }
  function decryptEnv(env, pass) {
    if (!env || typeof env.salt !== 'string' || typeof env.iv !== 'string' || typeof env.ct !== 'string' || !(env.iter >= 100000 && env.iter <= 5000000)) return Promise.reject(new Error('غلاف تشفير غير صالح'));
    var salt = unb64(env.salt);
    return deriveKey(pass, salt, env.iter).then(function (key) {
      return subtle().decrypt({ name: 'AES-GCM', iv: unb64(env.iv) }, key, unb64(env.ct)).then(function (pt) { return { text: new TextDecoder().decode(pt), key: key, salt: salt }; },
        function () { throw new Error('كلمة المرور غير صحيحة أو الملف تالف'); });
    });
  }
  /* Encrypted export file: {format:'MCC-EXPORT-ENC', ...} wrapping the normal MCC-EXPORT JSON text. */
  function encryptExport(text, pass) {
    var salt = randomValues(16).bytes;
    return deriveKey(pass, salt, ENC.iter).then(function (key) { return encryptWith(key, salt, ENC.iter, text, { format: 'MCC-EXPORT-ENC', formatVersion: 1, appVersion: APP_VERSION, exportedAt: nowISO() }); });
  }
  function isEncryptedExport(text) { try { var o = JSON.parse(text); return !!(o && o.format === 'MCC-EXPORT-ENC'); } catch (e) { return false; } }
  function decryptExport(text, pass) { return decryptEnv(JSON.parse(text), pass).then(function (r) { return r.text; }); }

  /* ---------- persistence (browser only) ---------- */
  var mem = null, status = { mode: 'unknown', lastSaved: null, error: null, bytes: 0, secureIds: !!(root.crypto && root.crypto.getRandomValues), encrypted: false, locked: false, key: null, salt: null, pending: 0, memRestore: [] };
  var lockedEnv = null, chain = Promise.resolve();
  function storageAvailable() {
    try { var k = '__mcc_test__'; root.localStorage.setItem(k, '1'); root.localStorage.removeItem(k); return true; } catch (e) { return false; }
  }
  function load() {
    if (!root.localStorage || !storageAvailable()) { status.mode = 'memory'; status.error = 'التخزين المحلي غير متاح في هذا المتصفح/الوضع. البيانات ستضيع عند إغلاق الصفحة — صدّر نسخة JSON.'; mem = emptyDB(); return mem; }
    status.mode = 'local';
    var raw = root.localStorage.getItem(KEY);
    if (!raw) { mem = emptyDB(); status.known = null; return mem; }
    try {
      var obj = JSON.parse(raw);
      if (obj && obj.schema === 'MCC-ENC') { lockedEnv = obj; status.encrypted = true; status.locked = true; status.encVersion = obj.v || 1; status.known = obj.updatedAt; status.bytes = raw.length; mem = emptyDB(); return mem; }
      var v = validateDBShape(obj);
      if (!v.ok) throw new Error(v.errors.slice(0, 3).join('؛ '));
      mem = obj; status.bytes = raw.length; status.known = obj.updatedAt; return mem;
    } catch (e) {
      try { root.localStorage.setItem(KEY + '_CORRUPT_' + Date.now(), raw); } catch (e2) { /* ignore */ }
      status.error = 'تعذرت قراءة البيانات المحلية (' + e.message + '). حُفظت نسخة من البيانات التالفة جانباً ولم تُحذف. ابدأ من نسخة احتياطية.';
      mem = emptyDB(); status.mode = 'local-recovered'; status.known = storedStamp(); return mem;
    }
  }
  /* Unlock encrypted storage. Resolves to the DB; rejects on wrong passphrase (data untouched). */
  function unlock(pass) {
    return decryptEnv(lockedEnv, pass).then(function (r) {
      var obj = JSON.parse(r.text), v = validateDBShape(obj);
      if (!v.ok) throw new Error('البيانات بعد فك التشفير غير صالحة: ' + v.errors[0]);
      status.key = r.key; status.salt = r.salt; status.locked = false; mem = obj; return obj;
    });
  }
  /* ---------- multi-user accounts (envelope v2) ----------
   * One random data key (DEK, AES-GCM-256) encrypts the database. For every user the DEK is wrapped with a key derived
   * from that user's password (PBKDF2-SHA256). Any listed user can open the same file; the owner (admin) adds/removes users.
   * Limits: this is local file protection, not a server. A removed user can still open copies saved before removal. */
  function normUser(u) { return String(u || '').trim().toLowerCase(); }
  function wrapFor(dek, user, pass, role) {
    var salt = randomValues(16).bytes;
    return deriveKey(pass, salt, ENC.iter).then(function (kek) {
      return subtle().exportKey('raw', dek).then(function (raw) { var iv = randomValues(12).bytes; return subtle().encrypt({ name: 'AES-GCM', iv: iv }, kek, raw).then(function (wk) {
        return { u: normUser(user), role: role, iter: ENC.iter, salt: b64(salt), wiv: b64(iv), wk: b64(new Uint8Array(wk)), created: nowISO() }; }); });
    });
  }
  function unwrapFor(entry, pass) {
    return deriveKey(pass, unb64(entry.salt), entry.iter).then(function (kek) {
      return subtle().decrypt({ name: 'AES-GCM', iv: unb64(entry.wiv) }, kek, unb64(entry.wk)).then(function (raw) {
        return subtle().importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']); }, function () { throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة'); });
    });
  }
  function createAccounts(db, user, pass) {
    if (normUser(user).length < 3 || String(pass).length < 8) return Promise.reject(new Error('اسم المستخدم 3 أحرف وكلمة المرور 8 أحرف على الأقل'));
    return subtle().generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']).then(function (dek) {
      return wrapFor(dek, user, pass, 'admin').then(function (entry) {
        status.key = dek; status.users = [entry]; status.currentUser = { u: entry.u, role: 'admin' }; status.encrypted = true; status.encVersion = 2;
        try { status.memRestore = restorePoints(); root.localStorage.removeItem(RESTORE_KEY); } catch (e) { /* ignore */ }
        return saveAsync(db);
      });
    });
  }
  function login(user, pass) {
    if (!lockedEnv || lockedEnv.v !== 2) return Promise.reject(new Error('هذه البيانات ليست بنظام الحسابات'));
    var entry = (lockedEnv.users || []).filter(function (x) { return x.u === normUser(user); })[0];
    if (!entry) return Promise.reject(new Error('اسم المستخدم أو كلمة المرور غير صحيحة'));
    return unwrapFor(entry, pass).then(function (dek) {
      return subtle().decrypt({ name: 'AES-GCM', iv: unb64(lockedEnv.iv) }, dek, unb64(lockedEnv.ct)).then(function (pt) {
        var obj = JSON.parse(new TextDecoder().decode(pt)), v = validateDBShape(obj);
        if (!v.ok) throw new Error('البيانات بعد فك التشفير غير صالحة: ' + v.errors[0]);
        status.key = dek; status.users = lockedEnv.users.slice(); status.currentUser = { u: entry.u, role: entry.role }; status.locked = false; status.encVersion = 2; mem = obj; return obj;
      });
    });
  }
  function requireAdmin() { if (!status.currentUser || status.currentUser.role !== 'admin') throw new Error('هذه العملية للمالك (admin) فقط'); }
  function addUser(db, user, pass, role) {
    try { requireAdmin(); } catch (e) { return Promise.reject(e); }
    var u = normUser(user);
    if (u.length < 3 || String(pass).length < 8) return Promise.reject(new Error('اسم المستخدم 3 أحرف وكلمة المرور 8 أحرف على الأقل'));
    if (status.users.some(function (x) { return x.u === u; })) return Promise.reject(new Error('اسم المستخدم موجود'));
    return wrapFor(status.key, u, pass, role === 'admin' ? 'admin' : 'coach').then(function (entry) { status.users.push(entry); return saveAsync(db); });
  }
  function removeUser(db, user) {
    try { requireAdmin(); } catch (e) { return Promise.reject(e); }
    var u = normUser(user);
    if (u === status.currentUser.u) return Promise.reject(new Error('لا يمكنك حذف حسابك الحالي'));
    status.users = status.users.filter(function (x) { return x.u !== u; });
    return saveAsync(db);
  }
  function changePassword(db, pass) {
    if (String(pass).length < 8) return Promise.reject(new Error('8 أحرف على الأقل'));
    var me = status.currentUser;
    return wrapFor(status.key, me.u, pass, me.role).then(function (entry) { status.users = status.users.map(function (x) { return x.u === me.u ? entry : x; }); return saveAsync(db); });
  }
  /* Full encrypted copy (same envelope as storage) — another device opens it with any listed user's password. */
  function encryptedCopy() { return flush().then(function () { return root.localStorage.getItem(KEY); }); }
  function isAccountsCopy(text) { try { var o = JSON.parse(text); return !!(o && o.schema === 'MCC-ENC' && o.v === 2 && Array.isArray(o.users)); } catch (e) { return false; } }
  function openCopy(text) { var o = JSON.parse(text); if (!(o && o.schema === 'MCC-ENC' && o.v === 2)) throw new Error('ليس ملف نسخة كاملة مشفرة'); lockedEnv = o; status.locked = true; status.encrypted = true; status.encVersion = 2; status.fromFile = true; return true; }
  function adoptOpenedCopy() { try { root.localStorage.setItem(KEY, JSON.stringify(lockedEnv)); status.known = lockedEnv.updatedAt; status.fromFile = false; return true; } catch (e) { return false; } }
  function users() { return (status.users || []).map(function (x) { return { u: x.u, role: x.role, created: x.created }; }); }

  function enableEncryption(db, pass) {
    var salt = randomValues(16).bytes;
    return deriveKey(pass, salt, ENC.iter).then(function (key) {
      status.key = key; status.salt = salt; status.encrypted = true;
      try { status.memRestore = restorePoints(); root.localStorage.removeItem(RESTORE_KEY); } catch (e) { /* ignore */ } /* plaintext restore points must not remain */
      return saveAsync(db);
    });
  }
  function disableEncryption(db) { if (status.encVersion === 2) requireAdmin(); status.key = null; status.salt = null; status.encrypted = false; status.users = null; status.currentUser = null; status.encVersion = null; return save(db); }
  function lockNow() { status.key = null; }
  /* Optimistic concurrency: refuse to overwrite data written by another tab/window since we last read or wrote it. */
  function storedStamp() { try { var raw = root.localStorage.getItem(KEY); if (!raw) return null; var o = JSON.parse(raw); return (o && o.updatedAt) || 'unknown'; } catch (e) { return 'unparseable'; } }
  function save(db) {
    if (status.mode === 'memory') { db.updatedAt = nowISO(); return false; }
    if (status.conflict || status.locked) return false;
    var cur = storedStamp();
    if (!status.pending && cur !== status.known) { status.conflict = true; status.error = 'عُدّلت البيانات من نافذة أو تبويب آخر لهذا الملف. لم يُحفظ التغيير الأخير لتجنب الكتابة فوق تلك البيانات. أعد تحميل الصفحة (F5) ثم أعد الإجراء.'; return false; }
    db.updatedAt = nowISO();
    if (status.encrypted && status.key) { saveAsync(db); return true; }
    try { var s = JSON.stringify(db); root.localStorage.setItem(KEY, s); status.known = db.updatedAt; status.lastSaved = db.updatedAt; status.bytes = s.length; status.error = null; return true; }
    catch (e) { status.error = 'فشل الحفظ المحلي (' + e.name + '). صدّر نسخة JSON الآن.'; return false; }
  }
  /* Encrypted writes are serialised so they land in order. */
  function saveAsync(db) {
    var text = JSON.stringify(db), stamp = db.updatedAt || (db.updatedAt = nowISO());
    status.pending++;
    chain = chain.then(function () {
      if (status.encVersion === 2) { var iv = randomValues(12).bytes; return subtle().encrypt({ name: 'AES-GCM', iv: iv }, status.key, new TextEncoder().encode(text)).then(function (ct) { return { schema: 'MCC-ENC', v: 2, users: status.users, iv: b64(iv), ct: b64(new Uint8Array(ct)), updatedAt: stamp }; }); }
      return encryptWith(status.key, status.salt, ENC.iter, text, { schema: 'MCC-ENC', v: 1, updatedAt: stamp }); }).then(function (env) {
      var s = JSON.stringify(env); root.localStorage.setItem(KEY, s); status.known = stamp; status.lastSaved = stamp; status.bytes = s.length; status.error = null;
    }).catch(function (e) { status.error = 'فشل الحفظ المشفّر (' + e.message + '). صدّر نسخة JSON الآن.'; }).then(function () { status.pending--; if (root.App && root.App.renderStatus) root.App.renderStatus(); });
    return chain;
  }
  function flush() { return chain; }
  function restorePoints() { if (status.encrypted) return status.memRestore; try { return JSON.parse(root.localStorage.getItem(RESTORE_KEY) || '[]'); } catch (e) { return []; } }
  function addRestorePoint(db, reason) {
    if (status.mode === 'memory') return false;
    var snap = JSON.parse(JSON.stringify(db));
    if (status.encrypted) { status.memRestore.unshift({ at: nowISO(), reason: reason, db: snap }); status.memRestore = status.memRestore.slice(0, 3); return true; } /* memory only: never stored in plaintext */
    try { var rp = restorePoints(); rp.unshift({ at: nowISO(), reason: reason, db: snap }); root.localStorage.setItem(RESTORE_KEY, JSON.stringify(rp.slice(0, 3))); return true; }
    catch (e) { return false; }
  }
  function readV4Local() { try { var x = root.localStorage && root.localStorage.getItem(V4_KEY); return x ? JSON.parse(x) : null; } catch (e) { return null; } }

  root.MCStore = { APP_VERSION: APP_VERSION, SCHEMA_VERSION: SCHEMA_VERSION, COLLECTIONS: COLLECTIONS, KEY: KEY, V4_KEY: V4_KEY,
    makeId: makeId, uniqueId: uniqueId, idValid: idValid, normalizeId: normalizeId, isoWeek: isoWeek, emptyDB: emptyDB, fnv: fnv,
    validateDBShape: validateDBShape, parseImport: parseImport, migrateV4: migrateV4, mergeInto: mergeInto, exportEnvelope: exportEnvelope,
    safeFileName: safeFileName, load: load, save: save, status: status, restorePoints: restorePoints, addRestorePoint: addRestorePoint, readV4Local: readV4Local, nowISO: nowISO,
    unlock: unlock, enableEncryption: enableEncryption, createAccounts: createAccounts, login: login, addUser: addUser, removeUser: removeUser, changePassword: changePassword, users: users, encryptedCopy: encryptedCopy, isAccountsCopy: isAccountsCopy, openCopy: openCopy, adoptOpenedCopy: adoptOpenedCopy, disableEncryption: disableEncryption, lockNow: lockNow, flush: flush, encryptExport: encryptExport, decryptExport: decryptExport, isEncryptedExport: isEncryptedExport, ENC_ITER: ENC.iter };
})(typeof window !== 'undefined' ? window : globalThis);
