// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").InputQuery} InputQuery
 * @typedef {import("../generated/api").FunctionResult} FunctionResult
 */

/**
 * @type {FunctionResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

export default /**
 * @param {InputQuery} input
 * @returns {FunctionResult}
 */
(input) => {
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );

  if (input?.cart?.cost?.subtotalAmount.amount > 500) {
    return {
      discountApplicationStrategy: DiscountApplicationStrategy.First,
      discounts: [
        {
          conditions: [],
          targets: [
            {
              orderSubtotal: {
                excludedVariantIds: [],
              },
            },
          ],
          message: "$50 of buying more than $500",
          value: {
            fixedAmount: {
              amount: 50,
            },
          },
        },
      ],
    };
  }
  return EMPTY_DISCOUNT;
};
