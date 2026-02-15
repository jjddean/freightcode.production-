import json
import random
import os

# 6-digit HS Code mapping for diverse industries
HS_CATALOG = {
    "Electronics": {
        "847130": ["Portable automatic data processing machines", "Laptop computers", "Tablets", "Notebooks"],
        "851713": ["Smartphones", "Mobile phones for cellular networks", "Cell phones"],
        "850760": ["Lithium-ion accumulators", "Lithium batteries", "Rechargeable batts"],
        "854231": ["Electronic integrated circuits", "Processors", "CPUs", "Microcontrollers"],
        "852852": ["Monitors", "Computer displays", "LCD screens"]
    },
    "Textiles": {
        "610910": ["T-shirts, singlets and other vests, knitted or crocheted, of cotton", "Cotton t-shirts", "Jersey shirts"],
        "620342": ["Trousers, bib and brace overalls, breeches and shorts, of cotton", "Denim jeans", "Cotton trousers"],
        "520512": ["Cotton yarn (other than sewing thread)", "Pure cotton yarn", "Uncombed cotton"],
        "540752": ["Woven fabrics of synthetic filament yarn", "Polyester fabric", "Nylon cloth"]
    },
    "Chemicals": {
        "310210": ["Urea, whether or not in aqueous solution", "Urea fertilizer", "Agricultural urea"],
        "380891": ["Insecticides", "Pesticide spray", "Bug repellent"],
        "340220": ["Surface-active preparations", "Cleaning agents", "Industrial detergent"]
    },
    "Automotive": {
        "870830": ["Brakes and servo-brakes; parts thereof", "Brake pads", "Brake discs", "Brake calipers"],
        "851110": ["Sparking plugs", "Engine spark plugs", "Ignition plugs"],
        "870891": ["Radiators and parts thereof", "Engine radiators", "Cooling units"],
        "850131": ["Motors of an output not exceeding 750 W", "Electric motors", "DC motors"]
    },
    "Industrial": {
        "730419": ["Line pipe of a kind used for oil or gas pipelines", "Steel pipes", "Seamless tubing"],
        "848180": ["Other appliances (valves)", "Industrial valves", "Control valves", "Ball valves"],
        "841370": ["Other centrifugal pumps", "Water pumps", "Hydraulic pumps", "Circulation pumps"]
    }
}

def generate_hs_dataset(count=500):
    dataset = []
    industries = list(HS_CATALOG.keys())
    
    for _ in range(count):
        industry = random.choice(industries)
        codes = list(HS_CATALOG[industry].keys())
        hs_code = random.choice(codes)
        base_descriptions = HS_CATALOG[industry][hs_code]
        
        # Add some noise/variation to the descriptions
        original_desc = random.choice(base_descriptions)
        prefixes = ["", "Shipment of ", "Bulk order of ", "Ref: ", "High quality "]
        suffixes = ["", " - standard version", " (industrial grade)", " - assorted", " for export"]
        
        final_desc = f"{random.choice(prefixes)}{original_desc}{random.choice(suffixes)}".strip()
        
        dataset.append({
            "description": final_desc,
            "hs_code": hs_code,
            "industry": industry
        })
    
    return dataset

if __name__ == "__main__":
    os.makedirs("ml/data", exist_ok=True)
    count = 600
    dataset = generate_hs_dataset(count)
    
    with open("ml/data/hs_codes_training.json", "w") as f:
        json.dump(dataset, f, indent=2)
        
    print(f"Generated {count} synthetic HS code pairs in ml/data/hs_codes_training.json")
