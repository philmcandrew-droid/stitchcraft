/** Load `.env` before Expo evaluates config / Metro bundles (needed for EXPO_PUBLIC_* in APK). */
require('dotenv').config();

const appJson = require('./app.json');

/** Runtime fallback: some Metro builds omit `process.env` in app JS; `extra` is still embedded from this file. */
const openRouterApiKey = (process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? '').trim();
const openRouterImageModel = (process.env.EXPO_PUBLIC_OPENROUTER_IMAGE_MODEL ?? '').trim();

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra ?? {}),
      openRouterApiKey,
      openRouterImageModel,
    },
  },
};
