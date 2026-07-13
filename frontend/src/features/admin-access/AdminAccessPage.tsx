import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Permission, type Role } from "@/api/adminApi";
import { Switch } from "@/components/ui/Switch";
import { Skeleton } from "@/components/ui/Skeleton";
import { MODULES } from "@/lib/constants";

export function AdminAccessPage() {
  const qc = useQueryClient();
  const { data: roles, isLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => (await adminApi.roles()).data,
  });
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await adminApi.users()).data,
  });

  const savePerms = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: number; permissions: Permission[] }) =>
      adminApi.updatePermissions(roleId, permissions),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-roles"] }),
  });

  const assign = useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      adminApi.assignRole(userId, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const toggle = (
    role: Role,
    module: string,
    key: "can_view" | "can_edit" | "can_delete",
    value: boolean
  ) => {
    if (role.name === "owner") return;
    const map = new Map(role.permissions.map((p) => [p.module, { ...p }]));
    for (const m of MODULES) {
      if (!map.has(m)) {
        map.set(m, { module: m, can_view: false, can_edit: false, can_delete: false });
      }
    }
    const perm = map.get(module)!;
    perm[key] = value;
    savePerms.mutate({ roleId: role.id, permissions: Array.from(map.values()) });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div>
        <p className="label-mono">admin</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">Access control</h1>
        <p className="mt-2 text-sm text-muted">
          Manage role permissions and assign roles to users.
        </p>
      </div>

      <section className="glass-card overflow-x-auto p-4">
        <h2 className="mb-4 text-lg font-medium text-white">Role permissions</h2>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle font-mono text-xs uppercase tracking-wider text-muted">
              <th className="px-2 py-2">Role</th>
              {MODULES.map((m) => (
                <th key={m} className="px-2 py-2" colSpan={3}>
                  {m}
                </th>
              ))}
            </tr>
            <tr className="border-b border-border-subtle text-[10px] uppercase text-muted/70">
              <th />
              {MODULES.map((m) => (
                <th key={m} colSpan={3} className="px-2 py-1">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <span>view</span>
                    <span>edit</span>
                    <span>del</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles?.map((role) => (
              <tr key={role.id} className="border-b border-border-subtle/60">
                <td className="px-2 py-3 font-medium text-white">{role.name}</td>
                {MODULES.map((module) => {
                  const perm = role.permissions.find((p) => p.module === module) || {
                    module,
                    can_view: false,
                    can_edit: false,
                    can_delete: false,
                  };
                  const locked = role.name === "owner";
                  return (
                    <td key={module} className="px-2 py-3" colSpan={3}>
                      <div className="grid grid-cols-3 place-items-center gap-2">
                        <Switch
                          checked={perm.can_view}
                          disabled={locked}
                          onCheckedChange={(v) => toggle(role, module, "can_view", v)}
                        />
                        <Switch
                          checked={perm.can_edit}
                          disabled={locked}
                          onCheckedChange={(v) => toggle(role, module, "can_edit", v)}
                        />
                        <Switch
                          checked={perm.can_delete}
                          disabled={locked}
                          onCheckedChange={(v) => toggle(role, module, "can_delete", v)}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="glass-card p-4">
        <h2 className="mb-4 text-lg font-medium text-white">Users</h2>
        <ul className="divide-y divide-border-subtle">
          {users?.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium text-white">@{u.username}</p>
                <p className="font-mono text-xs text-muted">{u.email}</p>
              </div>
              <select
                className="h-9 rounded-lg border border-border-subtle bg-background px-3 text-sm text-white"
                value={u.role?.id || ""}
                onChange={(e) =>
                  assign.mutate({ userId: u.id, roleId: Number(e.target.value) })
                }
              >
                <option value="" disabled>
                  Assign role
                </option>
                {roles?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
