'use client';

import { useEffect, useState } from 'react';
import { roles as rolesApi, admin } from '@/lib/api';
import type { Role, PermissionCatalogEntry, RoleAssignment, Group } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import {
  KeyRound, Plus, Trash2, Save, UserPlus, X, ShieldCheck, Lock
} from 'lucide-react';

export default function RolesPage() {
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [catalog, setCatalog]     = useState<PermissionCatalogEntry[]>([]);
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [groupsList, setGroupsList]   = useState<Group[]>([]);
  const [loading, setLoading]     = useState(true);
  const [message, setMessage]     = useState<{ ok: boolean; text: string } | null>(null);

  // Role editing
  const [selected, setSelected]   = useState<Role | null>(null);
  const [draftPerms, setDraftPerms] = useState<string[]>([]);
  const [saving, setSaving]       = useState(false);

  // Create role
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', scope: 'group' as 'platform' | 'group', description: '' });
  const [creating, setCreating] = useState(false);

  // Assign role
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ roleId: '', email: '', groupId: '' });
  const [assigning, setAssigning]   = useState(false);

  const load = () =>
    Promise.allSettled([
      rolesApi.list().then(r => { setRolesList(r.data.roles); setCatalog(r.data.catalog); }),
      rolesApi.assignments().then(r => setAssignments(r.data)),
      admin.groups.list({ limit: '100' }).then(r => setGroupsList(r.data)),
    ]).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  if (loading) return <PageSpinner />;

  const selectRole = (r: Role) => {
    setSelected(r);
    setDraftPerms([...r.permissions]);
    setMessage(null);
  };

  const togglePerm = (key: string) => {
    setDraftPerms(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key]);
  };

  const saveRole = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await rolesApi.update(selected.id, { permissions: draftPerms });
      setMessage({ ok: true, text: `Permissions for "${selected.name}" saved.` });
      setSelected(null);
      load();
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await rolesApi.create({ ...newRole, permissions: [] });
      setCreateOpen(false);
      setNewRole({ name: '', scope: 'group', description: '' });
      setMessage({ ok: true, text: 'Role created. Select it to configure permissions.' });
      load();
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Create failed' });
    } finally {
      setCreating(false);
    }
  };

  const deleteRole = async (r: Role) => {
    try {
      await rolesApi.remove(r.id);
      setMessage({ ok: true, text: `Role "${r.name}" deleted.` });
      if (selected?.id === r.id) setSelected(null);
      load();
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Delete failed' });
    }
  };

  const assignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssigning(true);
    try {
      const res = await rolesApi.assign(assignForm.roleId, assignForm.email, assignForm.groupId || undefined);
      setMessage({ ok: true, text: res.message });
      setAssignOpen(false);
      setAssignForm({ roleId: '', email: '', groupId: '' });
      load();
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Assignment failed' });
    } finally {
      setAssigning(false);
    }
  };

  const revoke = async (id: string) => {
    await rolesApi.revoke(id);
    load();
  };

  const assignScopeRole = rolesList.find(r => r.id === assignForm.roleId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Roles &amp; Permissions</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Configure what each role can do, create custom roles, and assign them to users
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setAssignOpen(true); setMessage(null); }}>
            <UserPlus size={14} /> Assign Role
          </Button>
          <Button size="sm" onClick={() => { setCreateOpen(true); setMessage(null); }}>
            <Plus size={14} /> New Role
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm border ${message.ok
          ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role list */}
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-4">
            <KeyRound size={18} /> Roles
          </h2>
          <div className="space-y-2">
            {(['platform', 'group'] as const).map(scope => (
              <div key={scope}>
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mt-3 mb-2">{scope} roles</p>
                {rolesList.filter(r => r.scope === scope).map(r => (
                  <div
                    key={r.id}
                    onClick={() => selectRole(r)}
                    className={`flex items-center justify-between p-3 rounded-lg mb-1.5 cursor-pointer border transition-colors ${
                      selected?.id === r.id
                        ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20'
                        : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 hover:border-teal-200'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100 flex items-center gap-2">
                        {r.name}
                        {r.isSystem && <Lock size={11} className="text-gray-400" />}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {r.description || 'No description'} · {r.permissions.includes('*') ? 'all permissions' : `${r.permissions.length} permission${r.permissions.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    {!r.isSystem && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteRole(r); }}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>

        {/* Permission editor */}
        <Card>
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck size={18} /> {selected.name} <Badge label={selected.scope} variant="info" />
                </h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setSelected(null)}><X size={14} /></Button>
                  <Button size="sm" onClick={saveRole} loading={saving}
                    disabled={selected.name === 'super_admin' && selected.scope === 'platform'}>
                    <Save size={14} /> Save
                  </Button>
                </div>
              </div>
              {selected.name === 'super_admin' && selected.scope === 'platform' ? (
                <p className="text-sm text-gray-500 dark:text-slate-400 py-8 text-center">
                  The super_admin role always has every permission and cannot be modified.
                </p>
              ) : (
                <div className="space-y-2">
                  {catalog.map(p => (
                    <label key={p.key} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftPerms.includes(p.key)}
                        onChange={() => togglePerm(p.key)}
                        className="w-4 h-4 accent-teal-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{p.label}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">{p.key}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <KeyRound size={40} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-slate-400 text-sm">Select a role to configure its permissions</p>
            </div>
          )}
        </Card>
      </div>

      {/* Assignments */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-4">
          <UserPlus size={18} /> Role Assignments
        </h2>
        {assignments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-6">
            No custom role assignments yet. Built-in roles (member, admin, owner) are applied automatically.
          </p>
        ) : (
          <div className="space-y-2">
            {assignments.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">{a.userName}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {a.userEmail} · <span className="font-medium text-teal-600 dark:text-teal-400">{a.roleName}</span>
                    {a.groupName ? ` in ${a.groupName}` : ' (platform-wide)'}
                  </p>
                </div>
                <button
                  onClick={() => revoke(a.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer"
                  title="Revoke"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create role modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Custom Role" size="sm">
        <form onSubmit={createRole} className="space-y-4">
          <Input label="Role name" value={newRole.name}
            onChange={e => setNewRole(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. treasurer" required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Scope</label>
            <select
              value={newRole.scope}
              onChange={e => setNewRole(f => ({ ...f, scope: e.target.value as 'platform' | 'group' }))}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="group">Group — applies within one group</option>
              <option value="platform">Platform — applies everywhere</option>
            </select>
          </div>
          <Input label="Description (optional)" value={newRole.description}
            onChange={e => setNewRole(f => ({ ...f, description: e.target.value }))}
            placeholder="What is this role for?" />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={creating}><Plus size={14} /> Create</Button>
          </div>
        </form>
      </Modal>

      {/* Assign role modal */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Role to User" size="sm">
        <form onSubmit={assignRole} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Role</label>
            <select
              value={assignForm.roleId}
              onChange={e => setAssignForm(f => ({ ...f, roleId: e.target.value, groupId: '' }))}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100"
              required
            >
              <option value="">Select a role…</option>
              {rolesList.filter(r => !(r.name === 'super_admin' && r.scope === 'platform')).map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.scope})</option>
              ))}
            </select>
          </div>
          <Input label="User email" type="email" value={assignForm.email}
            onChange={e => setAssignForm(f => ({ ...f, email: e.target.value }))}
            placeholder="member@example.com" required />
          {assignScopeRole?.scope === 'group' && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Group</label>
              <select
                value={assignForm.groupId}
                onChange={e => setAssignForm(f => ({ ...f, groupId: e.target.value }))}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 dark:text-slate-100"
                required
              >
                <option value="">Select a group…</option>
                {groupsList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button type="submit" loading={assigning}><UserPlus size={14} /> Assign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
