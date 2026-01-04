export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  is_admin: boolean;
}

export interface Comment {
  id: string;
  profile_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  age?: number;
  education?: string;
  expertise?: string;
  resume_link?: string;
  interviewer_opinion?: string;
  skills: string[];
  bio?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type ViewState = 'LOGIN' | 'LIST' | 'PROFILE_DETAIL';
