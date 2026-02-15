import json
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

data_file = "ml/data/hs_codes_training.json"
model_out = "ml/models/hs_classifier.joblib"
vectorizer_out = "ml/models/hs_vectorizer.joblib"

def train_classifier():
    # Load data
    with open(data_file, 'r') as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    
    # Vectorize text
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')
    X = vectorizer.fit_transform(df["description"])
    y = df["hs_code"]
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Model: Random Forest (Fast and effective for text classification)
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    # Validate
    y_pred = clf.predict(X_test)
    print("--- HS Code Classifier Performance ---")
    print(classification_report(y_test, y_pred))
    
    # Save model
    os.makedirs("ml/models", exist_ok=True)
    joblib.dump(clf, model_out)
    joblib.dump(vectorizer, vectorizer_out)
    print(f"Model saved to {model_out}")

if __name__ == "__main__":
    import os
    train_classifier()
