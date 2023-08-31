import { useActionData, useSubmit } from "@remix-run/react";
import { Layout, LegacyCard, Page } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";

const Discount = () => {
  const submit = useSubmit();
  const actionData = useActionData();
  const activeDiscount = () => submit({}, { method: "POST" });
  console.log(actionData);
  return (
    <Page>
      <Layout>
        <Layout.Section>
          <LegacyCard
            title="Create 50% Discount"
            primaryFooterAction={{
              content: "Active Discount",
              onAction: () => {
                activeDiscount();
              },
            }}
          ></LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default Discount;

export async function action({ request }) {
  try {
    const { admin } = await authenticate.admin(request);
    const response = await admin.graphql(
      `#graphql
        mutation totalOrderValueDiscount {
          discountAutomaticAppCreate(
            automaticAppDiscount: {
              title: "Total Order Value Discount",
              functionId: "790fe92f-9745-4184-8c47-e2712737e266",
              startsAt: "2023-07-22T00:00:00"
            }
          ) {
            automaticAppDiscount {
              discountId
            }
            userErrors {
              message
              field
              extraInfo
              code
            }
          }
        }`
    );

    const responseJson = await response.json();
    console.log(responseJson);
    if (responseJson.errors?.length > 0) {
      return {
        error: responseJson.errors,
      };
    }
    return {
      data: responseJson.data.discountAutomaticAppCreate,
    };
  } catch (error) {
    return error;
  }
}
