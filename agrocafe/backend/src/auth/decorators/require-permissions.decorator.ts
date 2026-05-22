import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSIONS_KEY = 'requirePermissions';
export const RequirePermissions = (module: string, action: string) => SetMetadata(REQUIRE_PERMISSIONS_KEY, { module, action });
