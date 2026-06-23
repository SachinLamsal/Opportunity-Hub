export const APP_NAME = "OpportunityHub";

export const APP_TAGLINE =
  "Discover opportunities, track activities, and build your university portfolio.";

export const EDUCATION_LEVELS = [
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "IGCSE",
  "AS Level",
  "A Level",
] as const;

export const ACTIVITY_CATEGORIES = [
  "Academic",
  "Leadership",
  "Service",
  "Projects",
  "Work Experience",
  "Creative",
] as const;

export const MAIN_NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/cv-builder", label: "CV Builder" },
  { href: "/profile", label: "Profile" },
] as const;

export const OPPORTUNITY_TYPES = [
  "Competition",
  "Workshop",
  "Internship",
  "Volunteering",
  "Summer Program",
  "Scholarship",
  "Club",
  "Other",
] as const;

export const SUBJECT_AREAS = [
  "Science",
  "Mathematics",
  "Technology",
  "English",
  "Social Studies",
  "Business",
  "Medicine",
  "Environment",
  "Arts",
] as const;

export const DEADLINE_FILTERS = [
  { value: "", label: "Any deadline" },
  { value: "week", label: "Due this week" },
  { value: "month", label: "Due this month" },
  { value: "later", label: "Due later" },
] as const;

export const FORMAT_FILTERS = [
  { value: "", label: "Any format" },
  { value: "online", label: "Online" },
  { value: "in_person", label: "In person" },
] as const;
