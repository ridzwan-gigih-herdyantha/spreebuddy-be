import { fileService } from '../../common/services/file.service.js';

// Optional avatar image, max 2MB. Shared by register and update.
export const uploadAvatar = fileService.single({
  category: 'avatars',
  field: 'avatar',
  allowedMime: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxSizeMB: 2,
});
