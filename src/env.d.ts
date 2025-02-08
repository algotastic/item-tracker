/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_AWS_REGION: string;
  readonly PUBLIC_APPSYNC_URL: string;
  readonly PUBLIC_S3_BUCKET: string;
  readonly PUBLIC_APPSYNC_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
