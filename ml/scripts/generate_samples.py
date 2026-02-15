import os
import random
import json

# Templates for diverse logistics documents
templ_shipper = ["Acme Shenzhen Ltd", "Global Cargo Hamburg", "Tokyo Tech Exports"]
templ_consignee = ["US Retail Corp", "UK Logistics Hub", "Berlin Imports Gmbh"]
templ_goods = ["Electronics - 500kg", "Textiles - 1200 units", "Auto Parts - 5 crates"]

def generate_shipment_group(shipment_id):
    """
    Generates a set of linked documents for a single shipment.
    Occasionally introduces an anomaly (e.g., weight mismatch).
    """
    shipper = random.choice(templ_shipper)
    consignee = random.choice(templ_consignee)
    goods = random.choice(templ_goods)
    base_weight = random.randint(100, 5000)
    
    # Introduce Anomaly? (20% chance)
    has_anomaly = random.random() < 0.2
    pl_weight = base_weight
    bol_weight = base_weight
    
    anomaly_reason = None
    if has_anomaly:
        bol_weight += random.randint(50, 200) # Mismatch!
        anomaly_reason = "weight_mismatch"

    # BOL
    bol = f"BILL OF LADING\nShipmentRef: {shipment_id}\nSHIPPER: {shipper}\nCONSIGNEE: {consignee}\nWEIGHT: {bol_weight} KG"
    
    # Invoice
    invoice = f"COMMERCIAL INVOICE\nShipmentRef: {shipment_id}\nSELLER: {shipper}\nBUYER: {consignee}\nTOTAL: ${random.randint(5000, 50000)}.00"
    
    # Packing List
    pl = f"PACKING LIST\nShipmentRef: {shipment_id}\nSHIPPER: {shipper}\nWEIGHT: {pl_weight} KG"

    return {
        "shipment_id": shipment_id,
        "docs": {
            "bol": bol,
            "invoice": invoice,
            "packing_list": pl
        },
        "metadata": {
            "has_anomaly": has_anomaly,
            "anomaly_type": anomaly_reason
        }
    }

if __name__ == "__main__":
    os.makedirs("ml/data/samples", exist_ok=True)
    os.makedirs("ml/data/metadata", exist_ok=True)
    
    for i in range(1, 31): # Generate 30 shipment clusters (90 documents)
        ship_id = f"SHIP-2026-{i:04d}"
        group = generate_shipment_group(ship_id)
        
        # Save docs
        for dtype, content in group["docs"].items():
            with open(f"ml/data/samples/{ship_id}_{dtype}.txt", "w") as f:
                f.write(content)
        
        # Save ground truth metadata (for ML validation)
        with open(f"ml/data/metadata/{ship_id}.json", "w") as f:
            json.dump(group["metadata"], f, indent=2)
            
    print("Generated 30 linked shipment clusters (90 docs) in ml/data/samples")
