export const MAX_PROFILE_IMAGE_SIZE = 10 * 1024 * 1024;
export const PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const validateProfileImage = (file: File) => {
  if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
    return "Choose a JPG, PNG, or WebP image.";
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    return "Choose an image smaller than 10 MB.";
  }

  return "";
};
