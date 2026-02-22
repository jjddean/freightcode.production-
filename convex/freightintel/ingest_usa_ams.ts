import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";

/**
 * Manual ingestion (for testing or specific dates)
 */
export const ingestUSAAMS = action({
    args: {
        fileUrl: v.string(),
        dateRange: v.string(),
    },
    handler: async (ctx, args) => {
        return await ingestUSAAMSData(ctx, args.fileUrl, args.dateRange);
    },
});

/**
 * Scheduled ingestion (auto-runs daily)
 */
export const scheduledIngest = internalAction({
    args: {},
    handler: async (ctx) => {
        const today = new Date();
        const dateRange = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        // USA AMS data sources (choose one based on your access)
        // NOTE: In a production environment, these URLs would be dynamic and authenticated
        const dataSources = [
            {
                name: "ImportKey",
                url: `https://importkey.com/api/ams/daily/${dateRange}`,
                needsAuth: true,
            },
            {
                name: "Trade.gov",
                url: `https://data.trade.gov/api/ams/${dateRange}`,
                needsAuth: false,
            },
            // Add your actual data source here
        ];

        console.log(`[USA AMS] Starting scheduled ingestion for ${dateRange}`);

        // Try each source until one works
        for (const source of dataSources) {
            try {
                console.log(`[USA AMS] Attempting download from ${source.name}`);

                // For now, use a placeholder URL for testing/demonstration
                // TODO: Replace with actual verified data source once you have API access
                const testUrl = "https://raw.githubusercontent.com/datasets/usa-ams-sample/master/data/ams-sample.csv";

                const result = await ingestUSAAMSData(ctx, testUrl, dateRange);

                console.log(`[USA AMS] Success! Imported ${result.imported} shipments from ${source.name}. Triggering profile rebuild...`);

                // Automatically rebuild profiles so data is visible immediately
                await ctx.runAction(api.freightintel.management.triggerProfileRebuild);

                return result;

            } catch (error: any) {
                console.error(`[USA AMS] Failed with ${source.name}:`, error.message);
                continue;
            }
        }

        console.error(`[USA AMS] All sources failed`);
        return { success: false, error: "All data sources failed" };
    },
});

/**
 * Core ingestion logic (shared by manual and scheduled)
 */
async function ingestUSAAMSData(
    ctx: any,
    fileUrl: string,
    dateRange: string
) {
    console.log(`[USA AMS] Processing ${fileUrl} for ${dateRange}`);

    try {
        // Download CSV
        const response = await fetch(fileUrl);

        if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            throw new Error("CSV file is empty or invalid");
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ""));

        let imported = 0;
        let skipped = 0;
        let errors = 0;

        // Process in batches to avoid timeout
        const BATCH_SIZE = 50; // Smaller batches for mutations

        for (let i = 1; i < lines.length; i += BATCH_SIZE) {
            const batch = lines.slice(i, Math.min(i + BATCH_SIZE, lines.length));

            for (const line of batch) {
                try {
                    // Robust line parsing (handles basic CSV, doesn't handle escaped commas in quotes yet)
                    const values = line.split(',').map(v => v.trim().replace(/["']/g, ""));

                    if (values.length < headers.length) {
                        skipped++;
                        continue;
                    }

                    // Build row object
                    const row: Record<string, string> = {};
                    headers.forEach((header, idx) => {
                        row[header] = values[idx] || "";
                    });

                    // Only import UK-bound shipments
                    const destCountry = row.destination_country || row.dest_country || row.port_of_unlading_country || "";
                    const isUKBound =
                        destCountry.toLowerCase().includes('united kingdom') ||
                        destCountry.toLowerCase() === 'uk' ||
                        destCountry.toLowerCase() === 'gb' ||
                        destCountry.toLowerCase().includes('britain');

                    if (!isUKBound) {
                        skipped++;
                        continue;
                    }

                    // Extract forwarder name
                    const forwarder =
                        row.forwarder ||
                        row.freight_forwarder ||
                        row.notify_party_name ||
                        row.notify_party ||
                        row.notify;

                    if (!forwarder || forwarder.length < 3) {
                        skipped++;
                        continue;
                    }

                    // Save shipment
                    await ctx.runMutation(internal.freightintel.mutations.saveShipment, {
                        billOfLading: row.bill_of_lading || row.bl_number || `BL-${Date.now()}-${i}`,
                        shipper: row.shipper_name || row.shipper || row.exporter || "Unknown",
                        consignee: row.consignee_name || row.consignee || row.importer || "Unknown",
                        forwarder: forwarder,
                        notifyParty: row.notify_party_name || row.notify_party || row.notify,
                        originCountry: row.origin_country || row.origin || row.foreign_port_country || "Unknown",
                        originPort: row.origin_port || row.port_of_loading || row.foreign_port,
                        destinationCountry: "United Kingdom",
                        destinationPort: row.destination_port || row.port_of_discharge || row.port_of_unlading,
                        hsCode: row.hs_code || row.hscode || row.harmonized_number,
                        commodity: row.commodity_description || row.commodity || row.description_of_goods,
                        containerType: row.container_type || row.equipment_description,
                        weight: row.weight ? parseFloat(row.weight) : undefined,
                        shipmentDate: row.shipment_date || row.actual_arrival_date
                            ? new Date(row.shipment_date || row.actual_arrival_date!).getTime()
                            : Date.now(),
                        dataSource: "usa_ams",
                    });

                    imported++;

                } catch (error: any) {
                    console.error(`[USA AMS] Error processing row:`, error.message);
                    errors++;
                }
                if (i % 500 === 0) {
                    console.log(`[USA AMS] Processed ${i}/${lines.length} lines...`);
                }
            }
        }

        console.log(`[USA AMS] Complete: ${imported} imported, ${skipped} skipped, ${errors} errors`);

        return {
            success: true,
            imported,
            skipped,
            errors,
            dateRange,
        };

    } catch (error: any) {
        console.error("[USA AMS] Ingestion failed:", error);
        return {
            success: false,
            error: error.message,
            imported: 0,
            skipped: 0,
        };
    }
}
