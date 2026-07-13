import { axiosClient } from "./axiosClient";
import { API_BASE_URL } from "@/lib/constants";

export const cvApi = {
  preview: () => axiosClient.get("/cv/preview"),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return axiosClient.post("/cv/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  downloadUrl: () => `${API_BASE_URL}/cv/download`,
  latexUrl: () => `${API_BASE_URL}/cv/generate-latex`,
};
