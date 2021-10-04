install:
	yarn
	make -C libs/analytics.js-core install
	make -C libs/analytics.js-integration-segmentio install

dist/aicactus-sdk.staging.min.js: install
	yarn build:staging

dist/aicactus-sdk.min.js: install
	yarn build

gcs-cp-analytics: CACHE_MAX_AGE ?= 2592000
gcs-cp-analytics: CDN_URL_MAP ?= cdn-url-map
gcs-cp-analytics: GCP_PROJECT_ID ?= aicactus-prod
gcs-cp-analytics: dist/aicactus-sdk.min.js
	gsutil cp -Z $< gs://aicactus-cdn/aicactus-sdk.min.js
	gsutil setmeta -h "Cache-Control: public, max-age=$(CACHE_MAX_AGE)" gs://aicactus-cdn/aicactus-sdk.min.js
	gcloud compute url-maps invalidate-cdn-cache $(CDN_URL_MAP) --path '/aicactus-sdk.min.js' --project $(GCP_PROJECT_ID)

gcs-cp-analytics-staging: CACHE_MAX_AGE ?= 2592000
gcs-cp-analytics-staging: CDN_URL_MAP ?= cdn-url-map
gcs-cp-analytics-staging: GCP_PROJECT_ID ?= aicactus-prod
gcs-cp-analytics-staging: dist/aicactus-sdk.staging.min.js
	gsutil cp -Z $< gs://aicactus-cdn/aicactus-sdk.staging.min.js
	gsutil setmeta -h "Cache-Control: public, max-age=$(CACHE_MAX_AGE)" gs://aicactus-cdn/aicactus-sdk.staging.min.js
	gcloud compute url-maps invalidate-cdn-cache $(CDN_URL_MAP) --path '/aicactus-sdk.staging.min.js' --project $(GCP_PROJECT_ID)
