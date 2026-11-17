import { storagePrefix } from '../core/hosting';

/** Prefix of every name the app stores in the browser; pull request previews get their own. */
export const STORAGE_PREFIX = storagePrefix(__PREVIEW__);
