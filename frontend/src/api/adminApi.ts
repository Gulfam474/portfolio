import { axiosClient } from "./axiosClient";

export type Permission = {
  id?: number;
  module: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

export type Role = {
  id: number;
  name: string;
  description?: string | null;
  permissions: Permission[];
};

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
  is_active: boolean;
  role?: Role | null;
};

export const adminApi = {
  roles: () => axiosClient.get<Role[]>("/admin/roles"),
  updatePermissions: (roleId: number, permissions: Permission[]) =>
    axiosClient.put(`/admin/roles/${roleId}/permissions`, permissions),
  users: () => axiosClient.get<AdminUser[]>("/admin/users"),
  assignRole: (userId: number, roleId: number) =>
    axiosClient.put(`/admin/users/${userId}/role`, { role_id: roleId }),
};
