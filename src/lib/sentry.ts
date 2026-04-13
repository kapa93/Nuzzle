import * as Sentry from '@sentry/react-native';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

let hasInitializedSentry = false;

export function initializeSentry(): void {
  if (hasInitializedSentry) return;

  Sentry.init({
    dsn: sentryDsn,
    enabled: Boolean(sentryDsn),
    debug: false,
    integrations: [navigationIntegration],
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
  });

  hasInitializedSentry = true;
}

export function registerSentryNavigationContainer(navigationContainerRef: unknown): void {
  navigationIntegration.registerNavigationContainer(navigationContainerRef);
}

type CaptureContext = {
  area: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  return new Error('Non-Error exception captured');
}

export function captureHandledError(error: unknown, context: CaptureContext): void {
  const normalized = normalizeError(error);
  Sentry.withScope((scope) => {
    scope.setTag('handled', 'true');
    scope.setTag('area', context.area);
    if (context.tags) scope.setTags(context.tags);
    if (context.extra) scope.setExtras(context.extra);
    Sentry.captureException(normalized);
  });
}
