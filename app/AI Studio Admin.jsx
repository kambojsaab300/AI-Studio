// ============================================================
// AI Studio: Modular React Admin Application Entrypoint
// Clean architecture refactored into modular components under /src
// ============================================================

export { AdminApp, default } from '../src/AdminApp';
export { createClient, ApiQueryBuilder } from '../src/api/client';
export { API_URL, API_KEY, API, TABLES } from '../src/api/config';
export { uploadFile, compressFile } from '../src/api/uploadService';
export { TASK_TYPES, typeOf, EMPTY_FORM, toTaskType } from '../src/constants/formDefaults';
export { MODEL_CAPS, capsOf } from '../src/constants/models';
