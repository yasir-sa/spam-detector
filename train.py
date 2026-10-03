import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
from sklearn.metrics import accuracy_score
import joblib

# 1. Data load
df = pd.read_csv("sms.tsv", sep="\t", header=None, names=["label", "message"])

# 2. Clean - empty & duplicate rows remove
df = df.dropna().drop_duplicates()

# 3. Train / Test split (80% padikka, 20% test panna)
X_train, X_test, y_train, y_test = train_test_split(
    df["message"], df["label"], test_size=0.2, random_state=42
)

# 4. Model: text -> numbers (TF-IDF) -> Naive Bayes
model = make_pipeline(TfidfVectorizer(stop_words="english"), MultinomialNB())
model.fit(X_train, y_train)

# 5. Accuracy check
pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, pred))

# 6. Model save
joblib.dump(model, "spam_model.pkl")
print("Model saved!")
