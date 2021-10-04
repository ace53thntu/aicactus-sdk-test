const USER_DEFINED = {
  /**
   * type: string,
   * Exchange-specific ID for the user. At least one of id or
   * buyeruid is recommended
   */
  id: '',
  /**
   * type: string,
   * Buyer-specific ID for the user as mapped by the exchange for
   * the buyer. At least one of buyeruid or id is recommended
   */
  buyeruid: '',
  /**
   * type: integer,
   * Year of birth as a 4-digit integer.
   */
  yob: 1900,
  /**
   * type: string,
   * Gender, where “M” = male, “F” = female, “O” = known to be
   * other (i.e., omitted is unknown)
   */
  gender: 'O',
  /**
   * type: string,
   * Comma separated list of keywords, interests, or intent.
   */
  keywords: '',
  /**
   * type: string,
   * Optional feature to pass bidder data that was set in the
   * exchange’s cookie. The string must be in base85 cookie safe
   * characters and be in any format. Proper JSON encoding must
   * be used to include “escaped” quotation marks.
   */
  customdata: '',
  /**
   * type: object,
   * Location of the user’s home base defined by a Geo object
   * (Section 3.2.19). This is not necessarily their current location
   */
  geo: {},
  /**
   * type: array of object,
   * Additional user data. Each Data object (Section 3.2.21)
   * represents a different data source.
   */
  data: [],
  /**
   * type: object,
   * Placeholder for exchange-specific extensions to OpenRTB.
   */
  ext: {},
};

export const getUserDefinedObj = () => {
  const { gender } = USER_DEFINED;

  return {
    gender,
  };
};
