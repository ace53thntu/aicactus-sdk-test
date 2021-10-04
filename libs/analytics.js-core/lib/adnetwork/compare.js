/**
 * thứ tự ưu tiên:  direct deal —> price cao nhất —> bid default —> ad default
 * nếu inventory có type: direct và dsps của inventory đó
 * có direct_deal: 1 (tất nhiên header_bidding: 1 thì mới bid tới dsp)
 * thì response của dsp này là win.
 *
 * nếu không tìm ra price cao nhất thì lấy bid default
 * không có bid default lấy ad default
 */
export function compareToFindWinner({ seatBid = [] }) {
  // filter bid không phải là bid default
  const bidsIsNotDefault = seatBid.filter((bid) => bid.seat !== 'aic_ads');

  if (bidsIsNotDefault.length) {
    // sắp xếp theo giá cao -> thấp
    const highestPrices = bidsIsNotDefault.sort((a, b) => {
      return b.bid[0].price - a.bid[0].price;
    });

    /**
     * so sánh 2 bid đầu tiên
     */
    const isSamePrice = highestPrices[0] === highestPrices[1];

    if (isSamePrice) {
      const bidDefault = seatBid.filter((bid) => bid.seat === 'aic_ads')[0];
      return bidDefault;
    }

    return highestPrices[0];
  }

  return seatBid[0];
}
