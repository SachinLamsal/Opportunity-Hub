import type { ACTIVITY_CATEGORIES, EDUCATION_LEVELS } from "./constants";

export type EducationLevel = (typeof EDUCATION_LEVELS)[number];
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export interface Profile {
  id: string;
  email: string;
  education_level: EducationLevel | null;
  dream_universities: string | null;
  subjects: string | null;
  interests: string | null;
  career_interests: string | null;
  awards: string | null;
  volunteer_work: string | null;
  leadership_roles: string | null;
  projects: string | null;
  created_at: string;
}

export interface Opportunity {
  id: string;
  title: string;
  type: string;
  description: string;
  organizer: string | null;
  registration_link: string | null;
  deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  is_online: boolean | null;
  subject_area: string | null;
  grade_requirements: string | null;
  cost: string | null;
  time_commitment: string | null;
  skills_gained: string | null;
  difficulty_level: string | null;
  tags: string[] | null;
  prep_resources: string | null;
  application_steps: string | null;
  eligibility_details: string | null;
  contact_info: string | null;
  ai_summary: string | null;
  portfolio_tips: string | null;
  ai_enriched_at: string | null;
  source_url: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  title: string;
  category: ActivityCategory;
  description: string;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface SavedOpportunity {
  id: string;
  user_id: string;
  opportunity_id: string;
  created_at: string;
}
