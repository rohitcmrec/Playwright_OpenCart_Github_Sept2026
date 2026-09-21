import { FullConfig } from '@playwright/test';
import globalSetup from './globalSetup';
import roleSetup from './roleSetup';

async function combinedSetup(config: FullConfig) {
    await globalSetup(config);
    await roleSetup(config);
}

export default combinedSetup;
