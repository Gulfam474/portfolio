import { axiosClient } from "./axiosClient";

export type PersonalInfo = {
  id?: number;
  user_id?: number;
  full_name: string;
  title: string;
  tagline: string;
  bio: string;
  location: string;
  email_public: string;
  phone: string;
  website: string;
  github: string;
  linkedin: string;
  twitter: string;
  avatar_url?: string | null;
  public_fields?: string;
};

export type Education = {
  id: number;
  institution: string;
  degree: string;
  field_of_study: string;
  start_year?: number | null;
  end_year?: number | null;
  grade: string;
  description: string;
  sort_order: number;
  public_visible: boolean;
};

export type Experience = {
  id: number;
  company: string;
  role: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  sort_order: number;
  public_visible: boolean;
};

export type Skill = {
  id: number;
  name: string;
  group: string;
  proficiency: number;
  sort_order: number;
  public_visible: boolean;
};

export type Project = {
  id: number;
  title: string;
  description: string;
  tech_stack: string;
  project_url: string;
  repo_url: string;
  thumbnail_url?: string | null;
  sort_order: number;
  public_visible: boolean;
};

export type Certificate = {
  id: number;
  name: string;
  issuer: string;
  year?: number | null;
  credential_url: string;
  description: string;
  sort_order: number;
  public_visible: boolean;
};

export type ProfileOverview = {
  personal_info: PersonalInfo | null;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  projects: Project[];
  certificates: Certificate[];
  cv_url?: string | null;
};

export const profileApi = {
  overview: () => axiosClient.get<ProfileOverview>("/profile/overview"),
  overviewFull: () => axiosClient.get<ProfileOverview>("/profile/overview/full"),
  updatePersonal: (data: Partial<PersonalInfo>) =>
    axiosClient.put("/profile/personal-info", data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return axiosClient.post<PersonalInfo>("/profile/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  createEducation: (data: Omit<Education, "id">) =>
    axiosClient.post("/profile/education", data),
  updateEducation: (id: number, data: Omit<Education, "id">) =>
    axiosClient.put(`/profile/education/${id}`, data),
  deleteEducation: (id: number) => axiosClient.delete(`/profile/education/${id}`),
  createExperience: (data: Omit<Experience, "id">) =>
    axiosClient.post("/profile/experience", data),
  updateExperience: (id: number, data: Omit<Experience, "id">) =>
    axiosClient.put(`/profile/experience/${id}`, data),
  deleteExperience: (id: number) => axiosClient.delete(`/profile/experience/${id}`),
  createSkill: (data: Omit<Skill, "id">) => axiosClient.post("/profile/skills", data),
  updateSkill: (id: number, data: Omit<Skill, "id">) =>
    axiosClient.put(`/profile/skills/${id}`, data),
  deleteSkill: (id: number) => axiosClient.delete(`/profile/skills/${id}`),
  createProject: (data: Omit<Project, "id">) =>
    axiosClient.post("/profile/projects", data),
  updateProject: (id: number, data: Omit<Project, "id">) =>
    axiosClient.put(`/profile/projects/${id}`, data),
  deleteProject: (id: number) => axiosClient.delete(`/profile/projects/${id}`),
  createCertificate: (data: Omit<Certificate, "id">) =>
    axiosClient.post("/profile/certificates", data),
  updateCertificate: (id: number, data: Omit<Certificate, "id">) =>
    axiosClient.put(`/profile/certificates/${id}`, data),
  deleteCertificate: (id: number) => axiosClient.delete(`/profile/certificates/${id}`),
};
