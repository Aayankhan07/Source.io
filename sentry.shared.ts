// Options shared by the browser, Node.js and Edge Sentry inits.
//
// Sentry SDK v11 replaced `sendDefaultPii` with the granular `dataCollection`
// option, whose defaults collect user info, cookies, headers, bodies, query
// params and AI inputs/outputs. The values below restore the old
// `sendDefaultPii: false` posture (and then some): no user identity, no request
// payloads, no study content.
export const sentryDataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  genAI: { inputs: false, outputs: false },
  mcp: { inputs: false, outputs: false },
  databaseQueryData: false,
  stackFrameVariables: false,
};

export const SENTRY_TRACES_SAMPLE_RATE = 0.1;
