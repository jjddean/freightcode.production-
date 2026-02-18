import json
import random
import os

DOC_TYPES = [
    "Commercial Invoice",
    "Packing List",
    "Bill of Lading",
    "Air Waybill",
    "Certificate of Origin",
    "Insurance Certificate"
]

def generate_cds_dataset(count=500):
    dataset = []
    
    for _ in range(count):
        doc_type = random.choice(DOC_TYPES)
        
        # Simulate common fields for customs declarations
        eori = f"GB{random.randint(100000000000, 999999999999)}"
        mrn = f"{random.randint(20, 26)}GB{random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')}{random.randint(1000000, 9999999)} "
        
        # Add some potential compliance issues
        is_compliant = random.random() > 0.2
        
        issues = []
        if not is_compliant:
            if random.random() > 0.5:
                issues.append("Missing EORI")
            if random.random() > 0.5:
                issues.append("Invalid MRN format")
            if random.random() > 0.5:
                issues.append("Document type mismatch")
            if random.random() > 0.5:
                issues.append("Incomplete value declaration")

        dataset.append({
            "document_type": doc_type,
            "eori": eori if "Missing EORI" not in issues else "",
            "mrn": mrn.strip() if "Invalid MRN format" not in issues else mrn[:5],
            "is_compliant": is_compliant,
            "issues": issues,
            "value": random.uniform(100, 100000),
            "currency": "GBP"
        })
    
    return dataset

if __name__ == "__main__":
    os.makedirs("ml/data", exist_ok=True)
    count = 1000
    dataset = generate_cds_dataset(count)
    
    with open("ml/data/cds_training.json", "w") as f:
        json.dump(dataset, f, indent=2)
        
    print(f"Generated {count} synthetic CDS declaration records in ml/data/cds_training.json")
