import { CareerProfile } from '../models/user.model';

export type CompletenessField = keyof CareerProfile | 'firstName' | 'lastName' | 'email' | 'phone' | 'position';

export type CompletenessValues = Partial<Record<CompletenessField, string | number | null | undefined>>;

export interface MissingField {
  field: CompletenessField;
  labelKey: string;
}

export interface ProfileCompleteness {
  percent: number;
  filled: number;
  total: number;
  missing: MissingField[];
}

const TRACKED: readonly MissingField[] = [
  { field: 'firstName',          labelKey: 'profile.personalInformation.firstNameLabel' },
  { field: 'lastName',           labelKey: 'profile.personalInformation.lastNameLabel' },
  { field: 'email',              labelKey: 'profile.personalInformation.emailLabel' },
  { field: 'phone',              labelKey: 'profile.personalInformation.phoneLabel' },
  { field: 'location',           labelKey: 'profile.personalInformation.locationLabel' },
  { field: 'position',           labelKey: 'profile.careerPreferences.currentTitleLabel' },
  { field: 'targetPosition',     labelKey: 'profile.careerPreferences.targetPositionLabel' },
  { field: 'yearsOfExperience',  labelKey: 'profile.careerPreferences.yearsOfExperienceLabel' },
  { field: 'preferredWorkMode',  labelKey: 'profile.careerPreferences.workModeLabel' },
  { field: 'preferredLocations', labelKey: 'profile.careerPreferences.preferredLocationsLabel' },
  { field: 'salaryExpectation',  labelKey: 'profile.careerPreferences.salaryExpectationLabel' },
  { field: 'noticePeriodDays',   labelKey: 'profile.careerPreferences.noticePeriodLabel' },
  { field: 'mainSkills',         labelKey: 'profile.careerPreferences.mainSkillsLabel' },
  { field: 'linkedInUrl',        labelKey: 'profile.professionalLinks.linkedInLabel' },
  { field: 'gitHubUrl',          labelKey: 'profile.professionalLinks.gitHubLabel' },
  { field: 'portfolioUrl',       labelKey: 'profile.professionalLinks.portfolioLabel' }
];

function isFilled(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  return typeof value === 'number' ? Number.isFinite(value) : value.trim().length > 0;
}

export function calculateProfileCompleteness(values: CompletenessValues | null): ProfileCompleteness {
  const missing = values
    ? TRACKED.filter(t => !isFilled(values[t.field]))
    : [...TRACKED];
  const filled = TRACKED.length - missing.length;

  return {
    percent: Math.round((filled / TRACKED.length) * 100),
    filled,
    total: TRACKED.length,
    missing
  };
}
