// שכבת רשת: חדרים בזמן אמת + טבלת מובילים.
// ברירת מחדל: Supabase. בכתובת עם ?mock=1 - מצב בדיקה מקומי בין לשוניות של אותו דפדפן.
(function () {
  const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
  const isMock = /[?&]mock=1/.test(location.search);

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = () => reject(new Error('load failed'));
      document.head.appendChild(s);
    });
  }

  // ---------- Supabase ----------
  let client = null;
  async function getClient() {
    if (client) return client;
    if (!window.supabase || !window.supabase.createClient) {
      await loadScript(CDN);
    }
    const c = window.TRIVIA_CONFIG;
    client = window.supabase.createClient(c.supabaseUrl, c.supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 30 } }
    });
    return client;
  }

  const SupabaseNet = {
    name: 'supabase',
    // join(topic, meta, {onPresence(list), onMessage(msg), onStatus(status)}) -> Promise<handle>
    async join(topic, meta, cb) {
      const sb = await getClient();
      const ch = sb.channel('trivia:' + topic, {
        config: { broadcast: { self: false, ack: false }, presence: { key: meta.pid } }
      });
      const emitPresence = () => {
        const st = ch.presenceState();
        const list = Object.keys(st).map(k => st[k][0]).filter(Boolean);
        cb.onPresence && cb.onPresence(list);
      };
      ch.on('presence', { event: 'sync' }, emitPresence);
      ch.on('broadcast', { event: 'm' }, ({ payload }) => cb.onMessage && cb.onMessage(payload));
      let left = false;
      await new Promise((resolve, reject) => {
        let done = false;
        const t = setTimeout(() => { if (!done) { done = true; reject(new Error('timeout')); } }, 12000);
        ch.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            try { await ch.track(meta); } catch (e) {}
            if (!done) { done = true; clearTimeout(t); resolve(); }
          } else if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !done) {
            done = true; clearTimeout(t); reject(new Error(status));
          } else if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') && !left) {
            cb.onStatus && cb.onStatus(status);
          }
        });
      });
      return {
        send(msg) { ch.send({ type: 'broadcast', event: 'm', payload: msg }); },
        async update(newMeta) { try { await ch.track(newMeta); } catch (e) {} },
        leave() { left = true; try { ch.untrack(); } catch (e) {} sb.removeChannel(ch); }
      };
    },
    async submitScore(row) {
      const sb = await getClient();
      const { error } = await sb.from('trivia_scores').insert(row);
      if (error) throw error;
    },
    async topScores(mode, level) {
      const sb = await getClient();
      const { data, error } = await sb.from('trivia_scores')
        .select('player_id,name,score,correct,created_at')
        .eq('mode', mode).eq('level', level)
        .order('score', { ascending: false }).limit(150);
      if (error) throw error;
      return data;
    },

    // ---------- חברים קבועים + הזמנות למשחק ----------
    async addFriend(ownerPid, friendPid, friendName) {
      const sb = await getClient();
      const { error } = await sb.from('trivia_friends')
        .upsert({ owner_pid: ownerPid, friend_pid: friendPid, friend_name: friendName }, { onConflict: 'owner_pid,friend_pid' });
      if (error) throw error;
    },
    async listFriends(ownerPid) {
      const sb = await getClient();
      const { data, error } = await sb.from('trivia_friends')
        .select('friend_pid,friend_name,created_at')
        .eq('owner_pid', ownerPid).order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    async removeFriend(ownerPid, friendPid) {
      const sb = await getClient();
      const { error } = await sb.from('trivia_friends').delete().eq('owner_pid', ownerPid).eq('friend_pid', friendPid);
      if (error) throw error;
    },
    async sendInvite(row) {
      const sb = await getClient();
      const { error } = await sb.from('trivia_invites').insert({
        from_pid: row.from_pid, from_name: row.from_name, to_pid: row.to_pid,
        room_code: row.room_code, mode: row.mode || null, level: row.level || null
      });
      if (error) throw error;
    },
    async listPendingInvites(pid) {
      const sb = await getClient();
      const { data, error } = await sb.from('trivia_invites')
        .select('id,from_pid,from_name,room_code,mode,level,created_at')
        .eq('to_pid', pid).eq('consumed', false)
        .order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
    async consumeInvite(id) {
      const sb = await getClient();
      const { error } = await sb.from('trivia_invites').update({ consumed: true }).eq('id', id);
      if (error) throw error;
    },
    // האזנה בזמן אמת להזמנות חדשות (כל עוד האפליקציה פתוחה) - החזרה היא פונקציית ביטול
    watchInvites(pid, onInvite) {
      let ch = null;
      getClient().then(sb => {
        ch = sb.channel('invites-' + pid)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trivia_invites', filter: 'to_pid=eq.' + pid },
            payload => onInvite(payload.new))
          .subscribe();
      }).catch(() => {});
      return () => { try { if (ch) ch.unsubscribe(); } catch (e) {} };
    }
  };

  // ---------- Mock (בדיקות מקומיות) ----------
  const MockNet = {
    name: 'mock',
    async join(topic, meta, cb) {
      const bc = new BroadcastChannel('mock:' + topic);
      const peers = {}; // pid -> {meta, seen}
      peers[meta.pid] = { meta, seen: Date.now() };
      const emit = () => cb.onPresence && cb.onPresence(Object.values(peers).map(p => p.meta));
      bc.onmessage = (e) => {
        const d = e.data;
        if (d.k === 'hello' || d.k === 'here' || d.k === 'beat') {
          const isNew = !peers[d.meta.pid];
          peers[d.meta.pid] = { meta: d.meta, seen: Date.now() };
          if (d.k === 'hello') bc.postMessage({ k: 'here', meta: peers[meta.pid].meta });
          if (isNew || d.k === 'hello') emit();
        } else if (d.k === 'bye') { delete peers[d.pid]; emit(); }
        else if (d.k === 'm') { cb.onMessage && cb.onMessage(d.msg); }
      };
      const beat = setInterval(() => {
        bc.postMessage({ k: 'beat', meta: peers[meta.pid].meta });
        const now = Date.now(); let changed = false;
        for (const id in peers) if (id !== meta.pid && now - peers[id].seen > 4000) { delete peers[id]; changed = true; }
        if (changed) emit();
      }, 1000);
      await new Promise(r => setTimeout(r, 150));
      bc.postMessage({ k: 'hello', meta });
      setTimeout(emit, 50);
      return {
        send(msg) { bc.postMessage({ k: 'm', msg }); },
        async update(m) { peers[meta.pid].meta = m; bc.postMessage({ k: 'here', meta: m }); emit(); },
        leave() { clearInterval(beat); bc.postMessage({ k: 'bye', pid: meta.pid }); bc.close(); }
      };
    },
    async submitScore(row) {
      const all = JSON.parse(localStorage.getItem('mockScores') || '[]');
      all.push(Object.assign({ created_at: new Date().toISOString() }, row));
      localStorage.setItem('mockScores', JSON.stringify(all));
    },
    async topScores(mode, level) {
      const all = JSON.parse(localStorage.getItem('mockScores') || '[]');
      return all.filter(r => r.mode === mode && r.level === level).sort((a, b) => b.score - a.score).slice(0, 150);
    },

    async addFriend(ownerPid, friendPid, friendName) {
      const all = JSON.parse(localStorage.getItem('mockFriends') || '[]');
      const i = all.findIndex(f => f.owner_pid === ownerPid && f.friend_pid === friendPid);
      const row = { owner_pid: ownerPid, friend_pid: friendPid, friend_name: friendName, created_at: new Date().toISOString() };
      if (i >= 0) all[i] = row; else all.push(row);
      localStorage.setItem('mockFriends', JSON.stringify(all));
    },
    async listFriends(ownerPid) {
      const all = JSON.parse(localStorage.getItem('mockFriends') || '[]');
      return all.filter(f => f.owner_pid === ownerPid);
    },
    async removeFriend(ownerPid, friendPid) {
      const all = JSON.parse(localStorage.getItem('mockFriends') || '[]');
      localStorage.setItem('mockFriends', JSON.stringify(all.filter(f => !(f.owner_pid === ownerPid && f.friend_pid === friendPid))));
    },
    async sendInvite(row) {
      const all = JSON.parse(localStorage.getItem('mockInvites') || '[]');
      all.push(Object.assign({ id: Date.now() + Math.random(), consumed: false, created_at: new Date().toISOString() }, row));
      localStorage.setItem('mockInvites', JSON.stringify(all));
    },
    async listPendingInvites(pid) {
      const all = JSON.parse(localStorage.getItem('mockInvites') || '[]');
      return all.filter(i => i.to_pid === pid && !i.consumed);
    },
    async consumeInvite(id) {
      const all = JSON.parse(localStorage.getItem('mockInvites') || '[]');
      const row = all.find(i => i.id === id); if (row) row.consumed = true;
      localStorage.setItem('mockInvites', JSON.stringify(all));
    },
    watchInvites() { return () => {}; }
  };

  window.Net = isMock ? MockNet : SupabaseNet;
})();
