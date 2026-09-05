export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite';

export const WORK_MODES: readonly WorkMode[] = ['Remote', 'Hybrid', 'Onsite'];

export interface CareerProfile {
  location:           string | null;
  targetPosition:     string | null;
  yearsOfExperience:  number | null;
  preferredWorkMode:  WorkMode | null;
  preferredLocations: string | null;
  salaryExpectation:  string | null;
  noticePeriodDays:   number | null;
  linkedInUrl:        string | null;
  gitHubUrl:          string | null;
  portfolioUrl:       string | null;
  mainSkills:         string | null;
}

export interface UserProfile extends CareerProfile {
  id:               number;
  firstName:        string;
  lastName:         string;
  name:             string;
  position:         string;
  email:            string;
  phone:            string;
  goal:             number;
  joinDate:         string;
  hasAvatar:        boolean;
  useAiEvaluation:  boolean;
  preferredLanguage: string;
}
