import os
import json
import csv

labels_dir = "ml/data/labels"
metadata_dir = "ml/data/metadata"
output_file = "ml/data/training_features.csv"

def extract():
    features = []
    
    # Process each shipment metadata file (ground truth)
    for meta_file in os.listdir(metadata_dir):
        if not meta_file.endswith(".json"): continue
        
        shipment_id = meta_file.replace(".json", "")
        with open(os.path.join(metadata_dir, meta_file)) as f:
            meta = json.load(f)
            
        # Try to find all 3 docs for this shipment
        bol_path = os.path.join(labels_dir, f"{shipment_id}_bol.json")
        inv_path = os.path.join(labels_dir, f"{shipment_id}_invoice.json")
        pl_path = os.path.join(labels_dir, f"{shipment_id}_packing_list.json")
        
        row = {
            "shipment_id": shipment_id,
            "bol_weight": 0,
            "inv_value": 0,
            "pl_weight": 0,
            "weight_diff": 0,
            "has_anomaly": 1 if meta["has_anomaly"] else 0
        }
        
        if os.path.exists(bol_path):
            with open(bol_path) as f:
                data = json.load(f)
                row["bol_weight"] = data.get("shippingWeight", 0)
                
        if os.path.exists(inv_path):
            with open(inv_path) as f:
                data = json.load(f)
                row["inv_value"] = data.get("totalValue", 0)
                
        if os.path.exists(pl_path):
            with open(pl_path) as f:
                data = json.load(f)
                row["pl_weight"] = data.get("shippingWeight", 0)
        
        # Derived Feature: Weight Difference
        row["weight_diff"] = abs(row["bol_weight"] - row["pl_weight"])
        
        features.append(row)
        
    # Save to CSV
    if features:
        keys = features[0].keys()
        with open(output_file, 'w', newline='') as f:
            dict_writer = csv.DictWriter(f, fieldnames=keys)
            dict_writer.writeheader()
            dict_writer.writerows(features)
        print(f"Extracted {len(features)} shipment feature vectors to {output_file}")

if __name__ == "__main__":
    extract()
