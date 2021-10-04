import { v4 as uuidV4 } from 'uuid';

import { getDeviceObj } from './device';
import { getSiteDefinedObj } from './site';
import { getUserDefinedObj } from './user';

/**
 * This define refer from OpenRTB document
 */
const REQUEST_DEFINED = {
  /**
   * type: string (required)
   * Unique ID of the bid request, provided by the exchange.
   */
  id: uuidV4(),
  /**
   * type: array of object (required)
   * Array of Imp objects (Section 3.2.4) representing the
   * impressions offered. At least 1 Imp object is required
   */
  imp: [],
  /**
   * type: object (required)
   * Details via a Site object (Section 3.2.13) about the publisher’s
   * website. Only applicable and recommended for websites.
   */
  site: getSiteDefinedObj(),
  /**
   * type: object (required)
   * Details via an App object (Section 3.2.14) about the publisher’s
   * app (i.e., non-browser applications). Only applicable and
   * recommended for apps
   */
  // app: {},
  /**
   * type: object
   * Details via a Device object (Section 3.2.18) about the user’s
   * device to which the impression will be delivered
   */
  device: getDeviceObj(),
  /**
   * type: object
   * Details via a User object (Section 3.2.20) about the human
   * user of the device; the advertising audience.
   */
  user: getUserDefinedObj(),
  /**
   * type: integer - default 0
   * Indicator of test mode in which auctions are not billable,
   * where 0 = live mode, 1 = test mode
   */
  test: 0,
  /**
   * type: integer - default 2
   * Auction type, where 1 = First Price, 2 = Second Price Plus.
   * Exchange-specific auction types can be defined using values
   * greater than 500
   */
  at: 2,
  /**
   * type: integer
   * Maximum time in milliseconds the exchange allows for bids to
   * be received including Internet latency to avoid timeout. This
   * value supersedes any a priori guidance from the exchange
   */
  tmax: 3000,
  /**
   * type: array of string
   * White list of buyer seats (e.g., advertisers, agencies) allowed
   * to bid on this impression. IDs of seats and knowledge of the
   * buyer’s customers to which they refer must be coordinated
   * between bidders and the exchange a priori. At most, only one
   * of wseat and bseat should be used in the same request.
   * Omission of both implies no seat restrictions.
   */
  wseat: [],
  /**
   * type: array of string
   * Block list of buyer seats (e.g., advertisers, agencies) restricted
   * from bidding on this impression. IDs of seats and knowledge
   * of the buyer’s customers to which they refer must be
   * coordinated between bidders and the exchange a priori. At
   * most, only one of wseat and bseat should be used in the
   * same request. Omission of both implies no seat restrictions
   */
  bseat: [],
  /**
   * type: integer - default 0
   * Flag to indicate if Exchange can verify that the impressions
   * offered represent all of the impressions available in context
   * (e.g., all on the web page, all video spots such as pre/mid/post
   * roll) to support road-blocking. 0 = no or unknown, 1 = yes, the
   * impressions offered represent all that are available.
   */
  allimps: 0,
  /**
   * type: array of string,
   * Array of allowed currencies for bids on this bid request using
   * ISO-4217 alpha codes. Recommended only if the exchange
   * accepts multiple currencies
   */
  cur: [],
  /**
   * type: array of string,
   * White list of languages for creatives using ISO-639-1-alpha-2.
   * Omission implies no specific restrictions, but buyers would be
   * advised to consider language attribute in the Device and/or
   * Content objects if available
   */
  wlang: [],
  /**
   * type: array of string,
   * Blocked advertiser categories using the IAB content
   * categories. Refer to List 5.1
   */
  bcat: [],
  /**
   * type: array of string,
   * Block list of advertisers by their domains (e.g., “ford.com”).
   */
  badv: [],
  /**
   * type: array of string,
   * Block list of applications by their platform-specific exchange-independent
   * application identifiers. On Android these should
   * be bundle or package names (e.g., com.foo.mygame). On iOS,
   * these are numeric IDs
   */
  bapp: [],
  /**
   * type: object,
   * A Sorce object (Section 3.2.2) that provides data about the
   * inventory source and which entity makes the final decision.
   */
  source: {},
  /**
   * type: object,
   * A Regs object (Section 3.2.3) that specifies any industry, legal,
   * or governmental regulations in force for this request.
   */
  regs: {},
  /**
   * type: object,
   * Placeholder for exchange-specific extensions to OpenRTB.
   */
  ext: {},
};

export const getBidRequestObj = () => {
  const { id, user, source, device, ext, site } = REQUEST_DEFINED;

  return {
    id,
    user,
    source,
    device,
    ext,
    site,
  };
};
