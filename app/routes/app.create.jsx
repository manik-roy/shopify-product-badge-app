// @ts-nocheck
import { json, redirect } from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import {
  Button,
  Card,
  ColorPicker,
  EmptyState,
  FormLayout,
  Label,
  Layout,
  Page,
  Text,
  TextField,
  VerticalStack,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "~/shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  return json({ shop: session.shop.replace(".myshopify.com", "") });
};

const Create = () => {
  const submit = useSubmit();
  const [color, setColor] = useState({
    alpha: 1,
    brightness: 0.08125000000000004,
    hue: 255,
    saturation: 0.98125,
  });

  const [textColor, setTextColor] = useState({
    hue: 44,
    brightness: 1,
    saturation: 1,
    alpha: 1,
  });
  const backgroundColor = `hsla(${color.hue}, ${color.saturation * 100}%, ${
    color.brightness * 100
  }%, ${color.alpha})`;

  const textColorStyle = `hsla(${textColor.hue}, ${
    textColor.saturation * 100
  }%, ${textColor.brightness * 100}%, ${textColor.alpha})`;

  const [product, setProduct] = useState(null);
  const [badge, setBadge] = useState("");
  const handleSelect = async () => {
    try {
      const selected = await shopify.resourcePicker({ type: "product" });

      if (selected?.length > 0) {
        setProduct(selected[0]);
      }
    } catch (error) {}
  };
  console.log(product);
  const handleSubmit = () => {
    submit(
      { id: product.id, badge, backgroundColor, textColor: textColorStyle },
      { replace: false, method: "POST" }
    );
  };

  return (
    <Page backAction={{ content: "Products", url: "/app" }} title="Products">
      <VerticalStack>
        <Layout>
          <Layout.Section oneThird>
            <VerticalStack gap="5">
              <Card>
                <FormLayout>
                  <TextField
                    label="Badge name"
                    value={badge}
                    onChange={(value) => setBadge(value)}
                    autoComplete="off"
                  />
                  <Label id="bgColor">Color</Label>
                  <ColorPicker onChange={setColor} color={color} allowAlpha />
                  <Label id="textColor">Color</Label>
                  <ColorPicker
                    onChange={setTextColor}
                    color={textColor}
                    allowAlpha
                  />
                  <Button fullWidth onClick={handleSelect}>
                    Select Product{" "}
                  </Button>
                </FormLayout>
              </Card>
            </VerticalStack>
          </Layout.Section>

          <Layout.Section oneHalf>
            <VerticalStack gap="5">
              <Card padding={4}>
                {product ? (
                  <>
                    <Text as="h2" variant="bodyMd">
                      <span style={{ marginBottom: "5px" }}>
                        {product.title}
                      </span>
                    </Text>
                    <div className="badge-container">
                      <div className="image-container">
                        <span
                          style={{
                            backgroundColor: backgroundColor,
                            color: textColorStyle,
                          }}
                          className="image-badge"
                        >
                          {badge}
                        </span>
                        <img
                          className="image"
                          width="100%"
                          src={product.images[0].originalSrc}
                          alt={product.images[0].altText}
                        />
                      </div>
                    </div>
                    <Button primary onClick={handleSubmit}>
                      Save
                    </Button>
                  </>
                ) : (
                  <EmptyState
                    heading="Manage your product badges"
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      See your product badge preview select product and add
                      badge name, color
                    </p>
                  </EmptyState>
                )}
              </Card>
            </VerticalStack>
          </Layout.Section>
        </Layout>
      </VerticalStack>
    </Page>
  );
};

export default Create;

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const data = await request.formData();
  const productId = data.get("id");
  const badge = data.get("badge");
  const backgroundColor = data.get("backgroundColor");
  const textColor = data.get("textColor");
  try {
    const productBadgeMetafield = await admin.graphql(
      `#graphql
      query getProductMetaFieldID {
        product(id: "${productId}") {
          metafield(namespace: "custom", key: "product_badge") {
            id
          }
        }
      }`
    );
    const productBadgeMetafieldJson = await productBadgeMetafield.json();

    const { id } = productBadgeMetafieldJson.data.product.metafield;

    const productBadge = await admin.graphql(
      `#graphql
      mutation createProductBadge {
        metaobjectCreate(
          metaobject: {
            type: "product_badge"
            fields: [
              { key: "badge", value: "${badge}" }
              { key: "background_color", value: "${backgroundColor}" }
              { key: "text_color", value: "${textColor}" }
            ],
          }
        ) {
          metaobject {
            id
            type
          }
        }
      }`
    );
    const productBadgeJson = await productBadge.json();
    const response = await admin.graphql(
      `#graphql
      mutation updateProductMetafields($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
          }
          userErrors {
            message
            field
          }
        }
      }
    `,
      {
        variables: {
          input: {
            metafields: [
              {
                id,
                value: productBadgeJson.data.metaobjectCreate.metaobject.id,
              },
            ],
            id: productId,
          },
        },
      }
    );
    await response.json();
  } catch (error) {
    console.error(error);
  } finally {
    return redirect("/app/create");
  }
}
