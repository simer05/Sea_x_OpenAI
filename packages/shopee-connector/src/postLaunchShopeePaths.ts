export const postLaunchShopeePaths = {
  itemList: "/api/v2/product/get_item_list",
  itemBaseInfo: "/api/v2/product/get_item_base_info",
  orderList: "/api/v2/order/get_order_list",
  orderDetail: "/api/v2/order/get_order_detail",
  escrowDetail: "/api/v2/payment/get_escrow_detail"
};

export const needsShopeePermissionConfirmation = [
  "review/rating export endpoint",
  "chat or buyer-message endpoint",
  "marketing/ads reporting endpoint",
  "competitor benchmark source"
];
