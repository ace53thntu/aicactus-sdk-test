![Logo of the project](./images/logo.png)

# aicactus-sdk-js &middot; [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/aicactus/aicactus-sdk-js/blob/master/LICENSE)

> Javascript SDK inspired by Segment analytics js core

## Installing / Getting started

1. Install **Nodejs** and **Yarn**
2. Clone this repo: `git clone https://github.com/aicactus/aicactus-sdk-js.git`
3. `cd aicactus-sdk-js && yarn`
4. `cd libs/analytics.js-core && yarn`
5. `cd libs/analytics.js-integration-segmentio && yarn`
6. Install static server for serve static file: https://github.com/nbluis/static-server
7. Install json server for mock APIs: https://github.com/typicode/json-server

## Developing

1. Open a terminal tab then run `yarn dev:core` for watch change in core
2. And on other tab for run `yarn dev` for watch webpack
3. Run `yarn static:js` for serve bundle js files in `dist` folder, port `9081`
4. Run `yarn static:html` for serve `html` files in `example` folder, port `9080`
5. Run `yarn mock:api` for mock APIs in port `3004`

## Staging

1. Follow steps 3,4,5 in **How to get started**
1. Run `yarn build:staging`
1. JS file `aicactus-sdk.staging.min.js` will in `dist` folder
1. Please deploy that file to CDN.

## Production

1. Follow steps 3,4,5 in **How to get started**
1. Run `yarn build`
1. JS file `aicactus-sdk.min.js` will in `dist` folder
1. Please deploy that file to CDN.
