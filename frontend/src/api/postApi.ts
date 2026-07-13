import { axiosClient } from "./axiosClient";

export type Post = {
  id: number;
  title: string;
  content: string;
  image_url?: string | null;
  author: { id: number; username: string; avatar_url?: string | null };
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: number;
  content: string;
  user: { id: number; username: string; avatar_url?: string | null };
  created_at: string;
};

export const postApi = {
  list: (page = 1, pageSize = 10) =>
    axiosClient.get<{ items: Post[]; total: number; page: number; page_size: number }>(
      "/posts/",
      { params: { page, page_size: pageSize } }
    ),
  get: (id: number) => axiosClient.get<Post>(`/posts/${id}`),
  create: (data: { title: string; content: string; image?: File | null }) => {
    const form = new FormData();
    form.append("title", data.title);
    form.append("content", data.content);
    if (data.image) form.append("image", data.image);
    return axiosClient.post<Post>("/posts/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id: number, data: { title?: string; content?: string }) =>
    axiosClient.put<Post>(`/posts/${id}`, data),
  remove: (id: number) => axiosClient.delete(`/posts/${id}`),
  like: (id: number) => axiosClient.post(`/posts/${id}/like`),
  unlike: (id: number) => axiosClient.delete(`/posts/${id}/like`),
  comments: (id: number) => axiosClient.get<Comment[]>(`/posts/${id}/comments`),
  addComment: (id: number, content: string) =>
    axiosClient.post<Comment>(`/posts/${id}/comments`, { content }),
};
