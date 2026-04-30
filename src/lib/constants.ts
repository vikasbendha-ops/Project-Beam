export const APP_NAME = "Beam";
export const APP_TAGLINE = "Faster feedback on websites, images, and PDFs.";
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_FOLDER_DEPTH = 5;

export const STATUS_LABEL = {
  draft: "Draft",
  ready_for_review: "Ready for review",
  changes_requested: "Changes requested",
  approved: "Approved",
} as const;

export const ROLE_LABEL = {
  owner: "Owner",
  member: "Member",
  guest: "Guest",
} as const;
