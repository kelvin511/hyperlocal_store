/**
 * Test data for the marketplace: approved vendors around Ahmedabad (plus one in
 * Mumbai for far-away checks), a pending and a disabled vendor for the admin
 * flows, grocery products with INR prices, India shipping options, and a test
 * customer with a saved location.
 *
 *   yarn seed:test-data        (from apps/backend)
 *
 * Re-running is safe: anything that already exists is skipped.
 *
 * Accounts created (password for all of them: admin@123):
 *   vendor1@example.com ... vendor5@example.com   approved vendors
 *   pending@example.com                           pending vendor
 *   disabled@example.com                          disabled vendor
 *   customer@example.com                          storefront customer
 */
import {
  createCustomerAccountWorkflow,
  createShippingOptionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import type { ExecArgs, MedusaContainer } from "@medusajs/framework/types"
import createVendorWorkflow from "../workflows/marketplace/create-vendor"
import createVendorProductWorkflow from "../workflows/marketplace/product/create-vendor-product"
import setVariantStockWorkflow from "../workflows/marketplace/product/set-variant-stock"
import updateCustomerLocationWorkflow from "../workflows/customer/update-customer-location"
import type { VendorStatus } from "../modules/marketplace/vendor-status"

const PASSWORD = "admin@123"
const DEFAULT_STOCK = 100

type SeedProduct = {
  title: string
  price: number
  stock?: number
  available?: boolean
}

type SeedVendor = {
  handle: string
  name: string
  email: string
  latitude: number
  longitude: number
  status: VendorStatus
  products: SeedProduct[]
}

const VENDORS: SeedVendor[] = [
  {
    handle: "fresh-basket-navrangpura",
    name: "Fresh Basket",
    email: "vendor1@example.com",
    latitude: 23.0395,
    longitude: 72.566,
    status: "approved",
    products: [
      { title: "Tomatoes 1 kg", price: 40 },
      { title: "Onions 1 kg", price: 35 },
      { title: "Potatoes 1 kg", price: 30 },
      { title: "Bananas (dozen)", price: 60, stock: 8 },
      { title: "Coriander Bunch", price: 15, available: false },
    ],
  },
  {
    handle: "green-mandi-satellite",
    name: "Green Mandi",
    email: "vendor2@example.com",
    latitude: 23.03,
    longitude: 72.5072,
    status: "approved",
    products: [
      { title: "Spinach Bunch", price: 25 },
      { title: "Cauliflower 1 pc", price: 45 },
      { title: "Carrots 1 kg", price: 50 },
      { title: "Green Chillies 250 g", price: 20 },
      { title: "Apples 1 kg", price: 180, stock: 0 },
    ],
  },
  {
    handle: "daily-dairy-maninagar",
    name: "Daily Dairy",
    email: "vendor3@example.com",
    latitude: 22.9962,
    longitude: 72.603,
    status: "approved",
    products: [
      { title: "Full Cream Milk 1 L", price: 68 },
      { title: "Curd 500 g", price: 40 },
      { title: "Paneer 200 g", price: 90, stock: 12 },
      { title: "Butter 100 g", price: 58, available: false },
      { title: "Desi Ghee 500 ml", price: 340 },
    ],
  },
  {
    handle: "organic-hub-gandhinagar",
    name: "Organic Hub",
    email: "vendor4@example.com",
    latitude: 23.2156,
    longitude: 72.6369,
    status: "approved",
    products: [
      { title: "Organic Basmati Rice 1 kg", price: 160 },
      { title: "Toor Dal 1 kg", price: 150 },
      { title: "Groundnut Oil 1 L", price: 320 },
      { title: "Jaggery 500 g", price: 55 },
    ],
  },
  {
    handle: "mumbai-bazaar",
    name: "Mumbai Bazaar",
    email: "vendor5@example.com",
    latitude: 19.076,
    longitude: 72.8777,
    status: "approved",
    products: [
      { title: "Alphonso Mangoes (dozen)", price: 900, stock: 0 },
      { title: "Pav 8 pcs", price: 30 },
      { title: "Kokum 100 g", price: 90 },
    ],
  },
  {
    handle: "pending-pantry",
    name: "Pending Pantry",
    email: "pending@example.com",
    latitude: 23.0225,
    longitude: 72.5714,
    status: "pending",
    products: [],
  },
  {
    handle: "disabled-store",
    name: "Disabled Store",
    email: "disabled@example.com",
    latitude: 23.05,
    longitude: 72.55,
    status: "disabled",
    products: [],
  },
]

const CUSTOMER = {
  email: "customer@example.com",
  first_name: "Test",
  last_name: "Customer",
  location: {
    latitude: 23.0395,
    longitude: 72.566,
    address: "Navrangpura, Ahmedabad",
  },
}

const authRequest = (email: string) =>
  ({
    url: "",
    headers: {},
    query: {},
    protocol: "http",
    body: { email, password: PASSWORD },
  }) as never

async function getOrCreateAuthIdentityId(
  container: MedusaContainer,
  email: string
): Promise<string> {
  const auth = container.resolve(Modules.AUTH)

  const existing = await auth.listProviderIdentities({
    entity_id: email,
    provider: "emailpass",
  })

  if (existing.length) {
    return existing[0].auth_identity_id as string
  }

  const { success, authIdentity, error } = await auth.register(
    "emailpass",
    authRequest(email)
  )

  if (!success || !authIdentity) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Could not create login for ${email}: ${error}`
    )
  }

  return authIdentity.id
}

async function ensureInrDefaultCurrency(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: stores } = await query.graph({
    entity: "store",
    fields: [
      "id",
      "supported_currencies.currency_code",
      "supported_currencies.is_default",
    ],
  })

  const store = stores[0]
  const currencies = (store?.supported_currencies ?? []).filter(Boolean)

  if (!store) {
    logger.warn("No store found, skipping currency setup")
    return
  }

  const inr = currencies.find((currency) => currency?.currency_code === "inr")

  if (inr?.is_default) {
    logger.info("INR is already the default currency")
    return
  }

  const next = currencies
    .filter((currency) => currency?.currency_code !== "inr")
    .map((currency) => ({
      currency_code: currency!.currency_code as string,
      is_default: false,
    }))

  next.push({ currency_code: "inr", is_default: true })

  await updateStoresWorkflow(container).run({
    input: { selector: { id: store.id }, update: { supported_currencies: next } },
  })

  logger.info("Set INR as the default store currency")
}

async function ensureIndiaShipping(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillment = container.resolve(Modules.FULFILLMENT)

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "countries.iso_2"],
  })

  const indiaRegion = regions.find((region) =>
    (region.countries ?? []).some((country) => country?.iso_2 === "in")
  )

  if (!indiaRegion) {
    logger.warn(
      "No region contains India (in). Create an India region in the admin, then run this again."
    )
    return
  }

  const { data: zones } = await query.graph({
    entity: "service_zone",
    fields: ["id", "name", "geo_zones.country_code"],
  })

  let zoneId: string | undefined = zones.find((candidate) =>
    (candidate.geo_zones ?? []).some((geo) => geo?.country_code === "in")
  )?.id

  if (!zoneId) {
    const { data: locations } = await query.graph({
      entity: "stock_location",
      fields: ["id", "fulfillment_sets.id", "fulfillment_sets.type"],
    })

    const fulfillmentSet = locations
      .flatMap((location) => location.fulfillment_sets ?? [])
      .find((set) => set?.type === "shipping")

    if (!fulfillmentSet) {
      logger.warn("No shipping fulfillment set found, skipping India shipping")
      return
    }

    const [created] = await fulfillment.createServiceZones([
      {
        name: "India",
        fulfillment_set_id: fulfillmentSet.id,
        geo_zones: [{ country_code: "in", type: "country" }],
      },
    ])

    zoneId = created.id
    logger.info("Created India service zone")
  }

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id"],
    filters: { service_zone_id: zoneId },
  })

  if (options.length) {
    logger.info("India shipping options already exist")
    return
  }

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: { type: "default" },
  })

  const rules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ]

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: zoneId,
        shipping_profile_id: profiles[0].id,
        type: {
          label: "Standard",
          description: "Delivered within 2 hours.",
          code: "standard",
        },
        prices: [
          { currency_code: "inr", amount: 40 },
          { region_id: indiaRegion.id, amount: 40 },
        ],
        rules,
      },
      {
        name: "Express Delivery",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: zoneId,
        shipping_profile_id: profiles[0].id,
        type: {
          label: "Express",
          description: "Delivered within 45 minutes.",
          code: "express",
        },
        prices: [
          { currency_code: "inr", amount: 99 },
          { region_id: indiaRegion.id, amount: 99 },
        ],
        rules,
      },
    ],
  })

  logger.info("Created India shipping options (Standard 40 INR, Express 99 INR)")
}

async function seedVendor(container: MedusaContainer, seed: SeedVendor) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: existing } = await query.graph({
    entity: "vendor",
    fields: ["id", "products.title", "products.variants.id"],
    filters: { handle: seed.handle },
  })

  let vendorId = existing[0]?.id as string | undefined
  const existingVariants = new Map(
    ((existing[0]?.products ?? []) as {
      title: string
      variants?: { id: string }[]
    }[])
      .filter(Boolean)
      .map((product) => [product.title, product.variants?.[0]?.id])
  )

  if (!vendorId) {
    const authIdentityId = await getOrCreateAuthIdentityId(container, seed.email)

    const { result } = await createVendorWorkflow(container).run({
      input: {
        name: seed.name,
        handle: seed.handle,
        latitude: seed.latitude,
        longitude: seed.longitude,
        status: seed.status,
        admin: { email: seed.email, first_name: seed.name },
        authIdentityId,
      },
    })

    vendorId = result.vendor.id as string
    logger.info(`Created vendor ${seed.name} (${seed.status})`)
  } else {
    logger.info(`Vendor ${seed.name} already exists`)
  }

  for (const [index, product] of seed.products.entries()) {
    const stock = product.stock ?? 50
    const existingVariantId = existingVariants.get(product.title)

    if (existingVariants.has(product.title)) {
      if (existingVariantId) {
        await setVariantStockWorkflow(container).run({
          input: { variant_id: existingVariantId, quantity: stock },
        })
        logger.info(`  stock for ${product.title}: ${stock}`)
      }
      continue
    }

    await createVendorProductWorkflow(container).run({
      input: {
        vendor_id: vendorId,
        title: product.title,
        price: product.price,
        stock,
        available: product.available ?? true,
        thumbnail: `https://picsum.photos/seed/${seed.handle}-${index}/600/600`,
      },
    })

    logger.info(`  added product ${product.title} (stock ${stock})`)
  }
}

async function ensureStockForAllProducts(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: [
      "id",
      "manage_inventory",
      "product.title",
      "inventory_items.inventory_item_id",
    ],
  })

  const untracked = variants.filter(
    (variant) =>
      !variant.manage_inventory || !(variant.inventory_items ?? []).length
  )

  for (const variant of untracked) {
    await setVariantStockWorkflow(container).run({
      input: { variant_id: variant.id, quantity: DEFAULT_STOCK },
    })
    logger.info(
      `Added stock ${DEFAULT_STOCK} to ${variant.product?.title ?? variant.id}`
    )
  }

  logger.info(
    untracked.length
      ? `Added default stock to ${untracked.length} untracked variant(s)`
      : "All variants already track stock"
  )
}

async function seedCustomer(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: existing } = await query.graph({
    entity: "customer",
    fields: ["id"],
    filters: { email: CUSTOMER.email },
  })

  let customerId = existing[0]?.id as string | undefined

  if (!customerId) {
    const authIdentityId = await getOrCreateAuthIdentityId(
      container,
      CUSTOMER.email
    )

    const { result } = await createCustomerAccountWorkflow(container).run({
      input: {
        authIdentityId,
        customerData: {
          email: CUSTOMER.email,
          first_name: CUSTOMER.first_name,
          last_name: CUSTOMER.last_name,
        },
      },
    })

    customerId = result.id
    logger.info(`Created customer ${CUSTOMER.email}`)
  } else {
    logger.info(`Customer ${CUSTOMER.email} already exists`)
  }

  await updateCustomerLocationWorkflow(container).run({
    input: { customer_id: customerId, location: CUSTOMER.location },
  })

  logger.info(`Saved location for ${CUSTOMER.email} (${CUSTOMER.location.address})`)
}

export default async function seedMarketplaceTestData({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  await ensureInrDefaultCurrency(container)
  await ensureIndiaShipping(container)

  for (const vendor of VENDORS) {
    await seedVendor(container, vendor)
  }

  await ensureStockForAllProducts(container)

  await seedCustomer(container)

  logger.info(`Done. Log in to any seeded account with the password ${PASSWORD}`)
}
