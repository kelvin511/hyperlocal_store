import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export type SetVariantStockStepInput = {
  variant_id: string
  quantity: number
  location_id?: string
}

type Level = { location_id: string; stocked_quantity: number }

type VariantInventory = {
  id: string
  manage_inventory?: boolean | null
  inventory_items?: {
    inventory_item_id: string
    inventory?: { location_levels?: Level[] } | null
  }[]
}

const setVariantStockStep = createStep(
  "set-variant-stock",
  async (input: SetVariantStockStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const inventoryService = container.resolve(Modules.INVENTORY)
    const productService = container.resolve(Modules.PRODUCT)

    const { data: variants } = await query.graph({
      entity: "variant",
      fields: [
        "id",
        "manage_inventory",
        "inventory_items.inventory_item_id",
        "inventory_items.inventory.location_levels.location_id",
        "inventory_items.inventory.location_levels.stocked_quantity",
      ],
      filters: { id: input.variant_id },
    })

    const variant = variants[0] as VariantInventory | undefined

    if (!variant) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Variant not found")
    }

    let locationId = input.location_id

    if (!locationId) {
      const { data: stores } = await query.graph({
        entity: "store",
        fields: ["default_sales_channel_id"],
      })

      const defaultChannelId = stores[0]?.default_sales_channel_id

      if (defaultChannelId) {
        const { data: channels } = await query.graph({
          entity: "sales_channel",
          fields: ["id", "stock_locations.id"],
          filters: { id: defaultChannelId },
        })

        locationId = channels[0]?.stock_locations?.[0]?.id
      }
    }

    if (!locationId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No stock location is linked to the default sales channel"
      )
    }

    let inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id
    let createdItem = false

    if (!inventoryItemId) {
      const item = await inventoryService.createInventoryItems({
        requires_shipping: true,
      })

      inventoryItemId = item.id
      createdItem = true

      await link.create({
        [Modules.PRODUCT]: { variant_id: variant.id },
        [Modules.INVENTORY]: { inventory_item_id: inventoryItemId },
      })
    }

    if (!variant.manage_inventory) {
      await productService.updateProductVariants(variant.id, {
        manage_inventory: true,
      })
    }

    const existingLevel = (
      variant.inventory_items?.[0]?.inventory?.location_levels ?? []
    ).find((level) => level.location_id === locationId)

    if (existingLevel) {
      await inventoryService.updateInventoryLevels([
        {
          inventory_item_id: inventoryItemId,
          location_id: locationId,
          stocked_quantity: input.quantity,
        },
      ])
    } else {
      await inventoryService.createInventoryLevels([
        {
          inventory_item_id: inventoryItemId,
          location_id: locationId,
          stocked_quantity: input.quantity,
        },
      ])
    }

    return new StepResponse(
      { variant_id: variant.id, quantity: input.quantity },
      {
        variant_id: variant.id,
        inventory_item_id: inventoryItemId,
        location_id: locationId,
        previous_quantity: existingLevel?.stocked_quantity ?? null,
        created_item: createdItem,
        was_managed: !!variant.manage_inventory,
      }
    )
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const inventoryService = container.resolve(Modules.INVENTORY)
    const productService = container.resolve(Modules.PRODUCT)

    if (previous.previous_quantity !== null) {
      await inventoryService.updateInventoryLevels([
        {
          inventory_item_id: previous.inventory_item_id,
          location_id: previous.location_id,
          stocked_quantity: previous.previous_quantity,
        },
      ])
    } else {
      const levels = await inventoryService.listInventoryLevels({
        inventory_item_id: previous.inventory_item_id,
        location_id: previous.location_id,
      })

      if (levels.length) {
        await inventoryService.deleteInventoryLevels(levels.map((l) => l.id))
      }
    }

    if (!previous.was_managed) {
      await productService.updateProductVariants(previous.variant_id, {
        manage_inventory: false,
      })
    }
  })

export default setVariantStockStep
